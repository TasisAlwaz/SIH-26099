from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.matching_service import MatchingService
from app.schemas.match import MaterialMatchResponse, MatchAnalysisRequest
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[MaterialMatchResponse])
def list_matches(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, APPROVED, REJECTED)"),
    relationship: Optional[str] = Query(None, description="Filter by relationship (DUPLICATE, NEAR_DUPLICATE, etc.)"),
    db: Session = Depends(get_db),
):
    """Retrieve staged match candidate pairs with similarity breakdown and explainability rationale."""
    service = MatchingService(db)
    return service.get_matches(
        page=page, page_size=page_size, status=status, relationship=relationship
    )


@router.get("/{id}", response_model=MaterialMatchResponse)
def get_match(
    id: str,
    db: Session = Depends(get_db),
):
    """Retrieve details and explainability breakdown for a specific candidate match pair."""
    service = MatchingService(db)
    m = service.get_match_by_id(id)
    if not m:
        raise HTTPException(
            status_code=404,
            detail=f"Match record with identifier '{id}' not found.",
        )
    return m


@router.post("/analyze", response_model=MaterialMatchResponse)
async def analyze_pair(
    request: MatchAnalysisRequest,
    db: Session = Depends(get_db),
):
    """
    Evaluate two CPSE materials via the rule-based deterministic matching engine
    and persist the candidate match and approval queue item.
    """
    if request.material_a_id == request.material_b_id:
        raise HTTPException(
            status_code=400,
            detail="A material cannot be compared with itself. Please select two distinct materials.",
        )
    service = MatchingService(db)
    try:
        result = await service.analyze_pair(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(
            status_code=404,
            detail="One or both material items could not be found for comparison.",
        )
    return result
