# Interview Q&A / Learning Guide

This guide is designed to help you understand every piece of the ParkWise AI project and confidently explain it in an interview setting.

---

## Part 1: What Everything Does (The Tech Stack)

**Frontend**
- **React**: The library used to build the user interface. It lets us create reusable components (like the Prediction Form or the Zone Card) and manage state (like whether the loading spinner should show).
- **TypeScript**: A version of JavaScript that adds "types" (like `string`, `number`, or custom shapes like `PredictionRequest`). It prevents bugs by catching errors before the code even runs.
- **Vite**: The build tool that takes our React/TypeScript code and bundles it up so the browser can read it. It also provides the ultra-fast local development server (`localhost:5173`).
- **Tailwind CSS**: A utility-first CSS framework. Instead of writing custom CSS files, we use class names like `text-emerald-600` or `rounded-2xl` directly in the HTML/JSX to style things quickly.
- **Leaflet & React-Leaflet**: The open-source mapping library. It lets us display the interactive OpenStreetMap and drop our colored parking markers onto it.

**Backend**
- **Node.js**: The runtime that allows us to run JavaScript on the server (outside the browser).
- **Express**: A minimal web framework for Node.js. It gives us an easy way to define our API endpoints (like `app.post('/api/predictions')`) and handle incoming web requests.
- **REST API**: An architectural style for creating web services. It means our backend uses standard HTTP methods (GET, POST) and returns standard JSON data that the frontend can easily read.
- **SQLite**: A lightweight, file-based database (`parkwise.db`). It doesn't require installing a massive database server like PostgreSQL, making it perfect for local development and demos.
- **Prisma**: Our ORM (Object-Relational Mapper). It allows us to talk to the SQLite database using clean TypeScript code instead of writing raw SQL queries.

**Machine Learning**
- **Python**: The language used for our machine learning logic, because it has the best data science libraries.
- **Scikit-Learn**: The Python library used to train our prediction model (Random Forest).
- **Pandas**: A Python library used for structuring data into tables (DataFrames) to feed into the model.

---

## Part 2: How Data Flows

1. **User Input**: The user selects a date, time, weather, and event status on the React frontend and clicks "Get Predictions".
2. **API Request**: The frontend uses `fetch` to send a POST request with this data to the Express backend (`/api/predictions`).
3. **Database Lookup**: Express uses Prisma to fetch the list of Koramangala parking zones from the SQLite database.
4. **Python Bridge**: Express uses `child_process.spawn` to run the `predict.py` Python script, passing the user data and zone list via standard input (stdin).
5. **Prediction**: The Python script loads the pre-trained `parking_model.joblib` artifact, formats the data, runs it through the Random Forest model to predict occupancy, and prints the result.
6. **Recommendation Engine**: Express reads the Python output, calculates "Availability" (100 - occupancy), and ranks the zones based on Availability, Distance, and Price.
7. **Response**: Express sends the ranked list and the top recommendation back to the frontend as JSON.
8. **UI Update**: React receives the JSON, stops the loading spinner, updates the map markers, and displays the recommendation cards.

---

## Part 3: Interview Question Bank

### 1. Explain your project.
"ParkWise AI is a full-stack web application that predicts parking availability in Koramangala. A user inputs the time, weather, and event status, and the app uses a machine learning model trained on historical data to predict how full nearby parking lots will be. It then ranks the spots based on availability, distance, and price, and displays the recommendations on an interactive map."

### 2. Why did you choose this tech stack?
"I wanted a stack that was modern but simple to explain and run locally. React and Tailwind allowed me to build a polished UI quickly. Node and Express are standard for backend APIs, and SQLite with Prisma meant I didn't need to spin up a heavy database server just to demo the project. Python was used strictly for the ML portion because of scikit-learn."

### 3. How does the prediction work?
"The Express backend takes the user's context (time, weather) and spawns a child Python process. This Python script loads a pre-trained machine learning model (saved as a `.joblib` file), inputs the features, predicts the occupancy percentage for each parking zone, and returns the data to Node via JSON."

