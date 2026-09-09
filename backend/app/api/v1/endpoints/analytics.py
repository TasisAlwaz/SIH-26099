from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    MetricSummaryResponse,
    RelationshipDistributionItem,
    ProcurementRecordResponse,
)

router = APIRouter()


@router.get("/metrics", response_model=MetricSummaryResponse)
@router.get("/dashboard", response_model=MetricSummaryResponse)
@router.get("/summary", response_model=MetricSummaryResponse)
def get_metrics_summary(
    db: Session = Depends(get_db),
):
    """Retrieve dynamic system-wide metric indicators derived directly from PostgreSQL."""
    service = AnalyticsService(db)
    return service.get_metric_summary()


@router.get("/relationship-distribution", response_model=List[RelationshipDistributionItem])
def get_relationship_distribution(
    db: Session = Depends(get_db),
):
    """Retrieve material classification distribution by duplicate/equivalence category."""
    service = AnalyticsService(db)
    return service.get_relationship_distribution()


@router.get("/procurement-records", response_model=List[ProcurementRecordResponse])
def get_procurement_records(
    db: Session = Depends(get_db),
):
    """Retrieve category-level spend, code reduction, and rationalization benefit aggregates."""
    service = AnalyticsService(db)
    return service.get_procurement_records()
