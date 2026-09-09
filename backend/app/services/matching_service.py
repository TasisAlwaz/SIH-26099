import uuid
import math
from typing import List, Optional
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session, joinedload

from datetime import datetime, timezone
from app.models.match import Match
from app.models.material import Material
from app.models.approval import Approval
from app.models.audit import AuditLog
from app.schemas.match import (
    MaterialMatchResponse,
    MatchSignalBreakdown,
    MatchAnalysisRequest,
)
from app.schemas.common import MatchRelationship, ApprovalStatus, PaginatedResponse
from app.services.material_service import format_material
from app.services.matching_engine import get_matching_engine, BaseMatchingEngine


def format_match(m: Match) -> MaterialMatchResponse:
    bd = m.breakdown or {}
    breakdown_obj = MatchSignalBreakdown(
        description_similarity=float(bd.get("description_similarity", 85.0)),
        specification_similarity=float(bd.get("specification_similarity", 90.0)),
        attribute_similarity=float(bd.get("attribute_similarity", 88.0)),
        uom_compatibility=float(bd.get("uom_compatibility", 100.0)),
        manufacturer_match=float(bd.get("manufacturer_match", 80.0)),
        family_compatibility=float(bd["family_compatibility"]) if "family_compatibility" in bd and bd["family_compatibility"] is not None else None,
        size_rating_compatibility=float(bd["size_rating_compatibility"]) if "size_rating_compatibility" in bd and bd["size_rating_compatibility"] is not None else None,
        material_grade_compatibility=float(bd["material_grade_compatibility"]) if "material_grade_compatibility" in bd and bd["material_grade_compatibility"] is not None else None,
    )

    created_str = (
        m.created_at.strftime("%Y-%m-%d %H:%M IST")
        if m.created_at
        else None
    )

    reviewer = None
    reviewed_at = None
    review_notes = None

    if m.approvals and len(m.approvals) > 0:
        latest_approval = m.approvals[-1]
        reviewer = latest_approval.reviewer_name
        if latest_approval.action_taken_at:
            reviewed_at = latest_approval.action_taken_at.strftime("%Y-%m-%d %H:%M IST")
        review_notes = latest_approval.comments

    # Relationship enum safety
    rel = MatchRelationship.DUPLICATE
    if m.relationship in MatchRelationship.__members__:
        rel = MatchRelationship[m.relationship]

    status = ApprovalStatus.PENDING
    if m.status in ApprovalStatus.__members__:
        status = ApprovalStatus[m.status]

    return MaterialMatchResponse(
        id=m.id,
        material_a=format_material(m.material_a_rel),
        material_b=format_material(m.material_b_rel),
        confidence=float(m.confidence),
        relationship=rel,
        status=status,
        breakdown=breakdown_obj,
        rationale=m.rationale or ["Verified by N-MAT rule heuristic matching pipeline"],
        detected_differences=m.differences or [],
        recommended_nmc=m.recommended_nmc or "N/A",
        created_at=created_str,
        engine=m.engine or "MOCK_HEURISTIC",
        reviewed_by=reviewer,
        reviewed_at=reviewed_at,
        review_notes=review_notes,
    )


