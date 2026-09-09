"""Shared data and feature helpers for model training and prediction."""
from pathlib import Path
import sqlite3
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATABASE_PATH = PROJECT_ROOT / "prisma" / "parkwise.db"

def load_history() -> pd.DataFrame:
    """Read the same historical records seeded by Prisma."""
    query = """
        SELECT parkingZoneId, recordedAt, occupancyPercent, weather, hasEvent
        FROM HistoricalOccupancy
    """
    with sqlite3.connect(DATABASE_PATH) as connection:
        history = pd.read_sql_query(query, connection)
    history["recordedAt"] = pd.to_datetime(history["recordedAt"], utc=True)
    history["hour"] = history["recordedAt"].dt.hour
    history["dayOfWeek"] = history["recordedAt"].dt.dayofweek
    history["hasEvent"] = history["hasEvent"].astype(int)
    return history

def average_by_zone_and_hour(history: pd.DataFrame) -> tuple[dict[str, float], float]:
    averages = history.groupby(["parkingZoneId", "hour"])["occupancyPercent"].mean()
    lookup = {f"{zone_id}|{hour}": float(value) for (zone_id, hour), value in averages.items()}
    return lookup, float(history["occupancyPercent"].mean())

def add_historical_average(data: pd.DataFrame, averages: dict[str, float], fallback: float) -> pd.DataFrame:
    result = data.copy()
    keys = result["parkingZoneId"].astype(str) + "|" + result["hour"].astype(str)
    result["historicalAverage"] = keys.map(averages).fillna(fallback)
    return result

FEATURE_COLUMNS = ["parkingZoneId", "hour", "dayOfWeek", "weather", "hasEvent", "historicalAverage"]
