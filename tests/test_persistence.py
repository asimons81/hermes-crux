"""Behavior checks for immutable models and isolated profile state."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / f'{name}.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


engine, store = module('crux_engine'), module('crux_store')


class PersistenceTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(prefix='crux-test-')
        self.scope = patch.dict(os.environ, {'HERMES_HOME': self.scratch.name})
        self.scope.start()
        self.study = engine.validate_study(json.loads((ROOT / 'examples/project-delivery.json').read_text()))

    def tearDown(self):
        self.scope.stop()
        self.scratch.cleanup()

    def test_model_and_snapshot_survive_module_reload_without_mutation(self):
        created = store.create(self.study)
        sid = created['study']['id']
        result = engine.evaluate(created['study'], {'values': {'scope': 30, 'deadline': 5}})
        store.snapshot(sid, 'Tight deadline', result['point']['values'], result)
        reopened = module('crux_store').get(sid)
        self.assertEqual(len(reopened['snapshots']), 1)
        self.assertEqual(reopened['snapshots'][0]['evaluation']['point']['status'], 'infeasible')
        self.assertEqual(reopened['study']['assumptions'][0]['default'], 16)
        self.assertEqual(reopened['version'], 1)
        self.assertIn('Illustrative', reopened['study']['description'])

    def test_profile_switch_never_reuses_launch_storage(self):
        created = store.create(self.study)
        profile = Path(self.scratch.name) / 'profiles' / 'other'
        with patch.dict(os.environ, {'HERMES_HOME': str(profile)}):
            self.assertEqual(store.list_studies()['studies'], [])
            with self.assertRaises(KeyError):
                store.get(created['study']['id'])
            second = store.create(self.study)
            self.assertNotEqual(created['study']['id'], second['study']['id'])
        self.assertEqual(len(store.list_studies()['studies']), 1)

    def test_unknown_and_traversal_ids_refused(self):
        for identifier in ('../config.yaml', '/tmp/data', 'a'*33, None):
            with self.subTest(identifier=identifier), self.assertRaises(ValueError):
                store.get(identifier)
        with self.assertRaises(KeyError):
            store.get('0'*32)

    def test_saved_positions_do_not_change_current_model_or_each_other(self):
        created = store.create(self.study)
        sid = created['study']['id']
        for scope in (10, 30):
            evaluation = engine.evaluate(created['study'], {'values': {'scope': scope}, 'enabled_constraint_ids': []})
            store.snapshot(sid, f'Scope {scope}', evaluation['point']['values'], evaluation)
        reopened = store.get(sid)
        self.assertEqual({item['values']['scope'] for item in reopened['snapshots']}, {10.0, 30.0})
        self.assertEqual(len(reopened['study']['constraints']), 2)
        self.assertEqual(len(store.list_studies()['studies']), 1)


if __name__ == '__main__':
    unittest.main()
