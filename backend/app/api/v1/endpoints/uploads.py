from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def upload_status():
    return {"module": "uploads", "status": "foundation_initialized"}
