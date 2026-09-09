from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
def get_health(db: Session = Depends(get_db)):
    """
    Diagnostic health check endpoint verifying:
    1. FastAPI process liveness
    2. Real-time PostgreSQL connectivity via active ping
    3. AI engine mode reporting (MOCK invariant)
    """
    # Verify real database connectivity
    db_status = "disconnected"
    db_version = None
    try:
        result = db.execute(text("SELECT version();")).scalar()
        if result:
            db_status = "connected"
            db_version = result.split()[0] + " " + result.split()[1]
    except Exception as exc:
        db_status = f"error: {str(exc)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "api": "online",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "database": {
            "status": db_status,
            "engine": "PostgreSQL",
            "version": db_version,
        },
        "ai_engine": {
            "mode": settings.AI_MODE,
            "real_ml_active": False,
            "notice": "Mock AI Engine active in Phase 3 Foundation",
        },
    }
