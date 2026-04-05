#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "BLOCKED: could not determine git repository root" >&2
  exit 1
fi

STATE_DIR="${ROOT}/.codex/state"
LAST_MESSAGE_FILE="${STATE_DIR}/last-message.txt"
LAST_RESULT_FILE="${STATE_DIR}/last-result.json"
RUNTIME_HOME_DIR="${ROOT}/.codex/runtime-home"
RUNTIME_CONFIG_TEMPLATE="${ROOT}/codex/config/runtime-home.toml"
USER_CODEX_HOME="${HOME}/.codex"
RUN_ID="${OAPS_RUN_ID:-local-$(date -u +%Y%m%dT%H%M%SZ)}"
RUN_MODE="${OAPS_RUN_MODE:-loop}"
RUN_DIR="${OAPS_RUN_DIR:-${STATE_DIR}/runs/${RUN_ID}}"
CHECKPOINT_FILE="${RUN_DIR}/checkpoints.jsonl"
RESULT_FILE="${RUN_DIR}/result.json"
LAST_STDERR_FILE="${RUN_DIR}/last-stderr.log"
MAX_ROUNDS="${MAX_ROUNDS:-20}"
TRANSIENT_RETRY_DELAY_SECONDS="${TRANSIENT_RETRY_DELAY_SECONDS:-5}"
mkdir -p "${STATE_DIR}" "${RUN_DIR}"

build_codex_exec_args() {
  CODEX_ARGS=(--disable apps -C "${ROOT}" -o "${LAST_MESSAGE_FILE}")
  if [[ "${CODEX_HARNESS_BYPASS_SANDBOX:-0}" == "1" ]]; then
    CODEX_ARGS+=(--dangerously-bypass-approvals-and-sandbox)
  else
    CODEX_ARGS+=(--sandbox danger-full-access)
  fi
}

prepare_codex_home() {
  mkdir -p "${RUNTIME_HOME_DIR}"

  if [[ ! -f "${RUNTIME_CONFIG_TEMPLATE}" ]]; then
    echo "BLOCKED: missing Codex runtime config template at ${RUNTIME_CONFIG_TEMPLATE}" >&2
    exit 1
  fi

  cp "${RUNTIME_CONFIG_TEMPLATE}" "${RUNTIME_HOME_DIR}/config.toml"

  if [[ -f "${USER_CODEX_HOME}/auth.json" ]]; then
    cp "${USER_CODEX_HOME}/auth.json" "${RUNTIME_HOME_DIR}/auth.json"
    chmod 600 "${RUNTIME_HOME_DIR}/auth.json"
  fi
}

record_checkpoint() {
  local event="$1"
  local detail="${2:-}"
  python3 - "${RUN_ID}" "${RUN_MODE}" "${event}" "${ROUND}" "${MAX_ROUNDS}" "${detail}" >> "${CHECKPOINT_FILE}" <<'PY'
import json
import sys
from datetime import datetime, timezone

run_id, run_mode, event, round_value, max_rounds, detail = sys.argv[1:]
payload = {
    "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
    "run_id": run_id,
    "run_mode": run_mode,
    "event": event,
    "round": int(round_value),
    "max_rounds": int(max_rounds),
    "detail": detail,
}
print(json.dumps(payload, sort_keys=True))
PY
}

write_result_file() {
  local status_line="$1"
  local exit_code="$2"
  python3 - "${RUN_ID}" "${RUN_MODE}" "${status_line}" "${exit_code}" "${LAST_MESSAGE_FILE}" "${CHECKPOINT_FILE}" "${LAST_STDERR_FILE}" > "${RESULT_FILE}" <<'PY'
import json
import sys
from datetime import datetime, timezone

run_id, run_mode, status_line, exit_code, last_message_file, checkpoint_file, stderr_file = sys.argv[1:]
payload = {
    "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
    "run_id": run_id,
    "run_mode": run_mode,
    "status_line": status_line,
    "exit_code": int(exit_code),
    "last_message_file": last_message_file,
    "checkpoint_file": checkpoint_file,
    "stderr_file": stderr_file,
}
print(json.dumps(payload, indent=2, sort_keys=True))
PY
  cp "${RESULT_FILE}" "${LAST_RESULT_FILE}"
}

classify_transient_failure() {
  if [[ ! -f "${LAST_STDERR_FILE}" ]]; then
    return 1
  fi

  if grep -Eqi 'websocket|upstream|connection reset|econnreset|timed? out|temporar|unavailable' "${LAST_STDERR_FILE}"; then
    return 0
  fi

  return 1
}

