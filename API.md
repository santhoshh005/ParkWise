# API Documentation

The ParkWise backend exposes three RESTful endpoints via an Express server running on port 4000.

---

## `GET /api/health`
Health check endpoint to verify the server is running.

**Response** (200 OK)
```json
{
  "status": "ok"
}
```

---

## `GET /api/zones`
Retrieves a list of all parking zones in the database, ordered alphabetically by name.

**Response** (200 OK)
```json
[
  {
    "id": "kora-002",
    "name": "80 Feet Road Curbside",
    "area": "Koramangala",
    "latitude": 12.9359,
    "longitude": 77.6278,
    "totalSpaces": 90,
    "hourlyPrice": 35
  }
]
```

---

## `POST /api/predictions`
The core endpoint. Accepts context parameters and returns a ranked list of parking zones with ML-predicted occupancy rates.

**Request Body**
```json
{
  "date": "2026-09-09",
  "time": "14:00",
  "weather": "clear",
  "hasEvent": false
}
```
*Note: `weather` must be one of: `"clear"`, `"cloudy"`, `"rainy"`.*

**Response** (200 OK)
```json
{
  "request": {
    "area": "Koramangala",
    "date": "2026-09-09",
    "time": "14:00",
    "weather": "clear",
    "hasEvent": false
  },
  "recommended": {
    "id": "kora-001",
    "name": "Forum Mall Parking",
    "area": "Koramangala",
    "latitude": 12.9352,
    "longitude": 77.6245,
    "totalSpaces": 220,
    "hourlyPrice": 50,
    "occupancyPercent": 46.8,
    "availabilityPercent": 53.2,
    "distanceKm": 0,
    "estimatedFreeSpaces": 117,
    "status": "medium",
    "suggestedHourlyPrice": 50,
    "recommendationScore": 0.62
  },
  "explanation": "Recommended for its 53.2% predicted availability, close to the area centre.",
  "zones": [
    "... (Array of all zones including the recommended one, sorted by recommendationScore)"
  ],
  "modelMetrics": {
    "mae": 9.88,
    "r2": 0.364,
    "trainingRecords": 8064,
    "testRecords": 2016
  }
}
```

**Error Responses**
- `400 Bad Request`: Invalid input (e.g., malformed date, invalid weather string).
- `503 Service Unavailable`: The Python model could not be loaded or executed. (Usually means `npm run train:model` hasn't been run).
