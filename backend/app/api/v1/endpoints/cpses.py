from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_cpses():
    return {"module": "cpses", "status": "foundation_initialized", "items": []}
