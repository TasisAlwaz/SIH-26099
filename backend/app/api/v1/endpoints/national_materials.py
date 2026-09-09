from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_national_materials():
    return {"module": "national_materials", "status": "foundation_initialized", "items": []}
