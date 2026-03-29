# conductor-setup

Universal workspace setup script for [Conductor](https://conductor.build).

One install, all repos. Auto-detects your project stack and installs dependencies from local cache — no network wait.

## Quick start

```bash
# Install
npx conductor-setup install

# It prints the path — paste it into Conductor:
# Conductor → Repository Settings → Setup Script
```

That's it. Every new workspace auto-runs the script.

## Commands

| Command | What it does |
|---|---|
| `npx conductor-setup install` | Install `setup.sh` to `~/.config/conductor-scripts/` |
| `npx conductor-setup update` | Update to latest version |
| `npx conductor-setup path` | Print the installed path (pipe-friendly) |
| `npx conductor-setup run` | Execute directly (for testing) |
| `npx conductor-setup uninstall` | Remove installed files |

## What it handles

### Env files

Symlinks all untracked env files from the repo root into the workspace:

- `.env`
- `.env.*` — `.env.local`, `.env.development`, `.env.production`, ...
- `.*.env` — `.dev.env`, `.prod.env`, `.local.env`, ...

Skips `.env.example`, `.env.sample`, `.env.template`.

### Node.js

Auto-detects by lockfile, never cross-tool fallback:

| Lockfile | Tool | Speed |
|---|---|---|
| `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | ~3-8s (hardlink from global store) |
| `bun.lock` / `bun.lockb` | `bun install --frozen-lockfile` | ~2-5s (global cache) |
| `package-lock.json` | `npm ci` | ~5-15s (global cache) |
| none | `npm install` | varies |

If lockfile is pnpm/bun but the tool isn't installed, it errors out — not silently fallback to npm.

### Python

uv only. Fast, no venv path issues.

| File | Command | Speed |
|---|---|---|
| `pyproject.toml` | `uv sync` | ~1-3s |
| `requirements.txt` | `uv venv` + `uv pip install` | ~3-8s |

### Go

```
go mod download
```

Uses global module cache (`~/go/pkg/mod`). Near-instant if modules were downloaded before.

## Per-project overrides

For repos that need extra steps, create a wrapper in that repo:

```bash
#!/bin/bash
# conductor-setup.sh (committed to the repo)
source ~/.config/conductor-scripts/setup.sh

# extra steps for this project
protoc --go_out=. proto/*.proto
redis-cli flushdb
```

Set that repo's Setup Script to `./conductor-setup.sh`.

## Requirements

- Node.js >= 18 (for npx)
- Per ecosystem: `pnpm` / `bun` / `npm`, `uv`, `go`

## License

MIT
