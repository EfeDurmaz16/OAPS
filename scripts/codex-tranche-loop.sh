#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "BLOCKED: could not determine git repository root" >&2
  exit 1
fi

STATE_DIR="${ROOT}/.codex/state"
LAST_MESSAGE_FILE="${STATE_DIR}/last-message.txt"
mkdir -p "${STATE_DIR}"

MAX_ROUNDS="${MAX_ROUNDS:-20}"

default_initial_prompt() {
  cat <<'EOF'
Read AGENTS.md and docs/STATUS.md first.

Then read the current tranche context from:
- CHARTER.md
- ROADMAP.md
- SPEC.md
- spec/
- profiles/
- conformance/
- reference/

Execute the next unfinished tranche autonomously.
Do not stop for progress summaries.
Do not ask whether to continue.
Update docs/STATUS.md as you work.
Use parallel agents when the work cleanly decomposes into disjoint scopes.
Make atomic commits.
Validate before stopping.

Stop only with exactly one final status line:
DONE: <short summary>
or
BLOCKED: <precise blocker>
EOF
}

default_continue_prompt() {
  cat <<'EOF'
Continue from the existing session and docs/STATUS.md.
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
  codex exec -C "${ROOT}" -o "${LAST_MESSAGE_FILE}" "${INITIAL_PROMPT}"
}

run_resume() {
  cd "${ROOT}"
  codex exec resume --last -C "${ROOT}" -o "${LAST_MESSAGE_FILE}" "${CONTINUE_PROMPT}"
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
