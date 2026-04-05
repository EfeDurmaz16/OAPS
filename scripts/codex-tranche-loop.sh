#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "BLOCKED: could not determine git repository root" >&2
  exit 1
fi

STATE_DIR="${ROOT}/.codex/state"
LAST_MESSAGE_FILE="${STATE_DIR}/last-message.txt"
RUNTIME_HOME_DIR="${ROOT}/.codex/runtime-home"
RUNTIME_CONFIG_TEMPLATE="${ROOT}/codex/config/runtime-home.toml"
mkdir -p "${STATE_DIR}"

MAX_ROUNDS="${MAX_ROUNDS:-20}"

prepare_codex_home() {
  mkdir -p "${RUNTIME_HOME_DIR}"

  if [[ ! -f "${RUNTIME_CONFIG_TEMPLATE}" ]]; then
    echo "BLOCKED: missing Codex runtime config template at ${RUNTIME_CONFIG_TEMPLATE}" >&2
    exit 1
  fi

  cp "${RUNTIME_CONFIG_TEMPLATE}" "${RUNTIME_HOME_DIR}/config.toml"
}

default_initial_prompt() {
  if [[ -f "${ROOT}/codex/prompts/full-oaps-implementation.txt" ]]; then
    cat "${ROOT}/codex/prompts/full-oaps-implementation.txt"
    return
  fi
  cat <<'EOF'
Read AGENTS.md, docs/STATUS.md, PLANS.md, and docs/NEXT-STEPS.md first.
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
EOF
}

default_continue_prompt() {
  cat <<'EOF'
Continue from the existing session, docs/STATUS.md, PLANS.md, and docs/NEXT-STEPS.md.
Do not stop for summaries.
Do not ask whether to continue.
Complete the next unfinished tranche, validate it, and commit atomically.
Stop only with:
DONE: <short summary>
or
BLOCKED: <precise blocker>
EOF
}

if [[ "$#" -gt 0 ]]; then
  INITIAL_PROMPT="$*"
else
  INITIAL_PROMPT="$(default_initial_prompt)"
fi

CONTINUE_PROMPT="$(default_continue_prompt)"

run_initial() {
  cd "${ROOT}"
  prepare_codex_home
  env CODEX_HOME="${RUNTIME_HOME_DIR}" codex exec --disable apps -C "${ROOT}" -o "${LAST_MESSAGE_FILE}" "${INITIAL_PROMPT}"
}

run_resume() {
  cd "${ROOT}"
  prepare_codex_home
  env CODEX_HOME="${RUNTIME_HOME_DIR}" codex exec resume --last --disable apps -C "${ROOT}" -o "${LAST_MESSAGE_FILE}" "${CONTINUE_PROMPT}"
}

terminal_status() {
  if [[ ! -f "${LAST_MESSAGE_FILE}" ]]; then
    return 1
  fi

  grep -E '^(DONE|BLOCKED):' "${LAST_MESSAGE_FILE}" | tail -n 1 || true
}

echo "Starting Codex tranche loop in ${ROOT}"
run_initial

ROUND=1
STATUS_LINE="$(terminal_status)"

while [[ -z "${STATUS_LINE}" ]]; do
  if (( ROUND >= MAX_ROUNDS )); then
    echo "BLOCKED: tranche loop reached MAX_ROUNDS=${MAX_ROUNDS} without DONE/BLOCKED status"
    exit 2
  fi

  ROUND=$((ROUND + 1))
  echo "Resuming Codex tranche loop (round ${ROUND}/${MAX_ROUNDS})"
  run_resume
  STATUS_LINE="$(terminal_status)"
done

echo "${STATUS_LINE}"