class MatchingService:
    def __init__(self, db: Session):
        self.db = db
        self.engine: BaseMatchingEngine = get_matching_engine()

    def get_matches(
        self,
        page: int = 1,
        page_size: int = 25,
        status: Optional[str] = None,
        relationship: Optional[str] = None,
    ) -> PaginatedResponse[MaterialMatchResponse]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 25
        if page_size > 100:
            page_size = 100

        q = (
            self.db.query(Match)
            .options(
                joinedload(Match.material_a_rel).joinedload(Material.cpse_rel),
                joinedload(Match.material_b_rel).joinedload(Material.cpse_rel),
                joinedload(Match.approvals),
            )
        )

        if status and status.upper() != "ALL":
            q = q.filter(func.upper(Match.status) == status.upper())

        if relationship and relationship.upper() != "ALL":
            q = q.filter(func.upper(Match.relationship) == relationship.upper())

        total = q.count()
        offset = (page - 1) * page_size
        items = q.order_by(Match.confidence.desc()).offset(offset).limit(page_size).all()
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return PaginatedResponse[MaterialMatchResponse](
            items=[format_match(m) for m in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_match_by_id(self, match_id: str) -> Optional[MaterialMatchResponse]:
        m = (
            self.db.query(Match)
            .options(
                joinedload(Match.material_a_rel).joinedload(Material.cpse_rel),
                joinedload(Match.material_b_rel).joinedload(Material.cpse_rel),
                joinedload(Match.approvals),
            )
            .filter(Match.id == match_id)
            .first()
        )
        if not m:
            return None
        return format_match(m)

    async def analyze_pair(self, request: MatchAnalysisRequest) -> Optional[MaterialMatchResponse]:
        if request.material_a_id == request.material_b_id:
            raise ValueError("A material cannot be compared with itself. Please select two distinct materials.")

        # Check if match already exists
        existing = (
            self.db.query(Match)
            .options(
                joinedload(Match.material_a_rel).joinedload(Material.cpse_rel),
                joinedload(Match.material_b_rel).joinedload(Material.cpse_rel),
                joinedload(Match.approvals),
            )
            .filter(
                or_(
                    and_(Match.material_a_id == request.material_a_id, Match.material_b_id == request.material_b_id),
                    and_(Match.material_a_id == request.material_b_id, Match.material_b_id == request.material_a_id),
                )
            )
            .first()
        )
        if existing:
            return format_match(existing)

        # Retrieve materials from db
        mat_a = (
            self.db.query(Material)
            .options(joinedload(Material.cpse_rel))
            .filter(Material.id == request.material_a_id)
            .first()
        )
        mat_b = (
            self.db.query(Material)
            .options(joinedload(Material.cpse_rel))
            .filter(Material.id == request.material_b_id)
            .first()
        )

        if not mat_a or not mat_b:
            return None

        mat_a_resp = format_material(mat_a)
        mat_b_resp = format_material(mat_b)

        # Run deterministic engine
        sim_res = await self.engine.analyze_pair(mat_a_resp, mat_b_resp)

        # Persist to database
        match_id = str(uuid.uuid4())
        new_match = Match(
            id=match_id,
            material_a_id=mat_a.id,
            material_b_id=mat_b.id,
            relationship=sim_res.relationship.value,
            confidence=sim_res.confidence,
            status="PENDING",
            breakdown=sim_res.breakdown.model_dump(),
            rationale=sim_res.rationale,
            differences=sim_res.detected_differences,
            recommended_nmc=sim_res.recommended_nmc,
            engine="MOCK_HEURISTIC",
        )
        self.db.add(new_match)

        # Also stage an Approval record
        new_approval = Approval(
            id=str(uuid.uuid4()),
            match_id=match_id,
            material_id=mat_a.id,
            reviewer_name="Pending Officer Review",
            reviewer_role="Procurement Officer",
            decision="PENDING",
            comments="Generated by interactive comparison analysis.",
        )
        self.db.add(new_approval)

        # Record standard audit trail entry for match analysis
        now = datetime.now(timezone.utc)
        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            actor_name="SYSTEM_HEURISTIC_ENGINE",
            actor_role="MOCK_INFERENCE_PIPELINE",
            action="ANALYZE_MATCH",
            entity_type="MATCH",
            entity_id=match_id,
            previous_state=None,
            new_state={
                "material_a_id": mat_a.id,
                "material_b_id": mat_b.id,
                "material_a_code": mat_a.legacy_code,
                "material_b_code": mat_b.legacy_code,
                "relationship": sim_res.relationship.value,
                "confidence": sim_res.confidence,
                "engine": "MOCK_HEURISTIC",
            },
            source="MATCHING_ENGINE_SERVICE",
            timestamp=now,
        )
        self.db.add(audit_entry)
        self.db.commit()

        return self.get_match_by_id(match_id)
