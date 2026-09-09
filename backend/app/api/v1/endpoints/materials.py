from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.material_service import MaterialService
from app.schemas.material import MaterialResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[MaterialResponse])
def list_materials(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    query: Optional[str] = Query(None, description="Search term across codes, specs, descriptions"),
    cpse: Optional[str] = Query(None, description="Filter by CPSE (IOCL, NTPC, SAIL, BHEL)"),
    category: Optional[str] = Query(None, description="Filter by category or material group"),
    family: Optional[str] = Query(None, description="Filter by component family"),
    uom: Optional[str] = Query(None, description="Filter by Unit of Measurement"),
    status: Optional[str] = Query(None, description="Filter by mapping status (STANDARDIZED, PENDING_REVIEW)"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated CPSE legacy materials with search and filtering."""
    service = MaterialService(db)
    return service.get_materials(
        page=page,
        page_size=page_size,
        query=query,
        cpse=cpse,
        category=category,
        family=family,
        uom=uom,
        status=status,
    )


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve detailed specification master for a single CPSE material by ID, legacy code, or record ID."""
    service = MaterialService(db)
    mat = service.get_material_by_id(material_id)
    if not mat:
        raise HTTPException(
            status_code=404,
            detail=f"Material with identifier '{material_id}' not found in master catalog.",
        )
    return mat
