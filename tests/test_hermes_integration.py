"""Real released Hermes loader, tool executor and authenticated backend integration.

Run in a Hermes runtime (the stdlib suite skips this optional host integration).
Every write stays in a temporary HERMES_HOME; no running host is contacted.
"""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
HAS_HERMES = importlib.util.find_spec('hermes_cli') is not None


@unittest.skipUnless(HAS_HERMES, 'requires an installed Hermes runtime')
class ReleasedHermesIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.scratch = tempfile.TemporaryDirectory(prefix='crux-real-hermes-')
        cls.home = Path(cls.scratch.name)
        (cls.home / 'plugins').mkdir()
        (cls.home / 'bundled').mkdir()
        (cls.home / 'plugins' / 'hermes-crux').symlink_to(ROOT, target_is_directory=True)
        (cls.home / 'config.yaml').write_text(json.dumps({'plugins': {'enabled': ['hermes-crux'], 'isolation': 'in_process'}}))
        cls.environment = patch.dict(os.environ, {'HERMES_HOME': str(cls.home), 'HERMES_BUNDLED_PLUGINS': str(cls.home / 'bundled')})
        cls.environment.start()
        from hermes_constants import set_hermes_home_override
        cls.home_token = set_hermes_home_override(cls.home)
        from hermes_cli.plugins import get_plugin_manager
        cls.manager = get_plugin_manager()
        cls.manager.discover_and_load(force=True)
        from hermes_cli import web_server
        from starlette.testclient import TestClient
        cls.web = web_server
        cls.client = TestClient(web_server.app)
        cls.client.headers[web_server._SESSION_HEADER_NAME] = web_server._SESSION_TOKEN
        cls.model = json.loads((ROOT / 'examples/project-delivery.json').read_text())

    @classmethod
    def tearDownClass(cls):
        from hermes_constants import reset_hermes_home_override
        reset_hermes_home_override(cls.home_token)
        cls.client.close()
        cls.environment.stop()
        cls.scratch.cleanup()

    def tool(self, name, args):
        from model_tools import handle_function_call
        result = json.loads(handle_function_call(name, args, task_id='crux-integration', session_id='crux-integration'))
        self.assertNotIn('error', result, result)
        return result

    def test_loader_registers_tools_and_bundled_skill(self):
        plugin = self.manager._plugins['hermes-crux']
        self.assertTrue(plugin.enabled)
        self.assertIsNone(plugin.error)
        self.assertEqual(set(plugin.tools_registered), {'crux_create', 'crux_inspect', 'crux_evaluate', 'crux_snapshot'})
        self.assertIn('hermes-crux:decision-lab', self.manager._plugin_skills)

    def test_real_tool_executor_and_real_http_router_share_durable_state(self):
        created = self.tool('crux_create', {'study': self.model})
        sid = created['study']['id']
        fetched = self.client.get(f'/api/plugins/hermes-crux/studies/{sid}')
        self.assertEqual(fetched.status_code, 200, fetched.text)
        self.assertEqual(fetched.json()['study'], created['study'])
        request = {'values': {'scope': 30, 'deadline': 12}, 'axis': 'scope', 'axes': ['scope', 'deadline'], 'resolution': 9}
        tool_result = self.tool('crux_evaluate', {'study_id': sid, **request})
        response = self.client.post(f'/api/plugins/hermes-crux/studies/{sid}/evaluate', json=request)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), tool_result)
        saved = self.client.post(f'/api/plugins/hermes-crux/studies/{sid}/snapshots', json={'values': {'scope': 30, 'deadline': 5}, 'label': 'Impossible deadline'})
        self.assertEqual(saved.status_code, 201, saved.text)
        reopened = self.tool('crux_inspect', {'study_id': sid})
        self.assertEqual(reopened['snapshots'][0]['evaluation']['point']['status'], 'infeasible')
        self.assertEqual(reopened['study']['assumptions'][0]['default'], 16)

    def test_plugin_router_obeys_host_auth_and_bad_requests_do_not_write(self):
        from starlette.testclient import TestClient
        anonymous = TestClient(self.web.app)
        response = anonymous.get('/api/plugins/hermes-crux/health')
        self.assertIn(response.status_code, (401, 403), response.text)
        before = self.client.get('/api/plugins/hermes-crux/studies').json()
        bad = self.client.post('/api/plugins/hermes-crux/studies', json={'study': {'title': 'bad'}})
        self.assertEqual(bad.status_code, 422, bad.text)
        self.assertEqual(self.client.get('/api/plugins/hermes-crux/studies').json(), before)
        anonymous.close()


if __name__ == '__main__':
    unittest.main()
