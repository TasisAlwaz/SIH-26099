from typing import Optional
from app.schemas.common import BaseSchema, MatchRelationship, ApprovalStatus


class ApprovalActionRequest(BaseSchema):
    status: ApprovalStatus
    reviewer: str
    reviewer_role: Optional[str] = None
    review_notes: Optional[str] = None


class ApprovalResponse(BaseSchema):
    id: str
    match_id: str
    cpse_a: str
    legacy_code_a: str
    description_a: str
    cpse_b: str
    legacy_code_b: str
    description_b: str
    relationship: MatchRelationship
    confidence: float
    status: ApprovalStatus
    recommended_nmc: str
    created_at: Optional[str] = None
    reviewer: Optional[str] = None
    action_taken_at: Optional[str] = None
    rejection_reason: Optional[str] = None
