"""Unit tests for the ML feature pipeline and prediction output. Run: python -m unittest discover ml"""
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from features import add_historical_average, add_time_features, build_averages, parse_timestamps  # noqa: E402
from predict import domain_warnings, predict  # noqa: E402
from train_model import conformal_half_width  # noqa: E402


class FeatureTests(unittest.TestCase):
    def test_parses_prisma_epoch_milliseconds(self):
        # 2026-06-01T18:00:00Z as stored by Prisma in SQLite.
        parsed = parse_timestamps(pd.Series([1780336800000]))
        self.assertEqual((parsed.dt.year[0], parsed.dt.hour[0], parsed.dt.dayofweek[0]), (2026, 18, 0))

    def test_parses_iso_strings(self):
        parsed = parse_timestamps(pd.Series(["2026-06-06T09:00:00.000Z"]))
        self.assertEqual((parsed.dt.hour[0], parsed.dt.dayofweek[0]), (9, 5))

    def test_time_features(self):
        rows = add_time_features(pd.DataFrame({"hour": [0, 6], "dayOfWeek": [4, 6], "hasEvent": [False, True]}))
        self.assertEqual(rows["isWeekend"].tolist(), [0, 1])
        self.assertEqual(rows["hasEvent"].tolist(), [0, 1])
        self.assertAlmostEqual(rows["hourSin"][1], 1.0)

    def test_historical_average_falls_back_for_unseen_slots(self):
        history = add_time_features(pd.DataFrame({
            "parkingZoneId": ["a", "a", "b"], "hour": [9, 9, 9], "dayOfWeek": [0, 1, 0],
            "hasEvent": [0, 0, 0], "occupancyPercent": [40.0, 60.0, 20.0],
        }))
        averages = build_averages(history)
        query = add_time_features(pd.DataFrame({
            "parkingZoneId": ["a", "a", "z"], "hour": [9, 10, 9], "dayOfWeek": [2, 2, 2], "hasEvent": [0, 0, 0],
        }))
        result = add_historical_average(query, averages)
        self.assertEqual(result["historicalAverage"].tolist(), [50.0, 50.0, averages["global"]])


class PredictionTests(unittest.TestCase):
    def test_conformal_half_width_covers_requested_share(self):
        residuals = np.arange(-50, 51, dtype=float)
        width = conformal_half_width(residuals, 0.8)
        self.assertGreaterEqual(np.mean(np.abs(residuals) <= width), 0.8)

    def test_domain_warnings(self):
        domain = {"minHour": 7, "maxHour": 22, "eventHours": [17, 18]}
        self.assertEqual(domain_warnings(12, False, domain), [])
        self.assertEqual(len(domain_warnings(3, False, domain)), 1)
        self.assertEqual(len(domain_warnings(9, True, domain)), 1)

    def test_predict_returns_clipped_ranges(self):
        class ConstantModel:
            def predict(self, features):
                return np.array([98.0] * len(features))

        artifact = {
            "model": ConstantModel(),
            "averages": {"slot": {}, "zoneHour": {}, "zone": {}, "global": 50.0},
            "metrics": {"intervalHalfWidth": 5.0},
            "domain": {"minHour": 7, "maxHour": 22, "eventHours": []},
        }
        result = predict({"date": "2026-11-09", "time": "10:00", "weather": "clear", "hasEvent": False,
                          "zones": [{"id": "a"}]}, artifact)
        self.assertEqual(result["predictions"][0], {"zoneId": "a", "occupancyPercent": 98.0,
                                                    "occupancyLow": 93.0, "occupancyHigh": 100.0})


if __name__ == "__main__":
    unittest.main()