default_initial_prompt() {
  if [[ -f "${ROOT}/codex/prompts/full-oaps-implementation.txt" ]]; then
    cat "${ROOT}/codex/prompts/full-oaps-implementation.txt"
    return
  fi
  cat <<'PROMPT'
Read AGENTS.md, docs/STATUS.md, PLANS-V2.md, and docs/NEXT-STEPS.md first.
Execute the next unfinished tranche autonomously.
Do not stop for progress summaries.
Do not ask whether to continue.
Update docs/STATUS.md as you work.
Use parallel agents when the work cleanly decomposes into disjoint scopes.
Atomically commit every small completed step.
Validate before stopping.
Stop only with exactly one final status line:
DONE: <short summary>
or
BLOCKED: <precise blocker>
PROMPT
}

default_continue_prompt() {
  cat <<'PROMPT'
Continue from the existing session, docs/STATUS.md, PLANS-V2.md, and docs/NEXT-STEPS.md.
Do not stop for summaries.
Do not ask whether to continue.
Complete the next unfinished tranche, validate it, and commit atomically.
Stop only with:
DONE: <short summary>
or
BLOCKED: <precise blocker>
PROMPT
}

if [[ "$#" -gt 0 ]]; then
  INITIAL_PROMPT="$*"
else
  INITIAL_PROMPT="$(default_initial_prompt)"
fi

CONTINUE_PROMPT="$(default_continue_prompt)"

run_step() {
  local mode="$1"
  local prompt
  rm -f "${LAST_STDERR_FILE}"
  build_codex_exec_args
  if [[ "${mode}" == "initial" ]]; then
    prompt="${INITIAL_PROMPT}"
    env CODEX_HOME="${RUNTIME_HOME_DIR}" codex exec "${CODEX_ARGS[@]}" "${prompt}" 2>"${LAST_STDERR_FILE}"
  else
    prompt="${CONTINUE_PROMPT}"
    env CODEX_HOME="${RUNTIME_HOME_DIR}" codex exec resume --last "${CODEX_ARGS[@]}" "${prompt}" 2>"${LAST_STDERR_FILE}"
  fi
}

terminal_status() {
  if [[ ! -f "${LAST_MESSAGE_FILE}" ]]; then
    return 1
  fi

  grep -E '^(DONE|BLOCKED):' "${LAST_MESSAGE_FILE}" | tail -n 1 || true
}

handle_step_failure() {
  local mode="$1"
  local detail
  if [[ -f "${LAST_STDERR_FILE}" ]]; then
    detail="${mode}: $(tr '\n' ' ' < "${LAST_STDERR_FILE}" | cut -c1-300)"
  else
    detail="${mode}: missing stderr capture"
  fi

  if classify_transient_failure; then
    record_checkpoint "codex_exec_transient_failure" "${detail}"
    echo "Transient Codex failure detected during ${mode}; retrying after ${TRANSIENT_RETRY_DELAY_SECONDS}s" >&2
    sleep "${TRANSIENT_RETRY_DELAY_SECONDS}"
    return 0
  fi

  record_checkpoint "codex_exec_blocked" "${detail}"
  return 1
}

prepare_codex_home
ROUND=1
record_checkpoint "run_started" "starting tranche loop"
echo "Starting Codex tranche loop in ${ROOT}"

while true; do
  STEP_MODE="resume"
  if (( ROUND == 1 )); then
    STEP_MODE="initial"
  else
    record_checkpoint "resume_started" "resume round ${ROUND}"
    echo "Resuming Codex tranche loop (round ${ROUND}/${MAX_ROUNDS})"
  fi

  if ! run_step "${STEP_MODE}"; then
    if handle_step_failure "${STEP_MODE}"; then
      continue
    fi
    STATUS_LINE="BLOCKED: codex exec failed during ${STEP_MODE} run; see ${LAST_STDERR_FILE}"
    write_result_file "${STATUS_LINE}" "1"
    echo "${STATUS_LINE}"
    exit 1
  fi

  STATUS_LINE="$(terminal_status)"
  record_checkpoint "round_completed" "${STEP_MODE} round ${ROUND} complete"

  if [[ -n "${STATUS_LINE}" ]]; then
    break
  fi

  if (( ROUND >= MAX_ROUNDS )); then
    record_checkpoint "max_rounds_reached" "loop reached max rounds without terminal status"
    STATUS_LINE="BLOCKED: tranche loop reached MAX_ROUNDS=${MAX_ROUNDS} without DONE/BLOCKED status"
    write_result_file "${STATUS_LINE}" "2"
    echo "${STATUS_LINE}"
    exit 2
  fi

  ROUND=$((ROUND + 1))
done

record_checkpoint "run_finished" "${STATUS_LINE}"
write_result_file "${STATUS_LINE}" "0"
echo "${STATUS_LINE}"
