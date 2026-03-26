import { app } from "electron";
import { ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

let backendProcess: ChildProcess | null = null;

function resolveDevPythonPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", ".venv", "Scripts", "python.exe"),
    path.resolve(__dirname, "..", "..", "..", ".venv", "Scripts", "python.exe"),
    path.resolve(__dirname, "..", "..", ".venv", "Scripts", "python.exe")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function resolvePackagedBackendPath(): string {
  return path.join(process.resourcesPath, "backend", "pkb_backend.exe");
}

export function startBackendProcess(): void {
  if (backendProcess) {
    return;
  }
  if (process.env.PKB_BACKEND_AUTOSTART === "0") {
    return;
  }

  const port = process.env.PKB_BACKEND_PORT ?? "8000";
  const host = process.env.PKB_BACKEND_HOST ?? "127.0.0.1";
  const env = { ...process.env, PORT: port, HOST: host };

  if (app.isPackaged) {
    const executable = resolvePackagedBackendPath();
    backendProcess = spawn(executable, [], {
      env,
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }

  const devPython = resolveDevPythonPath();
  backendProcess = spawn(devPython, ["-m", "uvicorn", "backend.app.main:app", "--host", host, "--port", port], {
    env,
    stdio: "ignore",
    windowsHide: true
  });
}

export function stopBackendProcess(): void {
  if (!backendProcess) {
    return;
  }
  backendProcess.kill();
  backendProcess = null;
}
