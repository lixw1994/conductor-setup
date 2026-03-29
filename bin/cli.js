#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// ── paths ──────────────────────────────────────────────────────────────────
const INSTALL_DIR = path.join(os.homedir(), ".config", "conductor-scripts");
const INSTALL_PATH = path.join(INSTALL_DIR, "setup.sh");
const SOURCE_PATH = path.join(__dirname, "..", "scripts", "setup.sh");

// ── colors (no deps) ──────────────────────────────────────────────────────
const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,
};

// ── commands ───────────────────────────────────────────────────────────────

function install() {
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  fs.copyFileSync(SOURCE_PATH, INSTALL_PATH);
  fs.chmodSync(INSTALL_PATH, 0o755);

  console.log();
  console.log(c.g("✓ Installed successfully"));
  console.log();
  console.log(`  Script:  ${c.b(INSTALL_PATH)}`);
  console.log();
  console.log(c.b("  Next step:"));
  console.log(`  Open Conductor → Repository Settings → Setup Script`);
  console.log(`  Paste this path:`);
  console.log();
  console.log(`    ${c.g(INSTALL_PATH)}`);
  console.log();
}

function update() {
  if (!fs.existsSync(INSTALL_PATH)) {
    console.log(c.y("Not installed yet. Running install..."));
    console.log();
    install();
    return;
  }

  const oldContent = fs.readFileSync(INSTALL_PATH, "utf-8");
  const newContent = fs.readFileSync(SOURCE_PATH, "utf-8");

  if (oldContent === newContent) {
    console.log(c.g("✓ Already up to date"));
    return;
  }

  fs.copyFileSync(SOURCE_PATH, INSTALL_PATH);
  fs.chmodSync(INSTALL_PATH, 0o755);
  console.log(c.g("✓ Updated"));
}

function showPath() {
  if (!fs.existsSync(INSTALL_PATH)) {
    console.error(c.r("Not installed. Run: npx conductor-setup install"));
    process.exit(1);
  }
  // 输出纯路径，方便 shell 管道使用
  console.log(INSTALL_PATH);
}

function run() {
  // 直接执行 setup.sh (用于测试或 Conductor 直接调用)
  const script = fs.existsSync(INSTALL_PATH) ? INSTALL_PATH : SOURCE_PATH;

  if (!process.env.CONDUCTOR_ROOT_PATH) {
    console.log(c.y("Warning: CONDUCTOR_ROOT_PATH not set."));
    console.log(c.d("  This script is designed to run inside a Conductor workspace."));
    console.log(c.d("  Set it manually for testing:"));
    console.log(c.d("    CONDUCTOR_ROOT_PATH=/path/to/repo npx conductor-setup run"));
    console.log();
    process.exit(1);
  }

  try {
    execSync(`bash "${script}"`, { stdio: "inherit", env: process.env });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

function uninstall() {
  if (fs.existsSync(INSTALL_PATH)) {
    fs.unlinkSync(INSTALL_PATH);
    console.log(c.g("✓ Removed " + INSTALL_PATH));

    // 如果目录为空，也删掉
    try {
      const remaining = fs.readdirSync(INSTALL_DIR);
      if (remaining.length === 0) {
        fs.rmdirSync(INSTALL_DIR);
        console.log(c.d("  Removed empty directory " + INSTALL_DIR));
      }
    } catch {}
  } else {
    console.log(c.y("Nothing to remove."));
  }
}

function help() {
  console.log(`
${c.b("conductor-setup")} — Universal workspace setup for Conductor

${c.b("Usage:")}

  npx conductor-setup ${c.g("install")}     Install setup.sh to ~/.config/conductor-scripts/
  npx conductor-setup ${c.g("update")}      Update to latest version
  npx conductor-setup ${c.g("path")}        Print installed script path (for Conductor settings)
  npx conductor-setup ${c.g("run")}         Execute setup script (for testing)
  npx conductor-setup ${c.g("uninstall")}   Remove installed files

${c.b("Supported ecosystems:")}

  Node.js    pnpm → bun → npm (auto-detect by lockfile)
  Python     uv only
  Go         go mod download (global cache)
  env        .env / .env.* / .*.env (symlinked)

${c.b("Quick start:")}

  1.  npx conductor-setup install
  2.  Open Conductor → repo settings → Setup Script
  3.  Paste:  ${INSTALL_PATH}
  4.  Done. Every new workspace auto-runs the script.
`);
}

// ── main ───────────────────────────────────────────────────────────────────
const cmd = process.argv[2];

switch (cmd) {
  case "install":
    install();
    break;
  case "update":
    update();
    break;
  case "path":
    showPath();
    break;
  case "run":
    run();
    break;
  case "uninstall":
    uninstall();
    break;
  default:
    help();
    break;
}
