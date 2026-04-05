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
USER_CODEX_HOME="${HOME}/.codex"
mkdir -p "${STATE_DIR}"

codex_exec_args() {
  local -a args
  args=(--disable apps -C "${ROOT}" -o "${LAST_MESSAGE_FILE}")
  if [[ "${CODEX_HARNESS_BYPASS_SANDBOX:-0}" == "1" ]]; then
    args+=(--dangerously-bypass-approvals-and-sandbox)
  else
    args+=(--sandbox danger-full-access)
  fi
  printf '%s\0' "${args[@]}"
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
prepare_codex_home
mapfile -d '' CODEX_ARGS < <(codex_exec_args)
env CODEX_HOME="${RUNTIME_HOME_DIR}" codex exec "${CODEX_ARGS[@]}" "${PROMPT}"
