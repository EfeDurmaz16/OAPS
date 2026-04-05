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

default_prompt() {
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

if [[ "$#" -gt 0 ]]; then
  PROMPT="$*"
else
  PROMPT="$(default_prompt)"
fi

cd "${ROOT}"
codex exec -C "${ROOT}" -o "${LAST_MESSAGE_FILE}" "${PROMPT}"
