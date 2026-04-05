#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${CODEX_THREAD_ID:-}" ]]; then
  echo "BLOCKED: scripts/codex-supervisor.sh must be launched from a top-level shell, not from inside Codex (CODEX_THREAD_ID=${CODEX_THREAD_ID})" >&2
  exit 1
fi

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "BLOCKED: could not determine git repository root" >&2
  exit 1
fi

RUNS_DIR="${ROOT}/.codex/supervisor-runs"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="${RUNS_DIR}/${RUN_ID}"
PROMPT_FILE="${RUN_DIR}/prompt.txt"
LOG_FILE="${RUN_DIR}/loop.log"
PID_FILE="${RUN_DIR}/pid"
META_FILE="${RUN_DIR}/meta.env"
META_JSON_FILE="${RUN_DIR}/meta.json"
CHECKPOINT_FILE="${RUN_DIR}/checkpoints.jsonl"
RESULT_FILE="${RUN_DIR}/result.json"
TASK_FILE="${RUN_DIR}/task.json"
MAX_ROUNDS_VALUE="${MAX_ROUNDS:-20}"
RUN_MODE_VALUE="${OAPS_RUN_MODE:-supervisor}"
mkdir -p "${RUN_DIR}"

if [[ "$#" -gt 0 ]]; then
  printf '%s\n' "$*" > "${PROMPT_FILE}"
  PROMPT_MODE="custom"
else
  : > "${PROMPT_FILE}"
  PROMPT_MODE="default"
fi

cat > "${META_FILE}" <<META
RUN_ID=${RUN_ID}
ROOT=${ROOT}
RUN_DIR=${RUN_DIR}
LOG_FILE=${LOG_FILE}
PID_FILE=${PID_FILE}
PROMPT_FILE=${PROMPT_FILE}
PROMPT_MODE=${PROMPT_MODE}
MAX_ROUNDS=${MAX_ROUNDS_VALUE}
RUN_MODE=${RUN_MODE_VALUE}
CHECKPOINT_FILE=${CHECKPOINT_FILE}
RESULT_FILE=${RESULT_FILE}
TASK_FILE=${TASK_FILE}
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
META

python3 - "${RUN_ID}" "${ROOT}" "${RUN_DIR}" "${LOG_FILE}" "${PID_FILE}" "${PROMPT_FILE}" "${PROMPT_MODE}" "${MAX_ROUNDS_VALUE}" "${RUN_MODE_VALUE}" "${CHECKPOINT_FILE}" "${RESULT_FILE}" "${TASK_FILE}" > "${META_JSON_FILE}" <<'PY'
import json
import sys

run_id, root, run_dir, log_file, pid_file, prompt_file, prompt_mode, max_rounds, run_mode, checkpoint_file, result_file, task_file = sys.argv[1:]
payload = {
    'run_id': run_id,
    'root': root,
    'run_dir': run_dir,
    'log_file': log_file,
    'pid_file': pid_file,
    'prompt_file': prompt_file,
    'prompt_mode': prompt_mode,
    'max_rounds': int(max_rounds),
    'run_mode': run_mode,
    'checkpoint_file': checkpoint_file,
    'result_file': result_file,
    'task_file': task_file,
}
print(json.dumps(payload, indent=2, sort_keys=True))
PY

python3 - "${RUN_ID}" "${RUN_MODE_VALUE}" "${ROOT}" "${PROMPT_FILE}" "${MAX_ROUNDS_VALUE}" "${RESULT_FILE}" "${CHECKPOINT_FILE}" > "${TASK_FILE}" <<'PY'
import json
import sys

run_id, run_mode, root, prompt_file, max_rounds, result_file, checkpoint_file = sys.argv[1:]
payload = {
    'runner': 'scripts/codex-tranche-loop.sh',
    'run_id': run_id,
    'run_mode': run_mode,
    'root': root,
    'prompt_file': prompt_file,
    'max_rounds': int(max_rounds),
    'result_file': result_file,
    'checkpoint_file': checkpoint_file,
}
print(json.dumps(payload, indent=2, sort_keys=True))
PY

nohup env \
  OAPS_ROOT="${ROOT}" \
  OAPS_PROMPT_FILE="${PROMPT_FILE}" \
  OAPS_MAX_ROUNDS="${MAX_ROUNDS_VALUE}" \
  OAPS_RUN_ID="${RUN_ID}" \
  OAPS_RUN_DIR="${RUN_DIR}" \
  OAPS_RUN_MODE="${RUN_MODE_VALUE}" \
  bash -lc '
    cd "${OAPS_ROOT}"
    if [[ -s "${OAPS_PROMPT_FILE}" ]]; then
      PROMPT="$(cat "${OAPS_PROMPT_FILE}")"
      RUN_ID="${OAPS_RUN_ID}" OAPS_RUN_ID="${OAPS_RUN_ID}" OAPS_RUN_DIR="${OAPS_RUN_DIR}" OAPS_RUN_MODE="${OAPS_RUN_MODE}" MAX_ROUNDS="${OAPS_MAX_ROUNDS}" scripts/codex-tranche-loop.sh "${PROMPT}"
    else
      RUN_ID="${OAPS_RUN_ID}" OAPS_RUN_ID="${OAPS_RUN_ID}" OAPS_RUN_DIR="${OAPS_RUN_DIR}" OAPS_RUN_MODE="${OAPS_RUN_MODE}" MAX_ROUNDS="${OAPS_MAX_ROUNDS}" scripts/codex-tranche-loop.sh
    fi
  ' > "${LOG_FILE}" 2>&1 &

PID=$!
printf '%s\n' "${PID}" > "${PID_FILE}"

cat <<OUT
Started Codex supervisor run.
- run_id: ${RUN_ID}
- pid: ${PID}
- run_dir: ${RUN_DIR}
- log_file: ${LOG_FILE}
- prompt_mode: ${PROMPT_MODE}
- max_rounds: ${MAX_ROUNDS_VALUE}
- checkpoint_file: ${CHECKPOINT_FILE}
- result_file: ${RESULT_FILE}
- task_file: ${TASK_FILE}
- follow: tail -f "${LOG_FILE}"
- status: tail -n 40 "${ROOT}/.codex/state/last-message.txt"
OUT
