#!/usr/bin/env -S deno run -A
/**
 * Manage homebase as a macOS launchd user service (LaunchAgent).
 *
 * Usage:
 *   deno task service install   — generate plist and load the agent
 *   deno task service uninstall — unload and remove the plist
 *   deno task service start     — start the service
 *   deno task service stop      — stop the service
 *   deno task service enable    — enable (load) the service so it starts at login
 *   deno task service disable   — disable (unload) the service
 *   deno task service status    — show current service status
 *   deno task service logs      — tail the service logs
 */

import { join } from "@std/path";

const LABEL = "com.homebase.server";
const PLIST_DIR = join(Deno.env.get("HOME")!, "Library", "LaunchAgents");
const PLIST_PATH = join(PLIST_DIR, `${LABEL}.plist`);
const LOG_DIR = join(Deno.env.get("HOME")!, "Library", "Logs", "homebase");

function getExecutablePath(): string {
  // Prefer an explicit env var, then look for compiled binary next to this script,
  // then fall back to running via deno.
  const explicit = Deno.env.get("HOMEBASE_BIN");
  if (explicit) return explicit;

  const dir = import.meta.dirname ?? Deno.cwd();
  const compiled = join(dir, "homebase");
  try {
    const stat = Deno.statSync(compiled);
    if (stat.isFile) return compiled;
  } catch { /* not found */ }

  return compiled;
}

function buildPlist(execPath: string): string {
  const configDir =
    Deno.env.get("CONFIG_DIR") ??
    join(Deno.env.get("HOME")!, ".config", "homebase");
  const port = Deno.env.get("PORT") ?? "8000";
  const host = Deno.env.get("HOST") ?? "127.0.0.1";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${execPath}</string>
  </array>

  <key>EnvironmentVariables</key>
  <dict>
    <key>CONFIG_DIR</key>
    <string>${configDir}</string>
    <key>PORT</key>
    <string>${port}</string>
    <key>HOST</key>
    <string>${host}</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>${join(LOG_DIR, "stdout.log")}</string>

  <key>StandardErrorPath</key>
  <string>${join(LOG_DIR, "stderr.log")}</string>

  <key>ProcessType</key>
  <string>Background</string>
</dict>
</plist>
`;
}

async function run(cmd: string[]): Promise<{ success: boolean; output: string }> {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
  });
  const result = await p.output();
  const output =
    new TextDecoder().decode(result.stdout) +
    new TextDecoder().decode(result.stderr);
  return { success: result.success, output: output.trim() };
}

async function install() {
  const execPath = getExecutablePath();

  try {
    Deno.statSync(execPath);
  } catch {
    console.error(
      `Binary not found at ${execPath}\n` +
        `Run 'deno task compile' first, or set HOMEBASE_BIN to point to the executable.`,
    );
    Deno.exit(1);
  }

  // Ensure directories
  await Deno.mkdir(PLIST_DIR, { recursive: true });
  await Deno.mkdir(LOG_DIR, { recursive: true });

  const plist = buildPlist(execPath);
  await Deno.writeTextFile(PLIST_PATH, plist);
  console.log(`Wrote ${PLIST_PATH}`);

  // Load the agent
  const { success, output } = await run(["launchctl", "load", PLIST_PATH]);
  if (!success && !output.includes("already loaded")) {
    console.error("Failed to load:", output);
    Deno.exit(1);
  }
  console.log("Service installed and loaded. It will start at login.");
}

async function uninstall() {
  await run(["launchctl", "unload", PLIST_PATH]);
  try {
    await Deno.remove(PLIST_PATH);
    console.log(`Removed ${PLIST_PATH}`);
  } catch {
    console.log("Plist already removed.");
  }
  console.log("Service uninstalled.");
}

async function start() {
  const { success, output } = await run(["launchctl", "start", LABEL]);
  if (!success) {
    console.error("Failed to start:", output);
    Deno.exit(1);
  }
  console.log("Service started.");
}

async function stop() {
  const { success, output } = await run(["launchctl", "stop", LABEL]);
  if (!success) {
    console.error("Failed to stop:", output);
    Deno.exit(1);
  }
  console.log("Service stopped.");
}

async function enable() {
  const { success, output } = await run(["launchctl", "load", PLIST_PATH]);
  if (!success && !output.includes("already loaded")) {
    console.error("Failed to enable:", output);
    Deno.exit(1);
  }
  console.log("Service enabled (will start at login).");
}

async function disable() {
  const { success, output } = await run(["launchctl", "unload", PLIST_PATH]);
  if (!success) {
    console.error("Failed to disable:", output);
    Deno.exit(1);
  }
  console.log("Service disabled (will not start at login).");
}

async function status() {
  const { output } = await run(["launchctl", "list"]);
  const lines = output.split("\n");
  const header = lines[0];
  const match = lines.find((l) => l.includes(LABEL));
  if (match) {
    console.log(header);
    console.log(match);
    const parts = match.trim().split(/\s+/);
    const pid = parts[0];
    const exitCode = parts[1];
    if (pid !== "-") {
      console.log(`\nRunning (PID ${pid})`);
    } else {
      console.log(`\nNot running (last exit code: ${exitCode})`);
    }
  } else {
    console.log("Service is not loaded. Run 'deno task service install' first.");
  }
}

async function logs() {
  const logFile = join(LOG_DIR, "stdout.log");
  const errFile = join(LOG_DIR, "stderr.log");
  console.log(`=== stdout (${logFile}) ===`);
  try {
    const p = new Deno.Command("tail", { args: ["-20", logFile], stdout: "inherit", stderr: "inherit" });
    await p.output();
  } catch {
    console.log("(no stdout log yet)");
  }
  console.log(`\n=== stderr (${errFile}) ===`);
  try {
    const p = new Deno.Command("tail", { args: ["-20", errFile], stdout: "inherit", stderr: "inherit" });
    await p.output();
  } catch {
    console.log("(no stderr log yet)");
  }
}

// --- CLI ---
const command = Deno.args[0];

const commands: Record<string, () => Promise<void>> = {
  install,
  uninstall,
  start,
  stop,
  enable,
  disable,
  status,
  logs,
};

if (!command || !commands[command]) {
  console.log(`Usage: deno task service <command>

Commands:
  install    Generate launchd plist and load the service
  uninstall  Unload and remove the service
  start      Start the service
  stop       Stop the service
  enable     Enable the service (starts at login)
  disable    Disable the service (won't start at login)
  status     Show service status
  logs       Tail recent service logs

The service runs the compiled 'homebase' binary. Run 'deno task compile' first.
Set HOMEBASE_BIN to override the binary path.`);
  Deno.exit(command ? 1 : 0);
}

await commands[command]();
