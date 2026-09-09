from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.audit_service import AuditService
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    query: Optional[str] = Query(None, description="Search by user, action, entity, or description"),
    db: Session = Depends(get_db),
):
    """Retrieve chronological audit trail of sovereign review decisions, ingestions, and state transitions."""
    service = AuditService(db)
    return service.get_audit_logs(page=page, page_size=page_size, query=query)


@router.get("/all", response_model=List[AuditLogResponse])
def list_all_audit_logs(
    db: Session = Depends(get_db),
):
    """Retrieve all chronological audit events without pagination for export or review views."""
    service = AuditService(db)
    return service.list_all_logs()
