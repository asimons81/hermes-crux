"""Crux's bounded affine decision engine. No execution of user-supplied code."""
from __future__ import annotations

from fractions import Fraction
from itertools import combinations
import math
import re

MAX_NUMBER = 1e12
ID_RE = re.compile(r"^[a-z][a-z0-9_-]{0,63}$")


def number(value, path):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{path}: expected a finite number")
    if abs(value) > MAX_NUMBER or not math.isfinite(value):
        raise ValueError(f"{path}: number must be finite and within ±1e12")
    return value


def identifier(value, path):
    if not isinstance(value, str) or not ID_RE.fullmatch(value):
        raise ValueError(f"{path}: use a lowercase id with letters, digits, hyphens or underscores")
    return value


def text(value, path, maximum=160):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f"{path}: expected nonempty text up to {maximum} characters")
    return value.strip()


def collection(value, path, maximum, minimum=1):
    if not isinstance(value, list) or not minimum <= len(value) <= maximum:
        raise ValueError(f"{path}: expected {minimum} to {maximum} entries")
    ids = []
    for row in value:
        if not isinstance(row, dict):
            raise ValueError(f"{path}: entries must be objects")
        ids.append(identifier(row.get('id'), f'{path}.id'))
    if len(set(ids)) != len(ids):
        raise ValueError(f"{path}: duplicate ids")
    return value


def validate_study(raw):
    if not isinstance(raw, dict):
        raise ValueError('study must be an object')
    study = {'title': text(raw.get('title'), 'title'), 'question': text(raw.get('question'), 'question', 2000)}
    if raw.get('description') is not None:
        study['description'] = text(raw['description'], 'description', 2000)
    assumptions = []
    for item in collection(raw.get('assumptions'), 'assumptions', 8):
        aid = item['id']
        low, high = number(item.get('min'), f'{aid}.min'), number(item.get('max'), f'{aid}.max')
        default = number(item.get('default'), f'{aid}.default')
        step = number(item.get('step', (high - low) / 100), f'{aid}.step')
        if low >= high or not low <= default <= high or step <= 0:
            raise ValueError(f'{aid}: require min < max, default within range and positive step')
        kind = item.get('kind', 'estimate')
        if kind not in ('measured', 'estimate', 'preference'):
            raise ValueError(f'{aid}.kind must be measured, estimate or preference')
        row = {'id': aid, 'label': text(item.get('label'), f'{aid}.label'), 'unit': str(item.get('unit', ''))[:40],
               'min': low, 'max': high, 'default': default, 'step': step, 'kind': kind}
        if item.get('source') is not None:
            source = item['source']
            if not isinstance(source, dict):
                raise ValueError(f'{aid}.source must be an object')
            row['source'] = {'label': text(source.get('label'), f'{aid}.source.label', 500)}
            if source.get('url'):
                url = text(source['url'], f'{aid}.source.url', 2048)
                if not url.startswith(('https://', 'http://')):
                    raise ValueError(f'{aid}.source.url must be an HTTP(S) URL')
                row['source']['url'] = url
        assumptions.append(row)
    study['assumptions'] = assumptions
    aids = {item['id'] for item in assumptions}
    study['metrics'] = [{'id': item['id'], 'label': text(item.get('label'), 'metric.label'), 'unit': str(item.get('unit', ''))[:40]}
                        for item in collection(raw.get('metrics'), 'metrics', 8)]
    mids = {item['id'] for item in study['metrics']}
    candidates = []
    for item in collection(raw.get('candidates'), 'candidates', 12):
        row = {'id': item['id'], 'label': text(item.get('label'), 'candidate.label'), 'metrics': {}}
        if item.get('description'):
            row['description'] = text(item['description'], 'candidate.description', 1000)
        expressions = item.get('metrics')
        if not isinstance(expressions, dict) or set(expressions) != mids:
            raise ValueError(f"{item['id']}: each declared metric needs one affine formula")
        for mid, expr in expressions.items():
            if not isinstance(expr, dict) or set(expr) - {'constant', 'coefficients'}:
                raise ValueError(f'{mid}: formula must contain only constant and coefficients')
            coeffs = expr.get('coefficients', {})
            if not isinstance(coeffs, dict) or set(coeffs) - aids:
                raise ValueError(f'{mid}: coefficients must name declared assumptions')
            row['metrics'][mid] = {'constant': number(expr.get('constant', 0), f'{mid}.constant'),
                                   'coefficients': {key: number(val, f'{mid}.{key}') for key, val in coeffs.items()}}
        candidates.append(row)
    study['candidates'] = candidates
    constraints = []
    for item in collection(raw.get('constraints', []), 'constraints', 10, 0):
        mid, op = item.get('metric_id'), item.get('operator')
        if not isinstance(mid, str) or mid not in mids or op not in ('<=', '>='):
            raise ValueError('constraint needs a declared metric_id and <= or >= operator')
        constraints.append({'id': item['id'], 'label': text(item.get('label'), 'constraint.label'), 'metric_id': mid,
                            'operator': op, 'value': number(item.get('value'), 'constraint.value')})
    study['constraints'] = constraints
    objective = raw.get('objective')
    if not isinstance(objective, dict) or not isinstance(objective.get('metric_id'), str) or objective.get('metric_id') not in mids or objective.get('direction') not in ('min', 'max'):
        raise ValueError('objective needs a declared metric_id and direction min or max')
    study['objective'] = {'metric_id': objective['metric_id'], 'direction': objective['direction']}
    return study


