#!/usr/bin/env python3
"""Serve the actual Crux REST router plus React preview. Requires fastapi, uvicorn."""
import argparse
import importlib.util
import os
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=9141)
parser.add_argument('--data-dir', type=Path, required=True, help='Isolated preview state; never use a live Hermes home')
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
data = args.data_dir.expanduser().resolve()
if data == (Path.home()/'.hermes').resolve() or (data/'config.yaml').exists() or (data/'auth.json').exists():
    parser.error('Use a new isolated directory, not a configured Hermes profile.')
os.environ['HERMES_HOME'] = str(data)
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
spec = importlib.util.spec_from_file_location('crux_preview_routes',root/'dashboard'/'plugin_api.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
app = FastAPI(title='Crux isolated preview')
app.include_router(module.router,prefix='/api/plugins/hermes-crux')
app.mount('/ui',StaticFiles(directory=Path(__file__).resolve().parent),name='ui')
@app.get('/')
def index():
    return FileResponse(Path(__file__).resolve().parent/'index.html')
if __name__ == '__main__':
    uvicorn.run(app,host='127.0.0.1',port=args.port,log_level='warning')
