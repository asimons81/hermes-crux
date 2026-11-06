"""Profile-resolved, transaction-backed immutable study and snapshot persistence."""
import json
import os
from pathlib import Path
import re
import sqlite3
import time
from contextlib import closing
from datetime import datetime, timezone
from uuid import uuid4

PLUGIN_ID = 'hermes-crux'
ROW_ID = re.compile(r'^[a-f0-9]{32}$')


def _connection_once():
    # Resolve on every operation: never cache the launch profile's path globally.
    standalone = False
    try:
        from plugins.plugin_storage import plugin_db
    except ImportError:
        isolated = os.environ.get('HERMES_HOME')
        if not isolated:
            raise RuntimeError('Standalone preview requires an explicit HERMES_HOME')
        root = Path(isolated) / 'plugin-data' / PLUGIN_ID
        root.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(root / 'data.db', timeout=10)
        standalone = True
    else:
        db = plugin_db(PLUGIN_ID)
    try:
        db.execute('PRAGMA busy_timeout=10000')
        if standalone:
            db.execute('PRAGMA journal_mode=WAL')
        db.executescript('''
            CREATE TABLE IF NOT EXISTS studies (
                id TEXT PRIMARY KEY, version INTEGER NOT NULL, created_at TEXT NOT NULL, model_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY, study_id TEXT NOT NULL, label TEXT NOT NULL, created_at TEXT NOT NULL,
                values_json TEXT NOT NULL, result_json TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS snapshots_study ON snapshots(study_id, created_at);
        ''')
    except BaseException:
        db.close()
        raise
    return db


def connection():
    # The first two processes opening a cold SQLite file can collide while
    # selecting WAL, before SQLite's normal statement busy timeout applies.
    # Retry only transient locking; paths are resolved afresh in this context
    # on every attempt, and no transaction is held while waiting.
    for attempt in range(8):
        try:
            return _connection_once()
        except sqlite3.OperationalError as exc:
            if str(exc).lower() not in ('database is locked', 'database table is locked') or attempt == 7:
                raise
            time.sleep(min(0.01 * (2 ** attempt), 0.1))


def timestamp():
    return datetime.now(timezone.utc).isoformat()


def valid_id(value):
    if not isinstance(value, str) or not ROW_ID.fullmatch(value):
        raise ValueError('study id must be the 32-character id returned at creation')
    return value


def create(study):
    identifier, created = uuid4().hex, timestamp()
    model = dict(study, id=identifier)
    with closing(connection()) as db, db:
        db.execute('INSERT INTO studies VALUES (?,?,?,?)', (identifier, 1, created, json.dumps(model, allow_nan=False)))
    return {'study': model, 'version': 1, 'created_at': created, 'snapshots': []}


def list_studies():
    with closing(connection()) as db:
        rows = db.execute('SELECT id, version, created_at, model_json FROM studies ORDER BY created_at DESC LIMIT 200').fetchall()
    return {'studies': [{'id': row[0], 'version': row[1], 'created_at': row[2], 'title': json.loads(row[3])['title'],
                         'question': json.loads(row[3])['question']} for row in rows]}


def get(identifier):
    valid_id(identifier)
    with closing(connection()) as db:
        row = db.execute('SELECT version, created_at, model_json FROM studies WHERE id=?', (identifier,)).fetchone()
        if row is None:
            raise KeyError('Study not found in this profile')
        snapshots = db.execute('SELECT id, label, created_at, values_json, result_json FROM snapshots WHERE study_id=? ORDER BY created_at DESC LIMIT 100', (identifier,)).fetchall()
    return {'study': json.loads(row[2]), 'version': row[0], 'created_at': row[1],
            'snapshots': [{'id': item[0], 'label': item[1], 'created_at': item[2], 'values': json.loads(item[3]), 'evaluation': json.loads(item[4])} for item in snapshots]}


def snapshot(identifier, label, values, evaluation):
    valid_id(identifier)
    sid, created = uuid4().hex, timestamp()
    with closing(connection()) as db, db:
        if db.execute('SELECT 1 FROM studies WHERE id=?', (identifier,)).fetchone() is None:
            raise KeyError('Study not found in this profile')
        db.execute('INSERT INTO snapshots VALUES (?,?,?,?,?,?)',
                   (sid, identifier, label, created, json.dumps(values, allow_nan=False), json.dumps(evaluation, allow_nan=False)))
    return {'id': sid, 'study_id': identifier, 'label': label, 'created_at': created, 'values': values, 'evaluation': evaluation}
