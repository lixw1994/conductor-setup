# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-dependency npm CLI (`npx conductor-setup`) that installs a universal workspace setup script for [Conductor](https://conductor.build). Users run it once; Conductor calls the installed script on every new workspace.

## Architecture

```
npx conductor-setup install
        │
        v
  bin/cli.js          ← Node.js CLI (fs/path/child_process only, no deps)
  │  Manages install/update/uninstall of setup.sh
  │  Install target: ~/.config/conductor-scripts/setup.sh
  │
  scripts/setup.sh    ← Bash worker, called by Conductor at workspace creation
     Receives CONDUCTOR_ROOT_PATH env var
     Phases: env symlink → Node.js → Python → Go
```

- **cli.js** is the installer — copies setup.sh to the user's home directory
- **setup.sh** is the runtime — Conductor calls it directly, cli.js is not involved after install

## Release workflow

1. Bump version in `package.json`
2. Commit and push to main
3. Create a GitHub Release on github.com (tag format: `v0.1.1`)
4. GitHub Actions auto-publishes to npm (`.github/workflows/publish.yml`)

The workflow uses `npm publish --provenance --access public` with `NPM_TOKEN` secret. No manual `npm publish` needed after first release.

## Key constraints

- **Zero dependencies.** cli.js uses only Node.js stdlib. Do not add npm dependencies.
- **setup.sh must be self-contained.** It runs on user machines without Node.js context — pure bash, no npm imports.
- **Lockfile detection is strict.** Node.js phase errors out if lockfile exists but the matching tool (pnpm/bun) is not installed. Never silently fallback to npm.
- **Python uses uv only.** No pip/venv/conda support.
- **`files` in package.json** controls what ships to npm: only `bin/` and `scripts/`. Keep it minimal.
