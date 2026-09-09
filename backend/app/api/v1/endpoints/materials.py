from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_materials():
    return {"module": "materials", "status": "foundation_initialized", "items": []}
