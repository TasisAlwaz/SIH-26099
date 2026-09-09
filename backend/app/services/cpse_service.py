from typing import List, Optional
from sqlalchemy import func, distinct, or_
from sqlalchemy.orm import Session

from app.models.cpse import CPSE
from app.models.material import Material
from app.models.mapping import MaterialMapping
from app.models.match import Match
from app.schemas.cpse import CPSEResponse
from app.schemas.common import PaginatedResponse
from app.schemas.material import MaterialResponse
from app.services.material_service import MaterialService


class CPSEService:
    def __init__(self, db: Session):
        self.db = db

    def get_cpses(self) -> List[CPSEResponse]:
        cpses = self.db.query(CPSE).order_by(CPSE.code).all()
        result: List[CPSEResponse] = []

        for cpse in cpses:
            mat_count = (
                self.db.query(func.count(Material.id))
                .filter(Material.cpse_id == cpse.id)
                .scalar()
                or 0
            )

            mapped_count = (
                self.db.query(func.count(MaterialMapping.id))
                .join(Material, MaterialMapping.material_id == Material.id)
                .filter(Material.cpse_id == cpse.id)
                .scalar()
                or 0
            )

            match_count = (
                self.db.query(func.count(distinct(Match.id)))
                .join(Material, or_(Match.material_a_id == Material.id, Match.material_b_id == Material.id))
                .filter(Material.cpse_id == cpse.id)
                .scalar()
                or 0
            )

            last_sync = (
                cpse.updated_at.strftime("%Y-%m-%d %H:%M IST")
                if cpse.updated_at
                else (cpse.created_at.strftime("%Y-%m-%d %H:%M IST") if cpse.created_at else None)
            )

            result.append(
                CPSEResponse(
                    id=cpse.id,
                    code=cpse.code,
                    name=cpse.name,
                    category=cpse.category,
                    ministry=cpse.ministry or "Government of India",
                    status="ACTIVE" if cpse.is_active else "INACTIVE",
                    materials_imported=mat_count,
                    materials_standardized=mapped_count,
                    match_candidates=match_count,
                    approved_mappings=mapped_count,
                    last_synchronization=last_sync,
                )
            )

        return result

    def get_cpse_by_id_or_code(self, identifier: str) -> Optional[CPSEResponse]:
        cpse = (
            self.db.query(CPSE)
            .filter(or_(CPSE.id == identifier, func.upper(CPSE.code) == identifier.upper()))
            .first()
        )
        if not cpse:
            return None

        mat_count = (
            self.db.query(func.count(Material.id))
            .filter(Material.cpse_id == cpse.id)
            .scalar()
            or 0
        )
        mapped_count = (
            self.db.query(func.count(MaterialMapping.id))
            .join(Material, MaterialMapping.material_id == Material.id)
            .filter(Material.cpse_id == cpse.id)
            .scalar()
            or 0
        )
        match_count = (
            self.db.query(func.count(distinct(Match.id)))
            .join(Material, or_(Match.material_a_id == Material.id, Match.material_b_id == Material.id))
            .filter(Material.cpse_id == cpse.id)
            .scalar()
            or 0
        )

        last_sync = (
            cpse.updated_at.strftime("%Y-%m-%d %H:%M IST")
            if cpse.updated_at
            else (cpse.created_at.strftime("%Y-%m-%d %H:%M IST") if cpse.created_at else None)
        )

        return CPSEResponse(
            id=cpse.id,
            code=cpse.code,
            name=cpse.name,
            category=cpse.category,
            ministry=cpse.ministry or "Government of India",
            status="ACTIVE" if cpse.is_active else "INACTIVE",
            materials_imported=mat_count,
            materials_standardized=mapped_count,
            match_candidates=match_count,
            approved_mappings=mapped_count,
            last_synchronization=last_sync,
        )

    def get_cpse_materials(
        self, cpse_id: str, page: int = 1, page_size: int = 25
    ) -> PaginatedResponse[MaterialResponse]:
        cpse = self.get_cpse_by_id_or_code(cpse_id)
        if not cpse:
            return PaginatedResponse[MaterialResponse](
                items=[], total=0, page=page, page_size=page_size, total_pages=0
            )

        mat_service = MaterialService(self.db)
        return mat_service.get_materials(page=page, page_size=page_size, cpse=cpse.code)
