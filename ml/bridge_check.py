"""Temporary smoke test for the Node-to-Python integration.

The real prediction script will replace this in Phase 3.
"""
import json
import sys

payload = json.loads(sys.stdin.read() or "{}")
print(json.dumps({"ok": True, "receivedZone": payload.get("zoneId")}))
