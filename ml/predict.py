"""Load the trained ParkWise model and return occupancy predictions as JSON."""
import json
import sys
from datetime import datetime
from pathlib import Path
import joblib
import pandas as pd
from features import FEATURE_COLUMNS, add_historical_average

MODEL_PATH = Path(__file__).resolve().parent / "parking_model.joblib"

def main() -> None:
    request = json.loads(sys.stdin.read())
    selected_time = datetime.fromisoformat(f"{request['date']}T{request['time']}")
    zones = request["zones"]
    artifact = joblib.load(MODEL_PATH)
    feature_rows = pd.DataFrame([{
        "parkingZoneId": zone["id"],
        "hour": selected_time.hour,
        "dayOfWeek": selected_time.weekday(),
        "weather": request["weather"],
        "hasEvent": int(request["hasEvent"]),
    } for zone in zones])
    features = add_historical_average(feature_rows, artifact["averages"], artifact["fallbackAverage"])
    occupancies = artifact["model"].predict(features[FEATURE_COLUMNS])
    predictions = [{"zoneId": zone["id"], "occupancyPercent": round(float(max(0, min(100, value))), 1)} for zone, value in zip(zones, occupancies)]
    print(json.dumps({"predictions": predictions, "metrics": artifact["metrics"]}))

if __name__ == "__main__":
    main()
