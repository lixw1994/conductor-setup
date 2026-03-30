#!/bin/bash
# ============================================================================
# Conductor Workspace Setup Script
# ============================================================================
# Installed and managed by: npx conductor-setup
# Supports: Node.js (pnpm / bun / npm) | Python (uv) | Go | env files
# Principle: install from local cache only, no network wait
# ============================================================================
set -euo pipefail

_info()  { printf '\033[0;36m[setup]\033[0m %s\n' "$*"; }
_ok()    { printf '\033[0;32m[setup]\033[0m %s\n' "$*"; }
_warn()  { printf '\033[0;33m[setup]\033[0m %s\n' "$*"; }
_err()   { printf '\033[0;31m[setup]\033[0m %s\n' "$*" >&2; }

_start=$(date +%s)
ROOT="${CONDUCTOR_ROOT_PATH:?CONDUCTOR_ROOT_PATH is not set}"

# ============================================================================
# 1. Env files
#    Match: .env | .env.* (.env.local, .env.production, ...)
#           .*.env (.dev.env, .prod.env, .local.env, ...)
#    Skip:  .env.example / .env.sample / .env.template
# ============================================================================
_info "Linking env files..."
env_count=0

for f in "$ROOT"/.env "$ROOT"/.env.* "$ROOT"/.*\.env; do
  [ -e "$f" ] || continue
  basename="$(basename "$f")"

  case "$basename" in
    *.example|*.sample|*.template) continue ;;
  esac

  [ -e "$basename" ] && continue

  ln -sf "$f" "$basename"
  _ok "  linked $basename"
  env_count=$((env_count + 1))
done

[ "$env_count" -eq 0 ] && _info "  no env files to link" \
                       || _ok "  $env_count env file(s) linked"

# ============================================================================
# 2. Node.js
#    Lockfile determines tool, no cross-tool fallback
#      pnpm-lock.yaml    → pnpm (global store hardlinks)
#      bun.lock[b]       → bun  (global cache)
#      package-lock.json → npm ci
#      no lockfile       → npm install
# ============================================================================
if [ -f "package.json" ]; then
  _info "Detected Node.js project"

  if [ -f "pnpm-lock.yaml" ]; then
    if command -v pnpm &>/dev/null; then
      _info "  Installing via pnpm..."
      pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -3
      _ok "  pnpm done"
    else
      _err "  pnpm-lock.yaml exists but pnpm is not installed"
      _err "  Install: npm i -g pnpm"
      exit 1
    fi

  elif [ -f "bun.lock" ] || [ -f "bun.lockb" ]; then
    if command -v bun &>/dev/null; then
      _info "  Installing via bun..."
      bun install --frozen-lockfile 2>&1 | tail -3
      _ok "  bun done"
    else
      _err "  bun lockfile exists but bun is not installed"
      _err "  Install: curl -fsSL https://bun.sh/install | bash"
      exit 1
    fi

  elif [ -f "package-lock.json" ]; then
    _info "  Installing via npm ci..."
    npm ci --prefer-offline --no-audit --no-fund 2>&1 | tail -3
    _ok "  npm ci done"

  else
    _warn "  No lockfile found, running npm install..."
    npm install --prefer-offline --no-audit --no-fund 2>&1 | tail -3
    _ok "  npm install done"
  fi
fi

# ============================================================================
# 3. Python — uv only
#    pyproject.toml → uv sync
#    requirements.txt → uv venv + uv pip install
#    Global cache: ~/.cache/uv
# ============================================================================
if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
  _info "Detected Python project"

  if ! command -v uv &>/dev/null; then
    _err "  uv is not installed"
    _err "  Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
  fi

  if [ -f "pyproject.toml" ]; then
    _info "  Installing via uv sync..."
    uv sync 2>&1 | tail -5
    _ok "  uv sync done"
  else
    _info "  Installing via uv (requirements.txt)..."
    uv venv .venv --quiet
    uv pip install -r requirements.txt --quiet
    _ok "  uv pip install done"
  fi
fi

# ============================================================================
# 4. Go
#    go mod download: global cache ~/go/pkg/mod
# ============================================================================
if [ -f "go.mod" ]; then
  _info "Detected Go project"

  if ! command -v go &>/dev/null; then
    _err "  go is not installed"
    exit 1
  fi

  _info "  Downloading modules (cached)..."
  go mod download 2>&1 | tail -3
  _ok "  Go modules ready"
fi

# ============================================================================
# Done
# ============================================================================
_elapsed=$(( $(date +%s) - _start ))
_ok "Setup complete in ${_elapsed}s"
