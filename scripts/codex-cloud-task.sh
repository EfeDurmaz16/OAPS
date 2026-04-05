#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "BLOCKED: could not determine git repository root" >&2
  exit 1
fi

RUNS_DIR="${ROOT}/.codex/supervisor-runs"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-cloud"
RUN_DIR="${RUNS_DIR}/${RUN_ID}"
TASK_FILE="${RUN_DIR}/cloud-task.json"
mkdir -p "${RUN_DIR}"

python3 - "${RUN_ID}" "${RUN_DIR}" "${ROOT}" "$@" > "${TASK_FILE}" <<'PY'
import json
import sys

run_id, run_dir, root, *prompt_args = sys.argv[1:]
payload = {
    'task_kind': 'codex-cloud-task-wrapper',
    'run_id': run_id,
    'run_dir': run_dir,
    'root': root,
    'prompt_args': prompt_args,
    'recommended_entrypoint': 'scripts/codex-supervisor.sh',
    'notes': 'Provider-neutral wrapper bundle for external schedulers or cloud task runners.',
}
print(json.dumps(payload, indent=2, sort_keys=True))
PY

cat <<OUT
Prepared cloud-task wrapper bundle.
- run_id: ${RUN_ID}
- run_dir: ${RUN_DIR}
- task_file: ${TASK_FILE}
OUT

OAPS_RUN_MODE=cloud-task scripts/codex-supervisor.sh "$@"
