import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from app.models.approval import Approval
from app.models.match import Match
from app.models.material import Material
from app.models.cpse import CPSE
from app.models.audit import AuditLog
from app.schemas.approval import ApprovalResponse, ApprovalActionRequest
from app.schemas.common import ApprovalStatus, MatchRelationship


def format_approval(a: Approval) -> ApprovalResponse:
    cpse_a = "CPSE"
    legacy_code_a = "N/A"
    desc_a = "N/A"
    cpse_b = "CPSE"
    legacy_code_b = "N/A"
    desc_b = "N/A"
    rel_str = MatchRelationship.DUPLICATE
    confidence = 90.0
    rec_nmc = "NMC-CANONICAL"

    if a.match_rel:
        m = a.match_rel
        confidence = float(m.confidence)
        rec_nmc = m.recommended_nmc or "N/A"
        if m.relationship in MatchRelationship.__members__:
            rel_str = MatchRelationship[m.relationship]

        if m.material_a_rel:
            legacy_code_a = m.material_a_rel.legacy_code
            desc_a = m.material_a_rel.description
            if m.material_a_rel.cpse_rel:
                cpse_a = m.material_a_rel.cpse_rel.code

        if m.material_b_rel:
            legacy_code_b = m.material_b_rel.legacy_code
            desc_b = m.material_b_rel.description
            if m.material_b_rel.cpse_rel:
                cpse_b = m.material_b_rel.cpse_rel.code

    created_str = (
        a.created_at.strftime("%Y-%m-%d %H:%M IST")
        if a.created_at
        else None
    )
    action_str = (
        a.action_taken_at.strftime("%Y-%m-%d %H:%M IST")
        if a.action_taken_at
        else None
    )

    st = ApprovalStatus.PENDING
    if a.decision in ApprovalStatus.__members__:
        st = ApprovalStatus[a.decision]

    return ApprovalResponse(
        id=a.id,
        match_id=a.match_id or "",
        cpse_a=cpse_a,
        legacy_code_a=legacy_code_a,
        description_a=desc_a,
        cpse_b=cpse_b,
        legacy_code_b=legacy_code_b,
        description_b=desc_b,
        relationship=rel_str,
        confidence=confidence,
        status=st,
        recommended_nmc=rec_nmc,
        created_at=created_str,
        reviewer=a.reviewer_name,
        action_taken_at=action_str,
        rejection_reason=a.comments if st == ApprovalStatus.REJECTED else None,
    )


class ApprovalService:
    """Service managing Human-in-the-Loop review queues and officer decision sign-offs."""

    def __init__(self, db: Session):
        self.db = db

    def list_approvals(self, status: Optional[str] = None) -> List[ApprovalResponse]:
        q = (
            self.db.query(Approval)
            .options(
                joinedload(Approval.match_rel).joinedload(Match.material_a_rel).joinedload(Material.cpse_rel),
                joinedload(Approval.match_rel).joinedload(Match.material_b_rel).joinedload(Material.cpse_rel),
            )
        )

        if status and status.upper() != "ALL":
            q = q.filter(func.upper(Approval.decision) == status.upper())

        approvals = q.order_by(Approval.created_at.desc()).all()
        return [format_approval(a) for a in approvals]

    def process_decision(
        self, approval_id: str, request: ApprovalActionRequest
    ) -> Optional[ApprovalResponse]:
        approval = (
            self.db.query(Approval)
            .options(
                joinedload(Approval.match_rel).joinedload(Match.material_a_rel).joinedload(Material.cpse_rel),
                joinedload(Approval.match_rel).joinedload(Match.material_b_rel).joinedload(Material.cpse_rel),
            )
            .filter(or_(Approval.id == approval_id, Approval.match_id == approval_id))
            .first()
        )

        if not approval:
            return None

        old_state = {
            "decision": approval.decision,
            "reviewer_name": approval.reviewer_name,
            "comments": approval.comments,
        }

        new_decision = request.status.value
        now = datetime.now(timezone.utc)

        # Demo/foundation behavior: use requested role if supplied, else retain existing role or default
        reviewer_role = request.reviewer_role or approval.reviewer_role or "PROCUREMENT_OFFICER"

        # Update Approval record
        approval.decision = new_decision
        approval.reviewer_name = request.reviewer or "Procurement Officer"
        approval.reviewer_role = reviewer_role
        approval.comments = request.review_notes or f"Officer decision: {new_decision}"
        approval.action_taken_at = now

        # Synchronize linked Match status if exists
        if approval.match_rel:
            approval.match_rel.status = new_decision

        new_state = {
            "decision": new_decision,
            "reviewer_name": approval.reviewer_name,
            "reviewer_role": approval.reviewer_role,
            "comments": approval.comments,
            "action_taken_at": now.isoformat(),
        }

        # Map decision to distinct audit trail action
        if new_decision == "APPROVED":
            audit_action = "APPROVE_MAPPING"
        elif new_decision == "REJECTED":
            audit_action = "REJECT_MAPPING"
        elif new_decision == "MODIFIED":
            audit_action = "MODIFY_MAPPING"
        else:
            audit_action = f"{new_decision}_MAPPING"

        # Record standard audit trail entry in audit_logs
        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            actor_name=approval.reviewer_name,
            actor_role=approval.reviewer_role,
            action=audit_action,
            entity_type="APPROVAL",
            entity_id=approval.id,
            previous_state=old_state,
            new_state=new_state,
            source="APPROVAL_QUEUE_CONSOLE",
            timestamp=now,
        )
        self.db.add(audit_entry)
        self.db.commit()
        self.db.refresh(approval)

        return format_approval(approval)
