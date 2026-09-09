from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.national_material_service import NationalMaterialService
from app.schemas.national_material import NationalMaterialResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[NationalMaterialResponse])
def list_national_materials(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    query: Optional[str] = Query(None, description="Search term across NMC, standard description, specifications"),
    material_group: Optional[str] = Query(None, description="Filter by material group"),
    family: Optional[str] = Query(None, description="Filter by family"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated National Material Master (NMC) records with dynamic CPSE mapping counts."""
    service = NationalMaterialService(db)
    return service.get_national_materials(
        page=page,
        page_size=page_size,
        query=query,
        material_group=material_group,
        family=family,
    )


@router.get("/{id}", response_model=NationalMaterialResponse)
def get_national_material(
    id: str,
    db: Session = Depends(get_db),
):
    """Retrieve detailed National Material record including mapped CPSE legacy materials."""
    service = NationalMaterialService(db)
    nm = service.get_national_material_by_id(id)
    if not nm:
        raise HTTPException(
            status_code=404,
            detail=f"National Material with identifier '{id}' not found.",
        )
    return nm
