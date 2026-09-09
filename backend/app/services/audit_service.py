from typing import List
from sqlalchemy.orm import Session
from app.schemas.audit import AuditLogResponse, AuditLogBase


class AuditService:
    """Service providing immutable governance logging for officer decisions and system events."""

    def __init__(self, db: Session):
        self.db = db

    def record_event(self, event: AuditLogBase) -> None:
        # Will persist into audit_logs PostgreSQL table in Phase 4+
        pass

    def list_audit_trail(self, limit: int = 100) -> List[AuditLogResponse]:
        return []
