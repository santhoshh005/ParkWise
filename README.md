# ParkWise AI

> Predict. Compare. Park. Smart parking availability predictions for Koramangala, before you arrive.

ParkWise is a full-stack web application that predicts parking spot availability using machine learning. It ranks nearby parking zones based on predicted availability, distance from the destination, and hourly price.

## Features

- **Machine Learning Predictions**: Uses a Random Forest regression model to predict occupancy based on time of day, day of week, weather, and nearby events.
- **Smart Ranking Engine**: Automatically suggests the best parking spot using a weighted scoring algorithm (55% availability, 30% distance, 15% price).
- **Interactive Map**: Real-time visual layout using Leaflet and OpenStreetMap, with color-coded markers scaled by parking lot capacity.
- **Explainable AI**: Provides plain-English explanations for why a spot was recommended, along with model telemetry (MAE, R²).

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React-Leaflet
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite
- **Machine Learning**: Python, Scikit-Learn, Pandas, Joblib

## Prerequisites

- Node.js (v20+)
- Python (3.10+)
- npm or yarn

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   npm run dev:client # (installs client deps)
   npm run dev:server # (installs server deps)
   pip install -r ml/requirements.txt
   ```

2. **Database Setup**
   The project uses a local SQLite database. Seed it with the simulated Koramangala parking data:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **Train the Model**
   Train the Random Forest model on the seeded historical data. This creates the `parking_model.joblib` artifact:
   ```bash
   npm run train:model
   ```

4. **Run the Application**
   Start both the backend and frontend concurrently:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Project Structure

- `/client` - React frontend
- `/server` - Express backend and API endpoints
- `/ml` - Python training scripts and model artifacts
- `/prisma` - Database schema and seeding scripts
