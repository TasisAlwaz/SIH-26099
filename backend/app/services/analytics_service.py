from typing import List
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from app.models.material import Material
from app.models.national_material import NationalMaterial
from app.models.cpse import CPSE
from app.models.mapping import MaterialMapping
from app.models.approval import Approval
from app.models.match import Match
from app.schemas.analytics import (
    MetricSummaryResponse,
    RelationshipDistributionItem,
    ProcurementRecordResponse,
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_metric_summary(self) -> MetricSummaryResponse:
        total_mats = self.db.query(func.count(Material.id)).scalar() or 0
        nat_mats = self.db.query(func.count(NationalMaterial.id)).scalar() or 0
        cpses_count = self.db.query(func.count(CPSE.id)).scalar() or 0
        dup_count = (
            self.db.query(func.count(Material.id))
            .filter(Material.is_duplicate_equivalent == True)
            .scalar()
            or 0
        )
        approved_count = (
            self.db.query(func.count(Approval.id))
            .filter(func.upper(Approval.decision) == "APPROVED")
            .scalar()
            or 0
        )
        pending_count = (
            self.db.query(func.count(Approval.id))
            .filter(func.upper(Approval.decision) == "PENDING")
            .scalar()
            or 0
        )

        rationalizable = max(0, total_mats - nat_mats)
        # Estimated realistic savings: rationalizable items * average inventory holding savings (~15,000 INR per duplicated SKU)
        est_savings = float(rationalizable * 15000)

        return MetricSummaryResponse(
            total_materials=total_mats,
            materials_analyzed=total_mats,
            duplicate_candidates=dup_count,
            approved_matches=approved_count,
            national_materials=nat_mats,
            cpses_connected=cpses_count,
            pending_reviews=pending_count,
            potentially_rationalizable_codes=rationalizable,
            estimated_consolidation_savings_inr=est_savings,
        )

    def get_relationship_distribution(self) -> List[RelationshipDistributionItem]:
        # Query count grouped by source_match_type from materials table
        results = (
            self.db.query(
                Material.source_match_type,
                func.count(Material.id).label("count"),
            )
            .group_by(Material.source_match_type)
            .all()
        )

        color_map = {
            "near_duplicate": "#f59e0b",
            "variant": "#3b82f6",
            "exact": "#10b981",
            "unique": "#8b5cf6",
        }
        desc_map = {
            "near_duplicate": "Catalog phrasing differences across enterprise legacy systems",
            "variant": "Minor dimension or specification variance requiring officer sign-off",
            "exact": "100% attribute parity verified across technical parameters",
            "unique": "Unique sovereign spares without duplicate candidates across CPSEs",
        }

        items: List[RelationshipDistributionItem] = []
        for match_type, count in results:
            clean_type = (match_type or "unique").lower()
            name_formatted = clean_type.replace("_", " ").title()
            items.append(
                RelationshipDistributionItem(
                    name=name_formatted,
                    value=count,
                    color=color_map.get(clean_type, "#64748b"),
                    description=desc_map.get(clean_type, "Standardized material cluster"),
                )
            )

        return items

    def get_procurement_records(self) -> List[ProcurementRecordResponse]:
        # Aggregate by material_group
        results = (
            self.db.query(
                Material.material_group,
                func.count(Material.id).label("legacy_count"),
                func.count(distinct(MaterialMapping.national_material_id)).label("nmc_count"),
            )
            .outerjoin(MaterialMapping, Material.id == MaterialMapping.material_id)
            .group_by(Material.material_group)
            .all()
        )

        records: List[ProcurementRecordResponse] = []
        for group, legacy_count, nmc_count in results:
            cat_name = group or "Other Spares"
            nmc_cnt = nmc_count or 1
            ratio = round(1.0 - (nmc_cnt / legacy_count), 2) if legacy_count > 0 else 0.0
            spend = float(legacy_count * 225000)
            benefit = float(spend * 0.12)  # ~12% bulk procurement dividend

            records.append(
                ProcurementRecordResponse(
                    category=cat_name,
                    legacy_codes_count=legacy_count,
                    consolidated_nmc_count=nmc_cnt,
                    total_spend_inr=spend,
                    estimated_harmonization_benefit_inr=benefit,
                    rationalization_ratio=ratio,
                )
            )

        return records
