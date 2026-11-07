"""Shared data and feature helpers for model training and prediction."""
from __future__ import annotations

import math
import os
import sqlite3
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATABASE_PATH = Path(os.environ.get("PARKWISE_DB_PATH", PROJECT_ROOT / "prisma" / "parkwise.db"))

CATEGORICAL_COLUMNS = ["parkingZoneId", "weather"]
NUMERIC_COLUMNS = [
    "hour", "hourSin", "hourCos", "dayOfWeek", "isWeekend",
    "hasEvent", "historicalAverage", "zoneAverage",
]
FEATURE_COLUMNS = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS


def parse_timestamps(values: pd.Series) -> pd.Series:
    """Prisma stores SQLite DateTime values as epoch milliseconds; older rows may be ISO strings."""
    if pd.api.types.is_numeric_dtype(values):
        return pd.to_datetime(values, unit="ms", utc=True)
    numeric = pd.to_numeric(values, errors="coerce")
    if numeric.notna().all():
        return pd.to_datetime(numeric, unit="ms", utc=True)
    return pd.to_datetime(values, utc=True, format="mixed")


def add_time_features(data: pd.DataFrame) -> pd.DataFrame:
    """Derive calendar features from `hour` and `dayOfWeek` (Monday = 0)."""
    result = data.copy()
    angle = 2 * math.pi * result["hour"] / 24
    result["hourSin"] = angle.map(math.sin)
    result["hourCos"] = angle.map(math.cos)
    result["isWeekend"] = (result["dayOfWeek"] >= 5).astype(int)
    result["hasEvent"] = result["hasEvent"].astype(int)
    return result


def load_history(database_path: Path = DATABASE_PATH) -> pd.DataFrame:
    """Read the historical records seeded by Prisma, sorted chronologically."""
    if not database_path.exists():
        raise FileNotFoundError(f"Database not found at {database_path}. Run `npm run db:push && npm run db:seed` first.")
    query = """
        SELECT parkingZoneId, recordedAt, occupancyPercent, weather, hasEvent
        FROM HistoricalOccupancy
    """
    with sqlite3.connect(database_path) as connection:
        history = pd.read_sql_query(query, connection)
    if history.empty:
        raise ValueError("No historical occupancy records found. Run `npm run db:seed` first.")
    history["recordedAt"] = parse_timestamps(history["recordedAt"])
    history["hour"] = history["recordedAt"].dt.hour
    history["dayOfWeek"] = history["recordedAt"].dt.dayofweek
    return add_time_features(history).sort_values("recordedAt", ignore_index=True)


def build_averages(history: pd.DataFrame) -> dict:
    """Historical occupancy lookups, computed only from the data the model is allowed to see."""
    by_slot = history.groupby(["parkingZoneId", "isWeekend", "hour"])["occupancyPercent"].mean()
    by_zone_hour = history.groupby(["parkingZoneId", "hour"])["occupancyPercent"].mean()
    by_zone = history.groupby("parkingZoneId")["occupancyPercent"].mean()
    return {
        "slot": {f"{zone}|{weekend}|{hour}": float(v) for (zone, weekend, hour), v in by_slot.items()},
        "zoneHour": {f"{zone}|{hour}": float(v) for (zone, hour), v in by_zone_hour.items()},
        "zone": {str(zone): float(v) for zone, v in by_zone.items()},
        "global": float(history["occupancyPercent"].mean()),
    }


def add_historical_average(data: pd.DataFrame, averages: dict) -> pd.DataFrame:
    """Attach the zone/day-type/hour average, falling back to coarser averages when a slot is unseen."""
    result = data.copy()
    zone = result["parkingZoneId"].astype(str)
    hour = result["hour"].astype(int).astype(str)
    weekend = result["isWeekend"].astype(int).astype(str)
    zone_avg = zone.map(averages["zone"]).fillna(averages["global"])
    hist = (zone + "|" + weekend + "|" + hour).map(averages["slot"])
    hist = hist.fillna((zone + "|" + hour).map(averages["zoneHour"])).fillna(zone_avg)
    result["historicalAverage"] = hist
    result["zoneAverage"] = zone_avg
    return result
