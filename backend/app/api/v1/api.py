from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    cpses,
    materials,
    matches,
    national_materials,
    mappings,
    approvals,
    audit,
    analytics,
    uploads,
)

api_router = APIRouter()

# Register modular endpoints
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(cpses.router, prefix="/cpses", tags=["CPSEs"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials"])
api_router.include_router(matches.router, prefix="/matches", tags=["Matches"])
api_router.include_router(national_materials.router, prefix="/national-materials", tags=["National Materials"])
api_router.include_router(mappings.router, prefix="/mappings", tags=["Mappings"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approvals"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
