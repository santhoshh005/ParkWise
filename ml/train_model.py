"""Train ParkWise's small, explainable occupancy prediction model."""
from pathlib import Path
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from features import FEATURE_COLUMNS, add_historical_average, average_by_zone_and_hour, load_history

MODEL_PATH = Path(__file__).resolve().parent / "parking_model.joblib"

def main() -> None:
    history = load_history()
    averages, fallback_average = average_by_zone_and_hour(history)
    features = add_historical_average(history, averages, fallback_average)

    X = features[FEATURE_COLUMNS]
    y = features["occupancyPercent"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    categorical = ["parkingZoneId", "weather"]
    numeric = ["hour", "dayOfWeek", "hasEvent", "historicalAverage"]
    preprocess = ColumnTransformer([
        ("categories", OneHotEncoder(handle_unknown="ignore"), categorical),
        ("numbers", "passthrough", numeric),
    ])
    model = Pipeline([
        ("preprocess", preprocess),
        ("forest", RandomForestRegressor(n_estimators=150, min_samples_leaf=2, random_state=42, n_jobs=-1)),
    ])
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, predictions)), 2),
        "r2": round(float(r2_score(y_test, predictions)), 3),
        "trainingRecords": int(len(X_train)),
        "testRecords": int(len(X_test)),
    }
    joblib.dump({"model": model, "averages": averages, "fallbackAverage": fallback_average, "metrics": metrics}, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH.name}")
    print(f"MAE: {metrics['mae']} percentage points | R²: {metrics['r2']}")

if __name__ == "__main__":
    main()
