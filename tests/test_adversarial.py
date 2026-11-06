"""Independent mathematical and hostile-input checks for the public engine API."""
import copy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from crux_engine import evaluate, validate_study


def model(lines, *, direction='min', constraints=None):
    """A small independent family of cost lines over x in [0, 1]."""
    return {
        'title': 'Independent arithmetic fixture',
        'question': 'Which option is optimal at x?',
        'assumptions': [{'id': 'x', 'label': 'X', 'min': 0, 'max': 1,
                         'default': 0.5, 'step': 0.01}],
        'metrics': [{'id': 'cost', 'label': 'Cost'}],
        'candidates': [
            {'id': name, 'label': name, 'metrics': {'cost': {
                'constant': intercept, 'coefficients': {'x': slope}}}}
            for name, intercept, slope in lines
        ],
        'constraints': constraints or [],
        'objective': {'metric_id': 'cost', 'direction': direction},
    }


class IndependentDecisionTests(unittest.TestCase):
    def test_crossing_has_exact_rational_and_boundary_tie(self):
        # x = 1 - 2x exactly at 1/3; binary floating-point cannot encode 1/3.
        study = validate_study(model([('a', 0, 1), ('b', 1, -2)]))
        result = evaluate(study, {'axis': 'x'})
        boundary = next(b for b in result['axis']['boundaries'] if b['kind'] == 'rank')
        self.assertEqual(boundary['exact_value'], '1/3')
        self.assertCountEqual(boundary['winner_ids'], ['a', 'b'])
        self.assertEqual(evaluate(study, {'values': {'x': 0.333333}})['point']['winner_ids'], ['a'])
        self.assertEqual(evaluate(study, {'values': {'x': 0.333334}})['point']['winner_ids'], ['b'])

    def test_narrow_winning_interval_is_found_without_grid_sampling(self):
        # The middle option wins only in (0.500005, 0.500015), entirely
        # between adjacent points of even a 61-position full-range grid.
        study = validate_study(model([
            ('left', 0, 1), ('needle', 0.500005, 0), ('right', 1.00002, -1)]))
        result = evaluate(study, {'axis': 'x'})
        intervals = [r for r in result['axis']['regimes'] if r['winner_ids'] == ['needle']]
        self.assertTrue(intervals)
        # A nonwinning pair's crossing may subdivide the same winner's span.
        self.assertAlmostEqual(min(r['from'] for r in intervals), 0.500005, places=12)
        self.assertAlmostEqual(max(r['to'] for r in intervals), 0.500015, places=12)
        self.assertAlmostEqual(sum(r['to'] - r['from'] for r in intervals), 0.00001, places=12)
        boundaries = {b['exact_value'] for b in result['axis']['boundaries']}
        self.assertTrue({'100001/200000', '100003/200000'} <= boundaries)
        self.assertEqual(evaluate(study, {'values': {'x': 0.50001}})['point']['winner_ids'], ['needle'])

    def test_identical_options_are_tied_through_the_whole_range(self):
        study = validate_study(model([('a', 7, 0.1), ('b', 7, 0.1)]))
        result = evaluate(study, {'axis': 'x'})
        self.assertEqual(result['point']['status'], 'tie')
        self.assertCountEqual(result['point']['winner_ids'], ['a', 'b'])
        self.assertEqual([r['rank'] for r in result['point']['rankings']], [1, 1])
        self.assertCountEqual(result['axis']['regimes'][0]['winner_ids'], ['a', 'b'])

    def test_minimize_and_maximize_produce_opposite_winners(self):
        raw = model([('cheap', 10, 0), ('expensive', 20, 0)])
        self.assertEqual(evaluate(validate_study(raw))['point']['winner_ids'], ['cheap'])
        raw['objective']['direction'] = 'max'
        result = evaluate(validate_study(raw))
        self.assertEqual(result['point']['winner_ids'], ['expensive'])
        self.assertEqual([x['candidate_id'] for x in result['point']['rankings']], ['expensive', 'cheap'])

    def test_constraint_equality_can_be_feasible_only_at_one_boundary(self):
        raw = model([('only', 0, 3)], constraints=[
            {'id': 'low', 'label': 'At least one', 'metric_id': 'cost', 'operator': '>=', 'value': 1},
            {'id': 'high', 'label': 'At most one', 'metric_id': 'cost', 'operator': '<=', 'value': 1},
        ])
        result = evaluate(validate_study(raw), {'axis': 'x'})
        exact = [b for b in result['axis']['boundaries'] if b['exact_value'] == '1/3']
        self.assertEqual(len(exact), 2)
        self.assertTrue(all(b['feasible_ids'] == ['only'] for b in exact))
        self.assertTrue(all(r['feasible_ids'] == [] for r in result['axis']['regimes']))

    def test_infeasible_cheap_option_cannot_win(self):
        raw = model([('negative', -5, 0), ('valid', 1, 0)], constraints=[
            {'id': 'floor', 'label': 'Nonnegative', 'metric_id': 'cost', 'operator': '>=', 'value': 0}])
        result = evaluate(validate_study(raw))['point']
        self.assertEqual(result['winner_ids'], ['valid'])
        self.assertEqual(result['rankings'][1]['rank'], None)

    def test_conflict_is_smallest_cardinality_not_greedy_irreducible_only(self):
        raw = model([('a', 0, 0), ('b', 1, 0)])
        raw['constraints'] = [
            {'id': 'exclude_a', 'label': 'Exclude A', 'metric_id': 'cost', 'operator': '>=', 'value': 1},
            {'id': 'exclude_b', 'label': 'Exclude B', 'metric_id': 'cost', 'operator': '<=', 'value': 0},
            {'id': 'exclude_everyone', 'label': 'Impossible floor', 'metric_id': 'cost', 'operator': '>=', 'value': 2},
        ]
        result = evaluate(validate_study(raw))
        self.assertEqual(result['point']['status'], 'infeasible')
        self.assertEqual(result['conflict']['constraint_ids'], ['exclude_everyone'])
        self.assertTrue(result['conflict']['minimum_cardinality'])

    def test_real_example_conflict_and_recovery(self):
        raw = json.loads((Path(__file__).resolve().parents[1] / 'examples/project-delivery.json').read_text())
        study = validate_study(raw)
        request = {'values': {'scope': 16, 'deadline': 8, 'budget': 2400}}
        result = evaluate(study, request)
        self.assertCountEqual(result['conflict']['constraint_ids'], ['on_time', 'in_budget'])
        for enabled in [['on_time'], ['in_budget']]:
            one = evaluate(study, dict(request, enabled_constraint_ids=enabled))
            self.assertTrue(one['point']['feasible_ids'])
            self.assertIsNone(one['conflict'])
        request['values']['budget'] = 4500
        restored = evaluate(study, request)
        self.assertEqual(restored['point']['winner_ids'], ['studio'])
        studio = restored['point']['rankings'][0]
        self.assertEqual(studio['metrics']['cost'], 3320)
        self.assertEqual(studio['metrics']['duration'], 6.52)

    def test_inputs_and_normalized_study_are_not_mutated(self):
        raw = model([('a', 0, 1), ('b', 1, -1)])
        original = copy.deepcopy(raw)
        study = validate_study(raw)
        normalized = copy.deepcopy(study)
        request = {'values': {'x': 0.25}, 'axis': 'x', 'enabled_constraint_ids': []}
        request_before = copy.deepcopy(request)
        evaluate(study, request)
        self.assertEqual(raw, original)
        self.assertEqual(study, normalized)
        self.assertEqual(request, request_before)


