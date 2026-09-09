from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.mapping_service import MappingService
from app.schemas.mapping import MaterialMappingResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[MaterialMappingResponse])
def list_mappings(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    cpse: Optional[str] = Query(None, description="Filter by CPSE code"),
    db: Session = Depends(get_db),
):
    """List paginated bidirectional material mappings connecting legacy items to National Material Codes."""
    service = MappingService(db)
    return service.get_mappings(page=page, page_size=page_size, cpse=cpse)


@router.get("/material/{id}", response_model=List[MaterialMappingResponse])
def get_mappings_by_material(
    id: str,
    db: Session = Depends(get_db),
):
    """Retrieve national mappings for a specific CPSE material."""
    service = MappingService(db)
    return service.get_mappings_for_material(id)


@router.get("/national/{code}", response_model=List[MaterialMappingResponse])
def get_mappings_by_national_code(
    code: str,
    db: Session = Depends(get_db),
):
    """Retrieve all CPSE legacy mappings connected to a given National Material Code."""
    service = MappingService(db)
    return service.get_mappings_for_national_code(code)
