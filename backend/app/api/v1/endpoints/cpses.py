from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.cpse_service import CPSEService
from app.schemas.cpse import CPSEResponse
from app.schemas.material import MaterialResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=List[CPSEResponse])
def list_cpses(
    db: Session = Depends(get_db),
):
    """List all participating CPSEs with dynamically calculated catalog and mapping statistics."""
    service = CPSEService(db)
    return service.get_cpses()


@router.get("/{id}", response_model=CPSEResponse)
def get_cpse(
    id: str,
    db: Session = Depends(get_db),
):
    """Get single CPSE details by ID or enterprise acronym (e.g. IOCL, NTPC)."""
    service = CPSEService(db)
    cpse = service.get_cpse_by_id_or_code(id)
    if not cpse:
        raise HTTPException(
            status_code=404,
            detail=f"CPSE with identifier '{id}' not found.",
        )
    return cpse


@router.get("/{id}/materials", response_model=PaginatedResponse[MaterialResponse])
def get_cpse_materials(
    id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get paginated legacy materials for a specific CPSE."""
    service = CPSEService(db)
    return service.get_cpse_materials(id, page=page, page_size=page_size)
