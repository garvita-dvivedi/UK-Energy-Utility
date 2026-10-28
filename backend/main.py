import os
import logging
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.elexon_service import (
    fetch_actuals_from_elexon,
    fetch_forecasts_from_elexon,
    get_comparison_for_date,
    calculate_metrics,
    get_monthly_summary
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("wind-forecasting-api")

app = FastAPI(
    title="UK Wind Power Procurement & Forecast Accuracy API",
    description="Backend API for UK Energy Utility Day-Ahead Wind Forecasting & Error Evaluation (Elexon BMRS)",
    version="1.0.0"
)

# Allow CORS for React frontend (Vite port 5173, localhost:3000, or deployed origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing API and pre-warming cache...")
    try:
        # Pre-warm cache for January 2026 actuals and forecasts
        fetch_actuals_from_elexon("2026-01-01", "2026-01-31")
        fetch_forecasts_from_elexon()
        logger.info("Cache initialization complete.")
    except Exception as e:
        logger.warning(f"Background warm-up had non-fatal warning: {e}")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "UK Wind Procurement Analytics API",
        "scope": "January 2026 National Wind (Elexon FUELHH & WINDFOR)"
    }


@app.get("/api/comparison")
def get_comparison(
    date: str = Query("2026-01-15", regex=r"^\d{4}-\d{2}-\d{2}$", description="Delivery date in format YYYY-MM-DD"),
    decision_hour: int = Query(12, ge=0, le=23, description="Day-Ahead decision gate closure hour in UTC (D-1)")
):
    """
    Returns the 48 half-hour settlement periods for the selected delivery date,
    joining the Day-Ahead Wind Forecast (MW) against the Actual Generation (MW) with error delta.
    """
    try:
        data = get_comparison_for_date(date, decision_hour_utc=decision_hour)
        metrics = calculate_metrics(data)
        return {
            "date": date,
            "decisionHourUtc": decision_hour,
            "metrics": metrics,
            "periods": data
        }
    except Exception as e:
        logger.error(f"Error fetching comparison for date {date}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/summary")
def get_metrics_summary(
    decision_hour: int = Query(12, ge=0, le=23, description="Day-Ahead decision gate closure hour in UTC")
):
    """
    Returns overall forecast evaluation metrics across all 31 days of January 2026:
    MAE (MW), RMSE (MW), Mean Bias Error (MW), MAPE (%), and daily trend.
    """
    try:
        summary = get_monthly_summary(decision_hour_utc=decision_hour)
        return summary
    except Exception as e:
        logger.error(f"Error computing monthly summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/daily")
def get_metrics_daily(
    decision_hour: int = Query(12, ge=0, le=23, description="Day-Ahead decision gate closure hour in UTC")
):
    """
    Returns day-by-day error breakdown table for each day in January 2026.
    """
    try:
        summary = get_monthly_summary(decision_hour_utc=decision_hour)
        return {
            "month": summary["month"],
            "decisionHourUtc": decision_hour,
            "daily": summary["daily"]
        }
    except Exception as e:
        logger.error(f"Error fetching daily metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
