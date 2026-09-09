from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_approvals():
    return {"module": "approvals", "status": "foundation_initialized", "items": []}