### 4. Why Random Forest?
"Random Forest is a simple, explainable tabular model. It doesn't require complex neural networks or deep learning, it handles categorical data well, and it's fast to train and run. It’s perfect for capturing patterns like 'parking is busy on weekday evenings when it rains'."

### 5. What data did you use?
"I created a simulated dataset of 8 parking zones in Koramangala and generated 84 days of hourly historical occupancy data. The data includes patterns for morning commutes, lunch hours, weekend spikes, and weather impacts."

### 6. Why simulated data?
"Real-time, granular parking occupancy data is extremely difficult to obtain without proprietary hardware sensors. Generating simulated data allowed me to demonstrate that I know how to build the end-to-end ML pipeline, from database to model to API, without being blocked by data access."

### 7. How does React communicate with the backend?
"The frontend uses the native JavaScript `fetch` API to make HTTP requests to the Express server's REST endpoints, specifically sending a JSON payload to `POST /api/predictions`."

### 8. What is a REST API?
"It's a set of rules for how applications talk to each other over the web. It uses standard HTTP methods—like GET to fetch data (like my `/api/zones` endpoint) and POST to submit data (like my `/api/predictions` endpoint)—and communicates using JSON."

### 9. Why SQLite?
"It stores the entire database in a single file (`parkwise.db`). This makes the project highly portable—anyone reviewing my code can just clone the repo and run it without needing to install PostgreSQL or Docker."

### 10. What is Prisma?
"It's an ORM that sits between my Express server and the SQLite database. Instead of writing raw SQL strings, I write TypeScript code (like `prisma.parkingZone.findMany()`). It provides auto-completion and prevents SQL injection attacks."

### 11. How does the recommendation work?
"The ML model only predicts occupancy. The Node backend handles the business logic of ranking. It uses a weighted formula: 55% weight to Availability, 30% weight to Distance from the center, and 15% weight to Price. The lowest score wins."

### 12. How does the map work?
"I used Leaflet via the `react-leaflet` library. It loads map tiles from OpenStreetMap. I iterate over the API response and render a `CircleMarker` for each zone. The markers are color-coded (green/yellow/red) based on predicted availability and sized based on the lot's total capacity."

### 13. What happens when a user clicks Predict?
"React sets a `loading` state to true, showing a spinner. It calls `fetchPredictions`, which hits the Express backend. Express queries the DB, spawns the Python model, calculates the rankings, and returns the JSON. React then updates the state with the result, hides the spinner, and renders the map and cards."

### 14. What are the limitations?
"Because the data is simulated, the model's accuracy reflects the rules of my simulation, not real human behavior. Also, the `child_process.spawn` bridge to Python is great for a demo, but under heavy concurrent traffic, spawning a new Python process for every request would be slow and CPU-intensive."

### 15. What would you improve in production?
"In a real production environment, I would migrate the database to PostgreSQL. For the ML layer, instead of spawning a Python script from Node, I would host the model behind a dedicated Python microservice (like FastAPI) or use a managed service like AWS SageMaker. I would also add user authentication."

### 16. What was the hardest part?
"Bridging Node and Python asynchronously. I had to ensure the Node server correctly captured standard output from the Python process, parsed the JSON safely, and handled potential cold-start timeouts when the Joblib model loaded from disk."

### 17. Why did you not use deep learning?
"Deep learning is overkill for tabular data with a few simple features (time, weather, location). A Random Forest is faster to train, requires much less data, and is easier to explain. Over-engineering the ML would violate the goal of building a simple, robust product."

### 18. How would you use real parking data?
"If we had IoT sensors in parking lots, we could build a data pipeline that streams live occupancy updates into our database. We would then use that real-time data to retrain the model nightly, allowing it to adapt to changing city trends."

### 19. How would you handle real-time updates?
"If we needed the frontend map to update without the user refreshing, I would implement WebSockets (using a library like Socket.io). The backend would push an event to the frontend whenever a parking zone's status changed drastically."

### 20. How would you scale this system?
"I would separate the frontend, Node API, and ML model into independent microservices containerized with Docker. The Node API could be horizontally scaled behind a load balancer, and the ML service could run on GPU-optimized cloud instances. I'd also add a Redis cache so identical prediction requests don't hit the ML model repeatedly."
