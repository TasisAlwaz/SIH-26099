from typing import List, Optional
from sqlalchemy.orm import Session
from app.schemas.national_material import NationalMaterialResponse


class NationalMaterialService:
    """Service governing Common National Material Code (NMC) allocation and mappings."""

    def __init__(self, db: Session):
        self.db = db

    def list_national_materials(self, limit: int = 50) -> List[NationalMaterialResponse]:
        return []

    def get_by_national_code(self, code: str) -> Optional[NationalMaterialResponse]:
        return None