def rational(value):
    return value if isinstance(value, Fraction) else Fraction(str(value))


def resolve_values(study, values=None):
    values = {} if values is None else values
    if not isinstance(values, dict):
        raise ValueError('values must be an object')
    if set(values) - {item['id'] for item in study['assumptions']}:
        raise ValueError('values contains an unknown assumption')
    resolved = {}
    for item in study['assumptions']:
        value = values.get(item['id'], item['default'])
        if isinstance(value, Fraction):
            valid = rational(item['min']) <= value <= rational(item['max'])
        else:
            number(value, item['id'])
            valid = item['min'] <= value <= item['max']
        if not valid:
            raise ValueError(f"{item['id']}: value is outside the declared input range")
        resolved[item['id']] = rational(value)
    return resolved


def affine(expr, values):
    return rational(expr['constant']) + sum((rational(coefficient) * values[aid] for aid, coefficient in expr['coefficients'].items()), Fraction())


def point(study, values):
    """Exact decimal-rational arithmetic; equality is a genuine tie, no epsilon."""
    objective = study['objective']
    sign = 1 if objective['direction'] == 'min' else -1
    records = []
    for candidate in study['candidates']:
        metrics = {mid: affine(expr, values) for mid, expr in candidate['metrics'].items()}
        failed, details = [], []
        for constraint in study['constraints']:
            actual, target = metrics[constraint['metric_id']], rational(constraint['value'])
            slack = actual - target if constraint['operator'] == '>=' else target - actual
            if slack < 0:
                failed.append(constraint['id'])
            details.append({'id': constraint['id'], 'value': float(actual), 'slack': float(slack), 'passed': slack >= 0})
        records.append({'candidate_id': candidate['id'], 'feasible': not failed, 'metrics': {mid: float(val) for mid, val in metrics.items()},
                        'failed_constraints': failed, 'constraint_details': details, 'objective_value': float(metrics[objective['metric_id']]),
                        '_objective': metrics[objective['metric_id']]})
    records.sort(key=lambda row: (not row['feasible'], sign * row['_objective']))
    feasible = [row for row in records if row['feasible']]
    winners = [row['candidate_id'] for row in feasible if row['_objective'] == feasible[0]['_objective']] if feasible else []
    previous, rank = None, 0
    for index, row in enumerate(feasible):
        if previous is None or previous != row['_objective']:
            rank = index + 1
        row['rank'], previous = rank, row['_objective']
    for row in records:
        row.setdefault('rank', None)
        row.pop('_objective')
    return {'values': {key: float(val) for key, val in values.items()}, 'rankings': records, 'winner_ids': winners,
            'feasible_ids': [row['candidate_id'] for row in feasible], 'status': 'infeasible' if not winners else ('tie' if len(winners) > 1 else 'winner')}


def minimum_conflict(study, current):
    """A cardinality-minimum impossible subset over this finite candidate set."""
    if current['feasible_ids'] or not study['constraints']:
        return None
    constraint_ids = [item['id'] for item in study['constraints']]
    failures = [set(row['failed_constraints']) for row in current['rankings']]
    for size in range(1, len(constraint_ids) + 1):
        for subset in combinations(constraint_ids, size):
            chosen = set(subset)
            if all(chosen & candidate_failures for candidate_failures in failures):
                return {'constraint_ids': list(subset), 'candidate_ids': [row['candidate_id'] for row in current['rankings']],
                        'scope': 'current_point_declared_candidates', 'minimum_cardinality': True,
                        'explanation': 'No declared candidate satisfies this subset at the current input values.'}
    return None


