from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_matches():
    return {"module": "matches", "status": "foundation_initialized", "items": []}
