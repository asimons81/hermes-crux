"""Crux routes, mounted by Hermes under /api/plugins/hermes-crux/."""
import importlib.util
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException


def owned_module(filename):
    # Hermes imports plugin_api.py as a standalone module. Load fixed package-owned
    # files without changing sys.path, sys.modules or any Hermes core object.
    path = Path(__file__).resolve().parent.parent / filename
    spec = importlib.util.spec_from_file_location(f'hermes_crux_{path.stem}', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


engine = owned_module('crux_engine.py')
store = owned_module('crux_store.py')
router = APIRouter()
MAX_BODY_BYTES = 131072


def checked(body):
    if not isinstance(body, dict):
        raise ValueError('request body must be an object')
    if len(json.dumps(body, allow_nan=False).encode()) > MAX_BODY_BYTES:
        raise ValueError('request body exceeds 128 KiB')
    return body


def call(function, *args):
    try:
        return function(*args)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (ValueError, TypeError, OverflowError, RecursionError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def changed(identifier):
    try:
        from hermes_cli.plugin_events import broadcast_plugin_event
    except ImportError:
        return
    broadcast_plugin_event(store.PLUGIN_ID, 'study.changed', {'id': identifier, 'version': 1})


def create_model(body):
    checked(body)
    result = store.create(engine.validate_study(body.get('study')))
    changed(result['study']['id'])
    return result


@router.get('/health')
def health():
    return {'ok': True, 'plugin': store.PLUGIN_ID, 'version': '0.1.0', 'model': 'affine', 'arithmetic': 'decimal_rational'}


@router.get('/studies')
def studies():
    return call(store.list_studies)


@router.post('/studies', status_code=201)
def create(body: dict):
    return call(create_model, body)


@router.get('/studies/{study_id}')
def inspect(study_id: str):
    return call(store.get, study_id)


@router.post('/studies/{study_id}/evaluate')
def evaluate(study_id: str, body: dict):
    def run():
        checked(body)
        item = store.get(study_id)
        return dict(engine.evaluate(item['study'], body), study_id=study_id, version=item['version'])
    return call(run)


@router.post('/studies/{study_id}/snapshots', status_code=201)
def save_snapshot(study_id: str, body: dict):
    def run():
        checked(body)
        item = store.get(study_id)
        # Save the complete point analysis and active requirements, not a raster.
        request = {key: body[key] for key in ('values', 'enabled_constraint_ids', 'axis') if key in body}
        evaluation = engine.evaluate(item['study'], request)
        label = engine.text(body.get('label', 'Saved position'), 'snapshot.label')
        result = store.snapshot(study_id, label, evaluation['point']['values'], evaluation)
        changed(study_id)
        return result
    return call(run)


def demo_files():
    return sorted((Path(__file__).resolve().parent.parent / 'examples').glob('*.json'))


@router.get('/demos')
def demos():
    items = []
    for path in demo_files():
        model = json.loads(path.read_text())
        items.append({'id': path.stem, 'title': model['title'], 'description': model['question']})
    return {'demos': items}


@router.post('/demos/{demo_id}', status_code=201)
def create_demo(demo_id: str):
    def run():
        engine.identifier(demo_id, 'demo_id')
        selected = next((path for path in demo_files() if path.stem == demo_id), None)
        if selected is None:
            raise KeyError('Unknown demo')
        return create_model({'study': json.loads(selected.read_text())})
    return call(run)
