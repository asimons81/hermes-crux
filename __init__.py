"""Native Hermes tools for the Crux decision laboratory."""
import json
from pathlib import Path

from . import crux_engine as engine
from . import crux_store as store


def emit_changed(identifier):
    from hermes_cli.plugin_events import broadcast_plugin_event
    broadcast_plugin_event('hermes-crux', 'study.changed', {'id': identifier, 'version': 1})


def limited(args):
    if not isinstance(args, dict) or len(json.dumps(args, allow_nan=False).encode()) > 131072:
        raise ValueError('arguments must be an object of at most 128 KiB')
    return args


def create(args, **kwargs):
    limited(args)
    result = store.create(engine.validate_study(args.get('study')))
    result['directive'] = f'::crux{{id="{result["study"]["id"]}"}}'
    emit_changed(result['study']['id'])
    return result


def inspect(args, **kwargs):
    limited(args)
    return store.get(args['study_id']) if 'study_id' in args else store.list_studies()


def evaluate(args, **kwargs):
    limited(args)
    saved = store.get(args.get('study_id'))
    return dict(engine.evaluate(saved['study'], args), study_id=args['study_id'], version=saved['version'])


def snapshot(args, **kwargs):
    limited(args)
    saved = store.get(args.get('study_id'))
    request = {key: args[key] for key in ('values', 'axis', 'enabled_constraint_ids') if key in args}
    evaluation = engine.evaluate(saved['study'], request)
    result = store.snapshot(args['study_id'], engine.text(args.get('label', 'Saved position'), 'label'), evaluation['point']['values'], evaluation)
    emit_changed(args['study_id'])
    return result


def json_handler(function):
    def handle(args, **kwargs):
        try:
            result = function(args, **kwargs)
        except (ValueError, KeyError, TypeError, OverflowError, RecursionError) as exc:
            result = {'error': str(exc), 'hint': 'Read the hermes-crux:decision-lab skill for the bounded affine schema.'}
        return json.dumps(result, allow_nan=False)
    return handle


def register(ctx):
    common = {
        'study_id': {'type': 'string', 'description': 'The immutable study id returned by crux_create.'},
        'values': {'type': 'object', 'description': 'Assumption id to numeric value within its declared range.', 'additionalProperties': {'type': 'number'}},
        'axis': {'type': 'string', 'description': 'Assumption id for exact one-axis analysis.'},
        'axes': {'type': 'array', 'items': {'type': 'string'}, 'minItems': 2, 'maxItems': 2, 'description': 'Two assumption ids for an explicitly sampled atlas.'},
        'resolution': {'type': 'integer', 'minimum': 5, 'maximum': 61},
        'enabled_constraint_ids': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Optional subset of hard requirements. Omission enables all.'},
    }
    specs = [
        ('crux_create', 'Create an immutable affine decision study. Define finite candidates, numeric assumption ranges, explicit metric formulas, hard requirements and one min/max objective. No hidden scoring or code execution.', create,
         {'study': {'type': 'object', 'description': 'Full study object as documented in hermes-crux:decision-lab. Formulas are {constant,coefficients:{assumption_id:number}}.'}}, ['study']),
        ('crux_inspect', 'List Crux studies or read a full model and its saved positions.', inspect, {'study_id': common['study_id']}, []),
        ('crux_evaluate', 'Evaluate a stored study; optionally compute all analytic axis boundaries or a sampled two-axis atlas. Input ranges are not probabilities.', evaluate, common, ['study_id']),
        ('crux_snapshot', 'Save an immutable input position and its exact point result for later comparison.', snapshot,
         {**{key: common[key] for key in ('study_id', 'values', 'axis', 'enabled_constraint_ids')}, 'label': {'type': 'string'}}, ['study_id']),
    ]
    for name, description, handler, properties, required in specs:
        ctx.register_tool(name=name, toolset='hermes-crux', description=description,
                          schema={'name': name, 'description': description, 'parameters': {'type': 'object', 'properties': properties, 'required': required}},
                          handler=json_handler(handler))
    ctx.register_skill('decision-lab', Path(__file__).parent / 'skills' / 'decision-lab' / 'SKILL.md',
                       description='Build and explore an explicit decision model with exact affine thresholds and hard requirements.')