def axis_analysis(study, values, axis):
    identifier(axis, 'axis')
    assumption = next((item for item in study['assumptions'] if item['id'] == axis), None)
    if assumption is None:
        raise ValueError('axis must name a declared assumption')
    low, high = rational(assumption['min']), rational(assumption['max'])
    fixed = dict(values, **{axis: Fraction()})

    def line(candidate, metric):
        expr = candidate['metrics'][metric]
        return affine(expr, fixed), rational(expr['coefficients'].get(axis, 0))

    events = []
    for left, right in combinations(study['candidates'], 2):
        a, b = line(left, study['objective']['metric_id'])
        c, d = line(right, study['objective']['metric_id'])
        if b != d:
            crossing = (c - a) / (b - d)
            if low <= crossing <= high:
                events.append((crossing, {'kind': 'rank', 'candidate_ids': [left['id'], right['id']]}))
    for candidate in study['candidates']:
        for constraint in study['constraints']:
            intercept, slope = line(candidate, constraint['metric_id'])
            if slope:
                crossing = (rational(constraint['value']) - intercept) / slope
                if low <= crossing <= high:
                    events.append((crossing, {'kind': 'constraint', 'candidate_ids': [candidate['id']], 'constraint_id': constraint['id']}))
    cuts = sorted({low, high, *(value for value, _ in events)})
    regimes = []
    for start, end in zip(cuts, cuts[1:]):
        at = point(study, dict(values, **{axis: (start + end) / 2}))
        regimes.append({'from': float(start), 'to': float(end), 'exact_from': str(start), 'exact_to': str(end),
                        'winner_ids': at['winner_ids'], 'feasible_ids': at['feasible_ids']})
    boundaries = []
    for value, event in sorted(events, key=lambda item: item[0]):
        at = point(study, dict(values, **{axis: value}))
        boundaries.append(dict(event, value=float(value), exact_value=str(value), winner_ids=at['winner_ids'], feasible_ids=at['feasible_ids']))
    endpoints = []
    for value in (low, high):
        at = point(study, dict(values, **{axis: value}))
        endpoints.append({'value': float(value), 'exact_value': str(value), 'winner_ids': at['winner_ids'], 'feasible_ids': at['feasible_ids']})
    return {'assumption_id': axis, 'regimes': regimes, 'boundaries': boundaries, 'endpoints': endpoints,
            'method': 'analytic_affine_rational', 'interval_semantics': 'open_interiors; boundaries and endpoints evaluated separately',
            'scope': 'other_assumptions_fixed_at_current_values'}


def atlas_analysis(study, values, axes, resolution=33):
    if not isinstance(axes, list) or len(axes) != 2 or axes[0] == axes[1]:
        raise ValueError('axes needs two distinct assumption ids')
    known = {item['id']: item for item in study['assumptions']}
    if any(not isinstance(axis, str) or axis not in known for axis in axes):
        raise ValueError('axes must name declared assumptions')
    if isinstance(resolution, bool) or not isinstance(resolution, int) or not 5 <= resolution <= 61:
        raise ValueError('resolution must be an integer from 5 to 61')
    coordinates = [[rational(known[aid]['min']) + (rational(known[aid]['max']) - rational(known[aid]['min'])) * index / (resolution - 1)
                    for index in range(resolution)] for aid in axes]
    cells, tie_cells, counts = [], [], {candidate['id']: 0 for candidate in study['candidates']}
    none = 0
    # Reuse exact point evaluation: raster size is capped, with no numeric tie tolerance.
    for y_index, y_value in enumerate(coordinates[1]):
        row = []
        for x_index, x_value in enumerate(coordinates[0]):
            at = point(study, dict(values, **{axes[0]: x_value, axes[1]: y_value}))
            winners = at['winner_ids']
            row.append(winners[0] if winners else None)
            if len(winners) > 1:
                tie_cells.append({'x': x_index, 'y': y_index, 'winner_ids': winners})
            if winners:
                for winner in winners:
                    counts[winner] += 1
            else:
                none += 1
        cells.append(row)
    return {'axes': axes, 'x_values': [float(value) for value in coordinates[0]], 'y_values': [float(value) for value in coordinates[1]],
            'cells': cells, 'tie_cells': tie_cells, 'winner_sample_counts': counts, 'infeasible_sample_count': none,
            'method': 'sampled_grid', 'resolution': resolution,
            'notice': 'Sampled input positions, not probabilities or a proof of robustness between samples. Other assumptions are fixed.'}


def evaluate(study, request=None):
    request = {} if request is None else request
    if not isinstance(request, dict):
        raise ValueError('evaluation request must be an object')
    working = study
    enabled = request.get('enabled_constraint_ids')
    if enabled is not None:
        known = {row['id'] for row in study['constraints']}
        if not isinstance(enabled, list) or any(not isinstance(item, str) or item not in known for item in enabled) or len(enabled) != len(set(enabled)):
            raise ValueError('enabled_constraint_ids must be unique declared constraint ids')
        working = dict(study, constraints=[row for row in study['constraints'] if row['id'] in enabled])
    values = resolve_values(working, request.get('values'))
    current = point(working, values)
    result = {'point': current, 'conflict': minimum_conflict(working, current),
              'enabled_constraint_ids': [row['id'] for row in working['constraints']],
              'semantics': 'Input ranges are bounds for exploration, not probability distributions. Conclusions apply only to the declared model and candidates.'}
    if request.get('axis') is not None:
        result['axis'] = axis_analysis(working, values, request['axis'])
    if request.get('axes') is not None:
        result['atlas'] = atlas_analysis(working, values, request['axes'], request.get('resolution', 33))
    return result
