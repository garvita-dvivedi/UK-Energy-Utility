# UK Wind Power Procurement & Forecast Accuracy Evaluation Platform

A full-stack web application designed for a UK energy utility procurement desk. The tool empowers trading and procurement teams participating in the UK Day-Ahead electricity wholesale market to visualize the latest renewable wind power forecasts and quantitatively evaluate forecast error against actual generation for January 2026.

Data source: **Elexon BMRS** (Balancing Mechanism Reporting Service) APIs:
- **Actual Generation**: `FUELHH` endpoint (filtered for `fuelType = WIND`)
- **Forecast Generation**: `WINDFOR` endpoint (Day-Ahead renewable forecasts)

---

## 📌 Problem Setting & Domain Context

1. **The Business Need**: 
   A UK energy utility must procure wholesale electricity one day ahead (Day D-1) to reliably supply customer demand on the delivery day (Day D).
2. **The Renewable Uncertainty**:
   Because wind generation is weather-dependent, procurement teams rely on Day-Ahead forecasts published prior to market gate closure (e.g., 12:00 UTC D-1). Any difference between forecasted wind and actual wind must be covered through expensive thermal plants (gas/coal) or balancing reserves.
3. **The Solution**:
   This portal:
   - Identifies the latest wind forecast available at decision time for each 30-minute settlement period (48 periods per day).
   - Overlays Day-Ahead Forecasts directly against Actual Generation.
   - Computes quantitative accuracy metrics (**MAE**, **RMSE**, **Forecast Bias**, **MAPE**) across January 2026 to help procurement teams price in risk and make informed purchase decisions.

---

## 🏗️ Architecture & Project Structure

```
.
├── backend/
│   ├── data/                 # Local cache directory for Elexon JSON data
│   ├── services/
│   │   ├── __init__.py
│   │   └── elexon_service.py # Elexon API connector, caching, data joining & metric calculations
│   ├── Dockerfile            # Container definition for Python FastAPI backend
│   ├── main.py               # FastAPI REST endpoints & CORS configuration
│   └── requirements.txt      # Python dependencies (FastAPI, uvicorn, requests, pydantic)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component (charts, KPI cards, table)
│   │   ├── App.css           # UI layout and component styling
│   │   ├── index.css         # Theme tokens and global base styles
│   │   └── main.jsx          # Vite React entry point
│   ├── Dockerfile            # Multi-stage container build with Nginx
│   ├── nginx.conf            # Reverse proxy and static file server config
│   ├── package.json          # React, Recharts, Lucide icons dependencies
│   └── vite.config.js        # Vite bundler configuration
├── docker-compose.yml        # Orchestration to run full stack with a single command
└── README.md                 # Documentation and video presentation script
```

---

## 🚀 Getting Started

### Option 1: Running with Docker (Recommended)

Make sure Docker and Docker Compose are installed and running:

```bash
docker compose up --build
```

- **Frontend Portal**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs`

---

### Option 2: Running Locally (Development Mode)

#### 1. Backend Setup (Python)

```bash
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`. You can test the interactive OpenAPI documentation at `http://localhost:8000/docs`.

#### 2. Frontend Setup (React)

In a new terminal window:

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📊 Key Features & Analytical Methodology

1. **Granular Settlement Periods (30-Minute Resolution)**:
   - UK power settlement runs across 48 discrete half-hour periods each day.
   - For every period, the platform extracts both actual generation (`FUELHH`) and the relevant day-ahead forecast (`WINDFOR`).
2. **Configurable Decision Gate Cutoff**:
   - Procurement teams can toggle the decision cutoff hour (e.g., 09:00, 11:00, 12:00, 15:00 UTC D-1).
   - The platform dynamically picks the newest forecast published *prior* to that gate closure, simulating real-world trader conditions.
3. **Statistical Accuracy Metrics**:
   - **MAE (Mean Absolute Error)**: $\frac{1}{N}\sum |Forecast_i - Actual_i|$ — expected magnitude of deviation in MW.
   - **RMSE (Root Mean Square Error)**: $\sqrt{\frac{1}{N}\sum (Forecast_i - Actual_i)^2}$ — heavily penalizes large swings.
   - **Mean Bias Error**: $\frac{1}{N}\sum (Forecast_i - Actual_i)$ — indicates systematic over-forecasting (positive) or under-forecasting (negative).
   - **MAPE**: Mean Absolute Percentage Error.
