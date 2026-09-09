from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def get_analytics_summary():
    return {"module": "analytics", "status": "foundation_initialized"}
