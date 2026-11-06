"""Independent REST/tool/store behavior review.

Uses the real ASGI router, SQLite and Hermes profile storage when the Hermes
runtime is available. This is not an authentication or live-Desktop proof.
"""
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor
import copy
import importlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))
plugin = importlib.import_module(ROOT.name)

try:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from hermes_constants import set_hermes_home_override, reset_hermes_home_override
except ImportError:
    TestClient = None


def api_module():
    spec = importlib.util.spec_from_file_location('crux_independent_review_api', ROOT / 'dashboard/plugin_api.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@contextmanager
def profile(path):
    token = set_hermes_home_override(path)
    try:
        yield
    finally:
        reset_hermes_home_override(token)


@unittest.skipUnless(TestClient is not None, 'REST review requires the Hermes FastAPI/httpx runtime')
class IndependentRESTReview(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(prefix='crux-review-')
        self.home = Path(self.scratch.name) / 'first'
        self.other = Path(self.scratch.name) / 'second'
        self.scope = profile(self.home)
        self.scope.__enter__()
        self.api = api_module()
        app = FastAPI()
        app.include_router(self.api.router, prefix='/crux')
        self.client = TestClient(app)
        self.fixture = json.loads((ROOT / 'examples/project-delivery.json').read_text())

    def tearDown(self):
        self.client.close()
        self.scope.__exit__(None, None, None)
        self.scratch.cleanup()

    def create(self, raw=None):
        response = self.client.post('/crux/studies', json={'study': self.fixture if raw is None else raw})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_supplied_ids_cannot_replace_or_impersonate_existing_study(self):
        first = self.create()
        original_id = first['study']['id']
        forged = copy.deepcopy(self.fixture)
        forged.update(id=original_id, version=99, created_at='1900-01-01')
        forged['title'] = 'A separate revision'
        second = self.create(forged)
        self.assertNotEqual(second['study']['id'], original_id)
        self.assertEqual(second['version'], 1)
        self.assertNotIn('version', second['study'])
        self.assertNotIn('created_at', second['study'])
        self.assertEqual(self.client.get('/crux/studies/' + original_id).json()['study'], first['study'])

    def test_snapshot_recomputes_result_and_preserves_requirement_mask(self):
        created = self.create()
        sid = created['study']['id']
        supplied = {
            'label': 'Ignore time, deliberately',
            'values': {'scope': 16, 'deadline': 8, 'budget': 2400},
            'enabled_constraint_ids': ['in_budget'],
            'id': 'f' * 32,
            'study_id': 'e' * 32,
            'evaluation': {'point': {'winner_ids': ['forged'], 'status': 'winner'}},
            'study': {'title': 'Forged source model'},
        }
        response = self.client.post(f'/crux/studies/{sid}/snapshots', json=supplied)
        self.assertEqual(response.status_code, 201, response.text)
        saved = response.json()
        self.assertEqual(saved['study_id'], sid)
        self.assertNotEqual(saved['id'], supplied['id'])
        self.assertEqual(saved['evaluation']['point']['winner_ids'], ['solo'])
        self.assertEqual(saved['evaluation']['enabled_constraint_ids'], ['in_budget'])
        reopened = self.client.get(f'/crux/studies/{sid}').json()
        self.assertEqual(reopened['study'], created['study'])
        snapshot = reopened['snapshots'][0]
        restored = self.client.post(f'/crux/studies/{sid}/evaluate', json={
            'values': snapshot['values'],
            'enabled_constraint_ids': snapshot['evaluation']['enabled_constraint_ids'],
        }).json()
        self.assertEqual(restored['point'], snapshot['evaluation']['point'])
        self.assertEqual(restored['enabled_constraint_ids'], ['in_budget'])
        # Restoring only the numbers would change the answer: both requirements
        # are impossible together. The saved mask is part of the scenario.
        strict = self.client.post(f'/crux/studies/{sid}/evaluate', json={'values': snapshot['values']}).json()
        self.assertEqual(strict['point']['status'], 'infeasible')

    def test_empty_requirement_mask_is_retained_not_defaulted_to_all(self):
        sid = self.create()['study']['id']
        response = self.client.post(f'/crux/studies/{sid}/snapshots', json={
            'enabled_constraint_ids': [], 'values': {'scope': 16, 'deadline': 8, 'budget': 2400}})
        self.assertEqual(response.status_code, 201, response.text)
        saved = self.client.get(f'/crux/studies/{sid}').json()['snapshots'][0]
        self.assertEqual(saved['evaluation']['enabled_constraint_ids'], [])
        self.assertEqual(saved['evaluation']['point']['winner_ids'], ['solo'])

    def test_profile_switch_denies_foreign_read_evaluation_and_snapshot(self):
        first = self.create()
        sid = first['study']['id']
        with profile(self.other):
            self.assertEqual(self.client.get('/crux/studies').json()['studies'], [])
            self.assertEqual(self.client.get(f'/crux/studies/{sid}').status_code, 404)
            self.assertEqual(self.client.post(f'/crux/studies/{sid}/evaluate', json={}).status_code, 404)
            self.assertEqual(self.client.post(f'/crux/studies/{sid}/snapshots', json={}).status_code, 404)
            other_id = self.create()['study']['id']
        self.assertEqual(self.client.get(f'/crux/studies/{other_id}').status_code, 404)
        reopened = self.client.get(f'/crux/studies/{sid}').json()
        self.assertEqual(reopened['study'], first['study'])
        self.assertEqual(reopened['snapshots'], [])
        self.assertEqual(len(self.client.get('/crux/studies').json()['studies']), 1)

    def test_tool_writes_and_rest_reads_share_real_profile_storage(self):
        result = json.loads(plugin.json_handler(plugin.create)({'study': self.fixture}))
        self.assertNotIn('error', result, result)
        sid = result['study']['id']
        response = self.client.get(f'/crux/studies/{sid}')
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()['study'], result['study'])
        rest = self.create()
        from_tool = json.loads(plugin.json_handler(plugin.inspect)({'study_id': rest['study']['id']}))
        self.assertEqual(from_tool['study'], rest['study'])

    def test_concurrent_profile_writers_cannot_cross_contaminate_models(self):
        def writer(index):
            home = self.home if index % 2 == 0 else self.other
            with profile(home):
                raw = copy.deepcopy(self.fixture)
                raw['title'] = f'Worker {index}'
                created = plugin.store.create(plugin.engine.validate_study(raw))
                sid = created['study']['id']
                result = plugin.snapshot({'study_id': sid, 'label': f'Snapshot {index}',
                                          'values': {'scope': 16 + index}})
                return index, sid, result['id']
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(writer, range(8)))
        self.assertEqual(len({sid for _, sid, _ in results}), 8)
        self.assertEqual(len({snapshot for _, _, snapshot in results}), 8)
        for home, parity in [(self.home, 0), (self.other, 1)]:
            with profile(home):
                rows = self.client.get('/crux/studies').json()['studies']
                self.assertEqual({row['title'] for row in rows}, {f'Worker {i}' for i in range(8) if i % 2 == parity})
                for index, sid, snapshot_id in results:
                    response = self.client.get(f'/crux/studies/{sid}')
                    if index % 2 != parity:
                        self.assertEqual(response.status_code, 404)
                    else:
                        self.assertEqual(response.status_code, 200, response.text)
                        snapshots = response.json()['snapshots']
                        self.assertEqual(len(snapshots), 1)
                        self.assertEqual(snapshots[0]['id'], snapshot_id)
                        self.assertEqual(snapshots[0]['values']['scope'], 16 + index)

    def test_bad_evaluation_and_snapshot_requests_return_422_without_writes(self):
        sid = self.create()['study']['id']
        bad_requests = [
            {'values': {'scope': 0}},
            {'values': {'missing': 1}},
            {'values': []},
            {'axis': []},
            {'enabled_constraint_ids': [[]]},
            {'enabled_constraint_ids': ['on_time', 'on_time']},
        ]
        for body in bad_requests:
            for route in ['evaluate', 'snapshots']:
                with self.subTest(body=body, route=route):
                    response = self.client.post(f'/crux/studies/{sid}/{route}', json=body)
                    self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.client.get(f'/crux/studies/{sid}').json()['snapshots'], [])

    def test_oversized_body_and_invalid_labels_do_not_create_records(self):
        original = self.create()
        sid = original['study']['id']
        response = self.client.post('/crux/studies', json={'study': self.fixture, 'padding': 'x' * 131073})
        self.assertEqual(response.status_code, 422)
        for label in ['', None, {}, 'x' * 161]:
            with self.subTest(label_type=type(label).__name__):
                response = self.client.post(f'/crux/studies/{sid}/snapshots', json={'label': label})
                self.assertEqual(response.status_code, 422, response.text)
        item = self.client.get(f'/crux/studies/{sid}').json()
        self.assertEqual(item['snapshots'], [])
        self.assertEqual(item['study'], original['study'])
        self.assertEqual(len(self.client.get('/crux/studies').json()['studies']), 1)

    def test_nonobject_and_nonfinite_http_bodies_fail_without_a_snapshot(self):
        sid = self.create()['study']['id']
        for content in ['[]', 'null', 'false', '0', '"text"',
                        '{"values":{"scope":NaN}}', '{"values":{"scope":1e309}}']:
            for route in ['evaluate', 'snapshots']:
                with self.subTest(content=content, route=route):
                    response = self.client.post(f'/crux/studies/{sid}/{route}',
                        content=content, headers={'content-type': 'application/json'})
                    self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.client.get(f'/crux/studies/{sid}').json()['snapshots'], [])

    def test_snapshot_of_unknown_study_cannot_create_orphan(self):
        response = self.client.post('/crux/studies/' + 'a' * 32 + '/snapshots', json={})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.client.get('/crux/studies').json()['studies'], [])

    def test_stored_model_has_no_mutation_routes(self):
        original = self.create()
        sid = original['study']['id']
        for method in ['put', 'patch', 'delete']:
            response = getattr(self.client, method)(f'/crux/studies/{sid}')
            self.assertEqual(response.status_code, 405)
        self.assertEqual(self.client.get(f'/crux/studies/{sid}').json()['study'], original['study'])


