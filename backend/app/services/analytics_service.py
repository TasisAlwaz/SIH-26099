from typing import List
from sqlalchemy.orm import Session
from app.schemas.analytics import MetricSummaryResponse, ProcurementRecordResponse


class AnalyticsService:
    """Service calculating cross-CPSE procurement spend, volume aggregation, and rationalization ratios."""

    def __init__(self, db: Session):
        self.db = db

    def get_summary_metrics(self) -> MetricSummaryResponse:
        return MetricSummaryResponse(
            total_materials=0,
            materials_analyzed=0,
            duplicate_candidates=0,
            approved_matches=0,
            national_materials=0,
            cpses_connected=0,
            pending_reviews=0,
            potentially_rationalizable_codes=0,
            estimated_consolidation_savings_inr=0.0,
        )

    def get_procurement_breakdown(self) -> List[ProcurementRecordResponse]:
        return []
