import math
from typing import Optional, Dict, Any, List
from sqlalchemy import or_, and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.material import Material
from app.models.cpse import CPSE
from app.models.mapping import MaterialMapping
from app.models.national_material import NationalMaterial
from app.schemas.material import MaterialResponse, MaterialAttributeSchema
from app.schemas.common import MaterialStatus, PaginatedResponse


def parse_specifications(spec_text: Optional[str]) -> Dict[str, str]:
    if not spec_text:
        return {}
    res = {}
    for part in spec_text.split(";"):
        part = part.strip()
        if not part:
            continue
        if "=" in part:
            k, v = part.split("=", 1)
            res[k.strip()] = v.strip()
        else:
            res["Specification"] = part
    return res


def format_material(mat: Material) -> MaterialResponse:
    specs = parse_specifications(mat.specification)
    
    attributes: List[MaterialAttributeSchema] = []
    if mat.size_or_rating:
        attributes.append(
            MaterialAttributeSchema(
                key="size_or_rating",
                name="Size / Rating",
                value=mat.size_or_rating,
                is_standardized=True,
            )
        )
    if mat.material_grade:
        attributes.append(
            MaterialAttributeSchema(
                key="material_grade",
                name="Material Grade",
                value=mat.material_grade,
                is_standardized=True,
            )
        )
    if mat.manufacturer:
        attributes.append(
            MaterialAttributeSchema(
                key="manufacturer",
                name="Manufacturer",
                value=mat.manufacturer,
                is_standardized=True,
            )
        )
    if mat.uom:
        attributes.append(
            MaterialAttributeSchema(
                key="uom",
                name="Unit of Measurement",
                value=mat.uom,
                is_standardized=True,
            )
        )

    # National code resolution
    nmc_code = None
    if mat.mappings and len(mat.mappings) > 0:
        mapping = mat.mappings[0]
        if mapping.national_material_rel:
            nmc_code = mapping.national_material_rel.national_code

    status = MaterialStatus.STANDARDIZED if nmc_code else MaterialStatus.PENDING_REVIEW
    cpse_code = mat.cpse_rel.code if mat.cpse_rel else "CPSE"

    last_updated_str = (
        mat.updated_at.strftime("%Y-%m-%d %H:%M IST")
        if mat.updated_at
        else "2026-09-09 20:30 IST"
    )

    return MaterialResponse(
        id=mat.id,
        cpse=cpse_code,
        legacy_code=mat.legacy_code,
        raw_description=mat.description,
        normalized_description=mat.description,
        category=mat.material_group or mat.family or "General Spares",
        material_group=mat.material_group,
        family=mat.family,
        size_or_rating=mat.size_or_rating,
        material_grade=mat.material_grade,
        record_id=mat.record_id,
        uom=mat.uom,
        manufacturer=mat.manufacturer,
        standard=specs.get("CLASS") or specs.get("STD") or "IS / DIN",
        specifications=specs,
        attributes=attributes,
        national_material_code=nmc_code,
        status=status,
        match_confidence=100.0 if nmc_code else None,
        last_updated=last_updated_str,
    )


class MaterialService:
    def __init__(self, db: Session):
        self.db = db

    def get_materials(
        self,
        page: int = 1,
        page_size: int = 25,
        query: Optional[str] = None,
        cpse: Optional[str] = None,
        category: Optional[str] = None,
        family: Optional[str] = None,
        uom: Optional[str] = None,
        status: Optional[str] = None,
    ) -> PaginatedResponse[MaterialResponse]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 25
        if page_size > 100:
            page_size = 100

        q = (
            self.db.query(Material)
            .join(CPSE, Material.cpse_id == CPSE.id)
            .options(
                joinedload(Material.cpse_rel),
                joinedload(Material.mappings).joinedload(MaterialMapping.national_material_rel),
            )
        )

        # Apply Filters
        if cpse and cpse.upper() != "ALL":
            q = q.filter(CPSE.code == cpse.upper())

        if category and category.upper() != "ALL":
            q = q.filter(
                or_(
                    func.lower(Material.material_group) == category.lower(),
                    func.lower(Material.family) == category.lower(),
                )
            )

        if family and family.upper() != "ALL":
            q = q.filter(func.lower(Material.family) == family.lower())

        if uom and uom.upper() != "ALL":
            q = q.filter(func.lower(Material.uom) == uom.lower())

        if status and status.upper() != "ALL":
            if status.upper() == "STANDARDIZED":
                q = q.filter(Material.mappings.any())
            elif status.upper() in ("PENDING_REVIEW", "UNMATCHED"):
                q = q.filter(~Material.mappings.any())

        if query and query.strip():
            term = f"%{query.strip().lower()}%"
            # Join with NationalMaterial if searching by national code
            q = q.outerjoin(MaterialMapping, Material.id == MaterialMapping.material_id)
            q = q.outerjoin(NationalMaterial, MaterialMapping.national_material_id == NationalMaterial.id)
            q = q.filter(
                or_(
                    func.lower(Material.legacy_code).like(term),
                    func.lower(Material.description).like(term),
                    func.lower(Material.specification).like(term),
                    func.lower(Material.manufacturer).like(term),
                    func.lower(Material.family).like(term),
                    func.lower(Material.material_group).like(term),
                    func.lower(Material.record_id).like(term),
                    func.lower(NationalMaterial.national_code).like(term),
                )
            ).distinct()

        total = q.count()
        offset = (page - 1) * page_size
        items = q.order_by(Material.legacy_code).offset(offset).limit(page_size).all()

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        formatted_items = [format_material(m) for m in items]

        return PaginatedResponse[MaterialResponse](
            items=formatted_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_material_by_id(self, identifier: str) -> Optional[MaterialResponse]:
        mat = (
            self.db.query(Material)
            .options(
                joinedload(Material.cpse_rel),
                joinedload(Material.mappings).joinedload(MaterialMapping.national_material_rel),
            )
            .filter(
                or_(
                    Material.id == identifier,
                    Material.legacy_code == identifier,
                    Material.record_id == identifier,
                )
            )
            .first()
        )
        if not mat:
            return None
        return format_material(mat)
