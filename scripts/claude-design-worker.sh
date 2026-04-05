#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git -C "${PWD}" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "BLOCKED: could not determine git repository root" >&2
  exit 1
fi

PROMPT_FILE="${ROOT}/claude/prompts/frontend-design-worker.txt"

if [[ ! -f "${PROMPT_FILE}" ]]; then
  echo "BLOCKED: missing Claude design prompt at ${PROMPT_FILE}" >&2
  exit 1
fi

PROMPT="$(cat "${PROMPT_FILE}")"
if [[ "$#" -gt 0 ]]; then
  PROMPT="${PROMPT}"$'\n\n'"Additional design task:\n$*"
fi

cd "${ROOT}"
claude -p \
  --dangerously-skip-permissions \
  --allowedTools "Bash,Read,Edit,Write,Glob,Grep,LS" \
  --permission-mode bypassPermissions \
  --append-system-prompt "Prefer the repository design worker prompt and stay inside the current repository." \
  "${PROMPT}"
