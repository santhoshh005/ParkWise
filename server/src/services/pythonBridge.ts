import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(directory, "../../..");
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
const REQUEST_TIMEOUT_MS = Number(process.env.PREDICTION_TIMEOUT_MS) || 20_000;

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };

/**
 * Keeps one long-lived Python worker (`predict.py --serve`) so the model is loaded once,
 * not on every request. Requests are answered in order (one JSON line in, one line out).
 * The worker is restarted automatically if it crashes or a request times out.
 */
export class PythonWorker {
  private child: ChildProcessWithoutNullStreams | null = null;
  private pending: Pending[] = [];
  private stderr = "";

  constructor(private readonly scriptName: string) {}

  private start() {
    const child = spawn(PYTHON_BIN, [path.join(projectRoot, "ml", this.scriptName), "--serve"], {
      cwd: path.join(projectRoot, "ml"),
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    this.stderr = "";
    createInterface({ input: child.stdout }).on("line", (line) => this.handleLine(line));
    child.stderr.on("data", (chunk: Buffer) => {
      this.stderr = (this.stderr + chunk.toString()).slice(-2_000);
    });
    child.on("error", (error) => this.fail(new Error(`Python could not start (${PYTHON_BIN}): ${error.message}`)));
    child.on("exit", (code) => {
      if (this.child === child) this.child = null;
      this.fail(new Error(`Python worker exited with code ${code}. ${this.stderr.trim()}`));
    });
    this.child = child;
    return child;
  }

  private handleLine(line: string) {
    const request = this.pending.shift();
    if (!request) return;
    clearTimeout(request.timer);
    try {
      const parsed = JSON.parse(line) as { error?: string };
      if (parsed.error) request.reject(new Error(`Prediction failed: ${parsed.error}`));
      else request.resolve(parsed);
    } catch {
      request.reject(new Error("Python returned invalid JSON."));
    }
  }

  private fail(error: Error) {
    for (const request of this.pending.splice(0)) {
      clearTimeout(request.timer);
      request.reject(error);
    }
  }

  run(input: object): Promise<unknown> {
    const child = this.child ?? this.start();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // Responses are ordered, so a stuck request means the worker must be replaced.
        this.fail(new Error("Prediction timed out."));
        child.kill();
      }, REQUEST_TIMEOUT_MS);
      this.pending.push({ resolve, reject, timer });
      child.stdin.write(`${JSON.stringify(input)}\n`);
    });
  }

  stop() {
    this.child?.kill();
    this.child = null;
  }
}