class HostileInputTests(unittest.TestCase):
    def setUp(self):
        self.raw = model([('a', 0, 1), ('b', 1, -1)])
        self.study = validate_study(self.raw)

    def assert_rejected(self, raw):
        # A TypeError/OverflowError is an HTTP500 regression, not validation.
        with self.assertRaises(ValueError):
            validate_study(raw)

    def test_nonfinite_boolean_and_giant_numbers_are_validation_errors(self):
        for bad in [float('nan'), float('inf'), float('-inf'), True, 10**10000, 1e13]:
            with self.subTest(value_type=type(bad).__name__):
                raw = copy.deepcopy(self.raw)
                raw['candidates'][0]['metrics']['cost']['constant'] = bad
                self.assert_rejected(raw)

    def test_executable_expression_strings_are_not_a_supported_formula(self):
        for malicious in [
            {'constant': '__import__("os").system("touch /tmp/no")'},
            {'expression': 'fetch("https://example.com")'},
            {'constant': 0, 'coefficients': {'__proto__': 1}},
        ]:
            with self.subTest(expression=malicious):
                raw = copy.deepcopy(self.raw)
                raw['candidates'][0]['metrics']['cost'] = malicious
                self.assert_rejected(raw)

    def test_unhashable_metric_references_are_validation_errors(self):
        for bad in [[], {}, ['cost']]:
            with self.subTest(reference=bad):
                raw = copy.deepcopy(self.raw)
                raw['objective']['metric_id'] = bad
                self.assert_rejected(raw)
                raw = copy.deepcopy(self.raw)
                raw['constraints'] = [{'id': 'c', 'label': 'C', 'metric_id': bad,
                                       'operator': '<=', 'value': 1}]
                self.assert_rejected(raw)

    def test_nonobject_requests_including_falsy_values_are_rejected(self):
        for bad in [[], '', 0, False, [1], 'text']:
            with self.subTest(request=bad):
                with self.assertRaises(ValueError):
                    evaluate(self.study, bad)

    def test_unknown_values_bounds_and_nonfinite_requests_are_rejected(self):
        for values in [{'unknown': 1}, {'x': -0.1}, {'x': 1.1}, {'x': float('nan')}, {'x': True}, []]:
            with self.subTest(values=values):
                with self.assertRaises(ValueError):
                    evaluate(self.study, {'values': values})

    def test_bad_axis_and_enabled_constraint_shapes_are_validation_errors(self):
        for request in [
            {'axis': []}, {'axis': {}}, {'axes': [[], 'x']},
            {'axes': [{}, 'x']}, {'axes': ['x', 'x']},
            {'enabled_constraint_ids': [{}]}, {'enabled_constraint_ids': [[]]},
            {'enabled_constraint_ids': ['missing']}, {'enabled_constraint_ids': 'none'},
        ]:
            with self.subTest(request=request):
                with self.assertRaises(ValueError):
                    evaluate(self.study, request)

    def test_oversized_collections_and_payload_text_are_rejected(self):
        raw = copy.deepcopy(self.raw)
        raw['candidates'] = [dict(raw['candidates'][0], id=f'c{i}') for i in range(13)]
        self.assert_rejected(raw)
        raw = copy.deepcopy(self.raw)
        raw['question'] = 'x' * 2001
        self.assert_rejected(raw)

    def test_atlas_is_explicitly_sampled_and_resolution_is_bounded(self):
        raw = copy.deepcopy(self.raw)
        raw['assumptions'].append({'id': 'y', 'label': 'Y', 'min': 0, 'max': 1,
                                   'default': 0.5, 'step': 0.01})
        study = validate_study(raw)
        for bad in [True, 4, 62, 1.5, '33', 10**100]:
            with self.subTest(resolution=bad):
                with self.assertRaises(ValueError):
                    evaluate(study, {'axes': ['x', 'y'], 'resolution': bad})
        atlas = evaluate(study, {'axes': ['x', 'y'], 'resolution': 5})['atlas']
        self.assertEqual(atlas['method'], 'sampled_grid')
        self.assertIn('not probabilities', atlas['notice'])
        self.assertEqual(len(atlas['cells']), 5)
        self.assertEqual(len(atlas['cells'][0]), 5)


if __name__ == '__main__':
    unittest.main()
