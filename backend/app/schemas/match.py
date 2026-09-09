from typing import List, Optional
from pydantic import Field
from app.schemas.common import BaseSchema, MatchRelationship, ApprovalStatus
from app.schemas.material import MaterialResponse


class MatchSignalBreakdown(BaseSchema):
    description_similarity: float
    specification_similarity: float
    attribute_similarity: float
    uom_compatibility: float
    manufacturer_match: float
    family_compatibility: Optional[float] = None
    size_rating_compatibility: Optional[float] = None
    material_grade_compatibility: Optional[float] = None


class MatchAnalysisRequest(BaseSchema):
    material_a_id: str
    material_b_id: str


class MaterialMatchResponse(BaseSchema):
    id: str
    material_a: MaterialResponse
    material_b: MaterialResponse
    confidence: float
    relationship: MatchRelationship
    status: ApprovalStatus
    breakdown: MatchSignalBreakdown
    rationale: List[str]
    detected_differences: List[str]
    recommended_nmc: str
    created_at: Optional[str] = None
    engine: str = "MOCK_HEURISTIC"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    review_notes: Optional[str] = None
