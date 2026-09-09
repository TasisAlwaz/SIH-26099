from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_mappings():
    return {"module": "mappings", "status": "foundation_initialized", "items": []}