class ToolSkillContractReview(unittest.TestCase):
    def test_skill_complete_example_is_loadable_and_numbers_are_correct(self):
        skill = (ROOT / 'skills/decision-lab/SKILL.md').read_text()
        raw = json.loads(re.search(r'```json\n(.*?)\n```', skill, re.S).group(1))
        study = plugin.engine.validate_study(raw)
        at_tie = plugin.engine.evaluate(study, {'values': {'volume': 250}, 'axis': 'volume'})
        self.assertCountEqual(at_tie['point']['winner_ids'], ['flex', 'reserved'])
        self.assertTrue(all(row['metrics']['cost'] == 125 for row in at_tie['point']['rankings']))
        self.assertEqual(plugin.engine.evaluate(study, {'values': {'volume': 249}})['point']['winner_ids'], ['flex'])
        self.assertEqual(plugin.engine.evaluate(study, {'values': {'volume': 251}})['point']['winner_ids'], ['reserved'])

    def test_registered_tools_and_skill_use_same_published_names(self):
        class Capture:
            def __init__(self):
                self.tools, self.skills = {}, []
            def register_tool(self, **kwargs):
                self.tools[kwargs['name']] = kwargs
            def register_skill(self, *args, **kwargs):
                self.skills.append(args)
        ctx = Capture()
        plugin.register(ctx)
        self.assertEqual(set(ctx.tools), {'crux_create', 'crux_inspect', 'crux_evaluate', 'crux_snapshot'})
        self.assertEqual(ctx.skills[0][0], 'decision-lab')
        self.assertTrue(Path(ctx.skills[0][1]).is_file())
        for name, entry in ctx.tools.items():
            self.assertEqual(entry['schema']['name'], name)
            self.assertIn(name, (ROOT / 'skills/decision-lab/SKILL.md').read_text())
        snapshot = ctx.tools['crux_snapshot']['schema']['parameters']['properties']
        self.assertIn('enabled_constraint_ids', snapshot)
        self.assertNotIn('evaluation', snapshot)

    def test_inspect_supplied_malformed_id_returns_error_instead_of_listing(self):
        for bad in ['', [], {}, 0, False]:
            with self.subTest(id_type=type(bad).__name__):
                result = json.loads(plugin.json_handler(plugin.inspect)({'study_id': bad}))
                self.assertIn('error', result)


if __name__ == '__main__':
    unittest.main()
