from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.approval_service import ApprovalService
from app.schemas.approval import ApprovalResponse, ApprovalActionRequest

router = APIRouter()


@router.get("", response_model=List[ApprovalResponse])
def list_approvals(
    status: Optional[str] = Query(None, description="Filter by decision (PENDING, APPROVED, REJECTED, ALL)"),
    db: Session = Depends(get_db),
):
    """Retrieve Human-in-the-Loop review queue items awaiting officer sign-off or historical records."""
    service = ApprovalService(db)
    return service.list_approvals(status=status)


@router.post("/{id}/action", response_model=ApprovalResponse)
@router.put("/{id}", response_model=ApprovalResponse)
def process_approval_decision(
    id: str,
    request: ApprovalActionRequest,
    db: Session = Depends(get_db),
):
    """
    Record an authorized officer's decision (APPROVED, REJECTED, MODIFIED) on a match recommendation.
    Updates match status and records an audit trail entry in PostgreSQL.
    """
    service = ApprovalService(db)
    updated = service.process_decision(id, request)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Approval record or linked match '{id}' not found.",
        )
    return updated
