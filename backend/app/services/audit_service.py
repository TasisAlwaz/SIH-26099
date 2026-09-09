import math
from typing import List, Optional
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PaginatedResponse


def format_audit_log(a: AuditLog) -> AuditLogResponse:
    ts_str = (
        a.timestamp.strftime("%Y-%m-%d %H:%M:%S IST")
        if a.timestamp
        else "2026-09-09 20:30 IST"
    )

    old_val = (
        f"State: {a.previous_state.get('decision', 'PENDING')}"
        if isinstance(a.previous_state, dict) and "decision" in a.previous_state
        else (str(a.previous_state) if a.previous_state else "Initial State")
    )

    new_val = (
        f"Decision: {a.new_state.get('decision', 'N/A')}"
        if isinstance(a.new_state, dict) and "decision" in a.new_state
        else (str(a.new_state) if a.new_state else "Updated")
    )

    decision_tag = "TRIGGERED"
    if "APPROVE" in a.action.upper():
        decision_tag = "APPROVED"
    elif "REJECT" in a.action.upper():
        decision_tag = "REJECTED"
    elif "MODIFY" in a.action.upper():
        decision_tag = "MODIFIED"

    return AuditLogResponse(
        id=a.id,
        timestamp=ts_str,
        user=a.actor_name,
        role=a.actor_role,
        action=a.action,
        entity=f"{a.entity_type}:{a.entity_id[:8]}",
        old_value=old_val,
        new_value=new_val,
        decision=decision_tag,
        source=a.source or "System",
    )


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def get_audit_logs(
        self, page: int = 1, page_size: int = 50, query: Optional[str] = None
    ) -> PaginatedResponse[AuditLogResponse]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 50
        if page_size > 200:
            page_size = 200

        q = self.db.query(AuditLog)

        if query and query.strip():
            term = f"%{query.strip().lower()}%"
            q = q.filter(
                or_(
                    func.lower(AuditLog.actor_name).like(term),
                    func.lower(AuditLog.action).like(term),
                    func.lower(AuditLog.entity_type).like(term),
                    func.lower(AuditLog.entity_id).like(term),
                    func.lower(AuditLog.source).like(term),
                )
            )

        total = q.count()
        offset = (page - 1) * page_size
        items = q.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return PaginatedResponse[AuditLogResponse](
            items=[format_audit_log(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def list_all_logs(self) -> List[AuditLogResponse]:
        items = self.db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
        return [format_audit_log(a) for a in items]