4. **Interactive Visualization**:
   - Dual-line graph comparing actual vs forecasted trajectory.
   - Variance delta bar chart highlighting surplus contracted vs deficit periods.
   - Sortable 31-day table enabling quick drill-down into extreme outlier days in January 2026.

---

## 🌐 Deployment Guide (Vercel & Heroku)

### Frontend on Vercel
1. Push your repository to GitHub.
2. In Vercel, click **New Project** and import the repository.
3. Set **Root Directory** to `frontend`.
4. Set Environment Variable: `VITE_API_URL` to your deployed backend URL (e.g., `https://your-backend.herokuapp.com`).
5. Click **Deploy**.

### Backend on Heroku
1. Install Heroku CLI and login: `heroku login`
2. Create a new app: `heroku create your-backend-app`
3. Deploy the backend subdirectory:
   ```bash
   git subtree push --prefix backend heroku main
   ```
4. Configure Python buildpack if needed:
   `heroku buildpacks:set heroku/python`

---

## 🤖 Disclosure of AI Tools Used

In accordance with the assignment guidelines:
- **AI Tool**: Antigravity Assistant (Google DeepMind)
- **Assistance Provided**: Accelerated API data exploration on Elexon BMRS datasets, scaffolding initial boilerplate for FastAPI routes, and styling components with responsive CSS. All business logic, settlement calculations, day-ahead cutoff time filtering, and accuracy metric formulas were verified and implemented specifically to adhere to UK electricity market mechanisms.

---

## 🎥 Video Presentation Guide (10-Minute Limit)

### Part 1: Client Pitch (Max 5 Minutes)
- **Target Audience**: Energy Utility Power Procurement Team / Trading Head.
- **Hook (0:00 - 1:00)**: Introduce the challenge of buying day-ahead power under variable wind conditions. Explain how uncertainty leads to unexpected thermal ramp-up costs or imbalance penalties.
- **Demo Walkthrough (1:00 - 3:30)**:
  - Demonstrate the **Day View**: Pick a date in January 2026 (e.g., Jan 15 or Jan 5) and show the 48 settlement periods.
  - Explain the **Forecast (dashed purple)** vs **Actual (emerald green)** lines.
  - Highlight the **Variance Delta chart** and explain what an over-forecast vs under-forecast means for physical power delivery.
  - Show the **Decision Gate Cutoff** selector and explain how picking 12:00 UTC reflects EPEX SPOT auction gate closure.
- **Business Value (3:30 - 4:45)**:
  - Switch to the **Month Overview (January 2026)** table.
  - Point to the quantified MAE and RMSE figures and show how the team can use this historical error band to size buffer margins and reserve thermal contracts.

### Part 2: Technical Review (Max 5 Minutes)
- **Target Audience**: Internal Technical Lead / Engineering Reviewer.
- **Architecture Overview (5:00 - 6:00)**: Decoupled client-server architecture: FastAPI backend for data processing + React frontend for visualization.
- **Data Engineering & Elexon Ingestion (6:00 - 7:30)**:
  - Explain how `services/elexon_service.py` pulls from Elexon BMRS `FUELHH` and `WINDFOR`.
  - Explain the Day-Ahead cutoff filter logic: for each settlement slot of Day D, query forecasts where `publishTime <= D-1 at 12:00 UTC` and select the newest one.
  - Explain caching mechanism (`fuelhh_jan2026.json` and `windfor_jan2026.json`) to avoid rate-limiting and ensure sub-second response times.
- **Frontend & Code Quality (7:30 - 8:45)**:
  - Discuss component breakdown, state management, and Recharts performance.
  - Highlight Dockerization: `Dockerfile` for backend and multi-stage Nginx build for frontend in `docker-compose.yml`.
- **Future Enhancements (8:45 - 9:45)**:
  - Automated intraday forecast rolling updates (within-day market trading).
  - Machine learning residual bias correction model.
  - Integration with weather reanalysis models (ECMWF / Met Office).
