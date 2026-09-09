from typing import List, Optional
from sqlalchemy.orm import Session
from app.schemas.approval import ApprovalResponse, ApprovalActionRequest


class ApprovalService:
    """Service managing Human-in-the-Loop review queues and officer decision sign-offs."""

    def __init__(self, db: Session):
        self.db = db

    def list_pending_approvals(self) -> List[ApprovalResponse]:
        return []

    def process_decision(self, approval_id: str, request: ApprovalActionRequest) -> Optional[ApprovalResponse]:
        return None
