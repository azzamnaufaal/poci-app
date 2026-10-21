#!/usr/bin/env bash
# Jalankan Poci lokal dalam mode demo (Karakeep tiruan) untuk peninjauan di laptop.
# Buka http://localhost:8100, masuk dengan username naufal, password demo.
set -e
cd "$(dirname "$0")/.."

python3 -m venv .venv
. .venv/bin/activate
pip install -q -r server/requirements.txt

uvicorn stub_karakeep:app --app-dir demo --host 127.0.0.1 --port 3001 &
STUB_PID=$!
trap "kill $STUB_PID 2>/dev/null || true" EXIT

KARAKEEP_BASE_URL=http://127.0.0.1:3001 \
KARAKEEP_API_KEY=demo-key \
POCI_USERNAME=naufal \
POCI_PASSWORD=demo \
SESSION_SECRET=demo-secret \
uvicorn server.main:app --host 127.0.0.1 --port 8100
