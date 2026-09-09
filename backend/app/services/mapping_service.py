import math
from typing import List, Optional
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload

from app.models.mapping import MaterialMapping
from app.models.material import Material
from app.models.national_material import NationalMaterial
from app.models.cpse import CPSE
from app.schemas.mapping import MaterialMappingResponse
from app.schemas.common import MatchRelationship, PaginatedResponse


def format_mapping(m: MaterialMapping) -> MaterialMappingResponse:
    nat_code = (
        m.national_material_rel.national_code
        if m.national_material_rel
        else "NMC-UNKNOWN"
    )
    cpse_code = (
        m.material_rel.cpse_rel.code
        if (m.material_rel and m.material_rel.cpse_rel)
        else "CPSE"
    )
    legacy_code = m.material_rel.legacy_code if m.material_rel else ""
    raw_desc = m.material_rel.description if m.material_rel else ""

    mapped_at_str = (
        m.created_at.strftime("%Y-%m-%d %H:%M IST")
        if m.created_at
        else "2026-09-09 20:30 IST"
    )

    # Determine relationship enum
    rel = MatchRelationship.DUPLICATE
    if m.material_rel and m.material_rel.source_match_type:
        smt = m.material_rel.source_match_type.upper()
        if smt in MatchRelationship.__members__:
            rel = MatchRelationship[smt]

    return MaterialMappingResponse(
        id=m.id,
        national_material_id=m.national_material_id,
        national_material_code=nat_code,
        cpse=cpse_code,
        legacy_material_code=legacy_code,
        raw_description=raw_desc,
        confidence=float(m.confidence or 1.0) * 100.0,
        relationship=rel,
        mapped_at=mapped_at_str,
        approved_by=m.mapped_by or "SYSTEM_HARMONIZATION",
    )


class MappingService:
    def __init__(self, db: Session):
        self.db = db

    def get_mappings(
        self, page: int = 1, page_size: int = 25, cpse: Optional[str] = None
    ) -> PaginatedResponse[MaterialMappingResponse]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 25
        if page_size > 100:
            page_size = 100

        q = (
            self.db.query(MaterialMapping)
            .options(
                joinedload(MaterialMapping.national_material_rel),
                joinedload(MaterialMapping.material_rel).joinedload(Material.cpse_rel),
            )
        )

        if cpse and cpse.upper() != "ALL":
            q = q.join(Material, MaterialMapping.material_id == Material.id).join(
                CPSE, Material.cpse_id == CPSE.id
            ).filter(CPSE.code == cpse.upper())

        total = q.count()
        offset = (page - 1) * page_size
        items = q.order_by(MaterialMapping.created_at.desc()).offset(offset).limit(page_size).all()
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return PaginatedResponse[MaterialMappingResponse](
            items=[format_mapping(m) for m in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_mappings_for_material(self, material_id: str) -> List[MaterialMappingResponse]:
        mappings = (
            self.db.query(MaterialMapping)
            .options(
                joinedload(MaterialMapping.national_material_rel),
                joinedload(MaterialMapping.material_rel).joinedload(Material.cpse_rel),
            )
            .filter(MaterialMapping.material_id == material_id)
            .all()
        )
        return [format_mapping(m) for m in mappings]

    def get_mappings_for_national_code(self, national_code: str) -> List[MaterialMappingResponse]:
        mappings = (
            self.db.query(MaterialMapping)
            .join(NationalMaterial, MaterialMapping.national_material_id == NationalMaterial.id)
            .options(
                joinedload(MaterialMapping.national_material_rel),
                joinedload(MaterialMapping.material_rel).joinedload(Material.cpse_rel),
            )
            .filter(
                or_(
                    NationalMaterial.national_code == national_code,
                    NationalMaterial.id == national_code,
                )
            )
            .all()
        )
        return [format_mapping(m) for m in mappings]
