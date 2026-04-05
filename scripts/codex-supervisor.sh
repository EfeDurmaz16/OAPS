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
MAX_ROUNDS_VALUE="${MAX_ROUNDS:-20}"
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
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
META

nohup env \
  OAPS_ROOT="${ROOT}" \
  OAPS_PROMPT_FILE="${PROMPT_FILE}" \
  OAPS_MAX_ROUNDS="${MAX_ROUNDS_VALUE}" \
  bash -lc '
    cd "${OAPS_ROOT}"
    if [[ -s "${OAPS_PROMPT_FILE}" ]]; then
      PROMPT="$(cat "${OAPS_PROMPT_FILE}")"
      MAX_ROUNDS="${OAPS_MAX_ROUNDS}" scripts/codex-tranche-loop.sh "${PROMPT}"
    else
      MAX_ROUNDS="${OAPS_MAX_ROUNDS}" scripts/codex-tranche-loop.sh
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
- follow: tail -f "${LOG_FILE}"
- status: tail -n 40 "${ROOT}/.codex/state/last-message.txt"
OUT
