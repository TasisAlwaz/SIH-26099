from typing import Optional, List
from app.schemas.common import BaseSchema


class ProcurementRecordResponse(BaseSchema):
    category: str
    legacy_codes_count: int
    consolidated_nmc_count: int
    total_spend_inr: Optional[float] = None
    estimated_harmonization_benefit_inr: Optional[float] = None
    rationalization_ratio: float


class MetricSummaryResponse(BaseSchema):
    total_materials: int
    materials_analyzed: int
    duplicate_candidates: int
    approved_matches: int
    national_materials: int
    cpses_connected: int
    pending_reviews: int
    potentially_rationalizable_codes: int
    estimated_consolidation_savings_inr: Optional[float] = None


class RelationshipDistributionItem(BaseSchema):
    name: str
    value: int
    color: str
    description: str
