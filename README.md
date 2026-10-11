# ParkWise

> **Predict. Compare. Park.**  
> Smart parking availability predictions for Koramangala, before you arrive.

ParkWise is a full-stack web application that predicts how full nearby parking lots will be at a future date and time. A driver enters when they plan to arrive and what the conditions are (weather, nearby event). A machine learning model then predicts the occupancy of each parking zone and recommends the best spot based on availability, distance, and price.

---

## What It Does

1. The user selects a **date, time, weather, and event status** on the dashboard.
2. The frontend sends this to the Express backend via a REST API call.
3. The backend fetches all Koramangala parking zones from a SQLite database.
4. A **Random Forest ML model** (trained on 84 days of simulated historical data) predicts the occupancy percentage for each zone.
5. The backend **ranks** all zones using a weighted score: **55% Availability + 30% Distance + 15% Price**.
6. The UI displays the results on an **interactive Leaflet map** and as ranked cards.

---

## Features

- **ML Predictions** — Random Forest Regressor trained on time, day, weather, and event features.
- **Smart Ranking** — Composite scoring to automatically surface the best parking option.
- **Interactive Map** — Color-coded markers on OpenStreetMap showing predicted availability at a glance.
- **Plain-English Explanations** — Tells the user *why* a spot was recommended.
- **Dynamic Pricing** *(stretch feature)* — Suggested price adjusts based on how full a lot is predicted to be.
- **Model Telemetry** — Displays MAE and R² so the user can see how accurate the model is.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React-Leaflet |
| Backend | Node.js, Express 5, TypeScript |
| Database | SQLite + Prisma ORM |
| Machine Learning | Python, Scikit-Learn (Random Forest), Pandas, Joblib |

---

## Local Setup

### Prerequisites
- **Node.js** v18 or higher
- **Python** 3.10 or higher
- **npm**

### Steps

**1. Install dependencies**
```bash
npm install
pip install -r ml/requirements.txt
```

**2. Set up the database**
```bash
npm run db:generate   # generate Prisma client
npm run db:push       # create SQLite tables
npm run db:seed       # seed 8 parking zones + 84 days of historical data
```

**3. Train the ML model**
```bash
npm run train:model   # trains Random Forest and saves parking_model.joblib
```

**4. Run the app**
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## How the Map Works

Each parking zone is displayed as a colored circle on the map:

| Color | Meaning | Availability |
|---|---|---|
| 🟢 Green | High availability | ≥ 60% |
| 🟡 Yellow | Medium availability | 30% – 59.9% |
| 🔴 Red | Low availability | < 30% |

Clicking a card or map marker flies the map to that location and highlights it.

---

## How the Recommendation Score Works

The backend scores each parking zone using three factors:

```
score = (availability × 0.55) + (distance_score × 0.30) + (price_score × 0.15)
```

The zone with the **highest score** is recommended as the Best Match.

---

## Project Structure

```
ParkWise/
├── client/          # React frontend (Vite + Tailwind + Leaflet)
├── server/          # Express REST API + ranking engine
├── ml/              # Python ML scripts + trained model artifact
└── prisma/          # SQLite database schema + seed script
```

---

## Data Disclaimer

All parking zone data and historical occupancy records are **simulated** for the purpose of this assessment. They are not sourced from any real-world parking system. The simulation models realistic patterns for weekday/weekend rush hours, weather effects, and event-driven spikes.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/zones` | List all parking zones |
| POST | `/api/predictions` | Get ML predictions + ranked recommendations |

**POST `/api/predictions` payload:**
```json
{
  "date": "2026-10-12",
  "time": "14:00",
  "weather": "clear",
  "hasEvent": false
}
```
