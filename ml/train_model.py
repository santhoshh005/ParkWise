"""Train ParkWise's occupancy prediction model.

Evaluation is done on a chronological holdout (the most recent days), so the reported
metrics reflect forecasting unseen future days rather than interpolating shuffled rows.
Historical-average features are computed from the training window only to avoid leakage.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from features import (
    CATEGORICAL_COLUMNS, FEATURE_COLUMNS, NUMERIC_COLUMNS,
    add_historical_average, build_averages, load_history,
)

MODEL_PATH = Path(__file__).resolve().parent / "parking_model.joblib"
HOLDOUT_DAYS = 14
INTERVAL_LEVEL = 0.8
RANDOM_STATE = 42


def make_candidates() -> dict:
    def pipeline(estimator):
        preprocess = ColumnTransformer([
            ("categories", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLUMNS),
            ("numbers", "passthrough", NUMERIC_COLUMNS),
        ])
        return Pipeline([("preprocess", preprocess), ("model", estimator)])

    return {
        "Gradient Boosting": pipeline(HistGradientBoostingRegressor(
            max_iter=400, learning_rate=0.05, max_leaf_nodes=31, min_samples_leaf=10,
            l2_regularization=1.0, random_state=RANDOM_STATE,
        )),
        "Random Forest": pipeline(RandomForestRegressor(
            n_estimators=300, min_samples_leaf=3, max_features=0.6,
            random_state=RANDOM_STATE, n_jobs=-1,
        )),
    }


def score(y_true, y_pred) -> dict:
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 2),
        "rmse": round(float(math.sqrt(mean_squared_error(y_true, y_pred))), 2),
        "r2": round(float(r2_score(y_true, y_pred)), 3),
    }


def conformal_half_width(residuals: np.ndarray, level: float) -> float:
    """Split-conformal quantile of absolute residuals with the finite-sample correction."""
    n = len(residuals)
    rank = min(1.0, math.ceil((n + 1) * level) / n)
    return float(np.quantile(np.abs(residuals), rank))


def main() -> None:
    history = load_history()
    cutoff = history["recordedAt"].max().normalize() - np.timedelta64(HOLDOUT_DAYS - 1, "D")
    train, test = history[history["recordedAt"] < cutoff], history[history["recordedAt"] >= cutoff]
    if train.empty or test.empty:
        raise ValueError("Not enough history for a chronological holdout split.")

    train_averages = build_averages(train)
    X_train = add_historical_average(train, train_averages)[FEATURE_COLUMNS]
    X_test = add_historical_average(test, train_averages)[FEATURE_COLUMNS]
    y_train, y_test = train["occupancyPercent"], test["occupancyPercent"]

    baseline = score(y_test, X_test["historicalAverage"])
    print(f"Baseline (historical average): MAE {baseline['mae']} | R² {baseline['r2']}")

    results = {}
    for name, candidate in make_candidates().items():
        candidate.fit(X_train, y_train)
        predictions = np.clip(candidate.predict(X_test), 0, 100)
        results[name] = (score(y_test, predictions), predictions)
        print(f"{name}: MAE {results[name][0]['mae']} | RMSE {results[name][0]['rmse']} | R² {results[name][0]['r2']}")

    best_name = min(results, key=lambda name: results[name][0]["mae"])
    best_metrics, best_predictions = results[best_name]
    half_width = conformal_half_width(y_test.to_numpy() - best_predictions, INTERVAL_LEVEL)
    coverage = float(np.mean(np.abs(y_test.to_numpy() - best_predictions) <= half_width))

    # Refit the selected model on all history so live predictions use the freshest data.
    full_averages = build_averages(history)
    final_model = make_candidates()[best_name]
    final_model.fit(add_historical_average(history, full_averages)[FEATURE_COLUMNS], history["occupancyPercent"])

    metrics = {
        **best_metrics,
        "baselineMae": baseline["mae"],
        "modelName": best_name,
        "intervalLevel": INTERVAL_LEVEL,
        "intervalHalfWidth": round(half_width, 1),
        "intervalCoverage": round(coverage, 3),
        "validation": f"chronological holdout (last {HOLDOUT_DAYS} days)",
        "trainingRecords": int(len(train)),
        "testRecords": int(len(test)),
        "trainedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    domain = {
        "minHour": int(history["hour"].min()),
        "maxHour": int(history["hour"].max()),
        "eventHours": sorted(int(h) for h in history.loc[history["hasEvent"] == 1, "hour"].unique()),
        "zones": sorted(full_averages["zone"]),
    }
    joblib.dump({"model": final_model, "averages": full_averages, "metrics": metrics, "domain": domain}, MODEL_PATH)
    print(f"Selected {best_name}; saved to {MODEL_PATH.name}")
    print(f"MAE {best_metrics['mae']} pp (baseline {baseline['mae']}) | R² {best_metrics['r2']} | "
          f"{int(INTERVAL_LEVEL * 100)}% interval ±{half_width:.1f} pp")


if __name__ == "__main__":
    main()
