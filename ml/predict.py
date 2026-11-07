"""Load the trained ParkWise model and return occupancy predictions as JSON (stdin -> stdout)."""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from features import FEATURE_COLUMNS, add_historical_average, add_time_features

MODEL_PATH = Path(__file__).resolve().parent / "parking_model.joblib"


def domain_warnings(hour: int, has_event: bool, domain: dict) -> list[str]:
    warnings = []
    if not domain["minHour"] <= hour <= domain["maxHour"]:
        warnings.append(
            f"Historical data only covers {domain['minHour']}:00–{domain['maxHour']}:00, "
            "so this prediction is an extrapolation and may be less reliable."
        )
    elif has_event and domain["eventHours"] and hour not in domain["eventHours"]:
        warnings.append("Few past events occurred at this hour, so the event impact is an estimate.")
    return warnings


def predict(request: dict, artifact: dict) -> dict:
    selected_time = datetime.fromisoformat(f"{request['date']}T{request['time']}")
    zones = request["zones"]
    rows = pd.DataFrame([{
        "parkingZoneId": zone["id"],
        "hour": selected_time.hour,
        "dayOfWeek": selected_time.weekday(),
        "weather": request["weather"],
        "hasEvent": bool(request["hasEvent"]),
    } for zone in zones])
    features = add_historical_average(add_time_features(rows), artifact["averages"])
    occupancies = np.clip(artifact["model"].predict(features[FEATURE_COLUMNS]), 0, 100)
    half_width = artifact["metrics"]["intervalHalfWidth"]

    predictions = [{
        "zoneId": zone["id"],
        "occupancyPercent": round(float(value), 1),
        "occupancyLow": round(float(max(0.0, value - half_width)), 1),
        "occupancyHigh": round(float(min(100.0, value + half_width)), 1),
    } for zone, value in zip(zones, occupancies)]
    return {
        "predictions": predictions,
        "metrics": artifact["metrics"],
        "warnings": domain_warnings(selected_time.hour, bool(request["hasEvent"]), artifact["domain"]),
    }


def serve(artifact: dict) -> None:
    """Persistent worker: one JSON request per line in, one JSON response per line out."""
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            response = predict(json.loads(line), artifact)
        except Exception as error:  # report per-request failures without killing the worker
            response = {"error": f"{type(error).__name__}: {error}"}
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


def main() -> None:
    if not MODEL_PATH.exists():
        sys.exit("Model artifact not found. Run `npm run train:model` first.")
    artifact = joblib.load(MODEL_PATH)
    if "domain" not in artifact:
        sys.exit("Model artifact is outdated. Re-run `npm run train:model`.")
    if "--serve" in sys.argv:
        serve(artifact)
    else:
        print(json.dumps(predict(json.loads(sys.stdin.read()), artifact)))


if __name__ == "__main__":
    main()
