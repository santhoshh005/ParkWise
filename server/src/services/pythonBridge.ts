import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(directory, "../../..");

function getPythonCommand(scriptPath: string): { command: string; args: string[] } {
  if (process.platform === "win32") {
    // Prefer Python 3.13 if py launcher is present to avoid Smart App Control issues on 3.14
    const check = spawnSync("py", ["-3.13", "--version"]);
    if (check.status === 0) {
      return { command: "py", args: ["-3.13", scriptPath] };
    }
  }
  return { command: "python", args: [scriptPath] };
}

/** Runs a small Python script and reads its JSON response. */
export function runPythonScript(scriptName: string, input: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(projectRoot, "ml", scriptName);
    const { command, args } = getPythonCommand(scriptPath);
    const python = spawn(command, args);
    let output = "";
    let errorOutput = "";
    python.stdout.on("data", (chunk) => { output += chunk.toString(); });
    python.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
    python.on("error", () => reject(new Error("Python could not start. Check that Python is installed and on PATH.")));
    python.on("close", (code) => {
      if (code !== 0) return reject(new Error(`Python prediction failed: ${errorOutput}`));
      try { resolve(JSON.parse(output)); }
      catch { reject(new Error("Python returned invalid JSON.")); }
    });
    python.stdin.write(JSON.stringify(input));
    python.stdin.end();
  });
}
