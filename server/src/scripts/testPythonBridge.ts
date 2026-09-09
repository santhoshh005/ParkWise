import { runPythonScript } from "../services/pythonBridge.js";

runPythonScript("bridge_check.py", { zoneId: "kora-001" })
  .then((response) => console.log("Python bridge works:", response))
  .catch((error) => { console.error(error.message); process.exitCode = 1; });
