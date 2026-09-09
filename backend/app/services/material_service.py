from typing import List, Optional
from sqlalchemy.orm import Session
from app.schemas.material import MaterialResponse


class MaterialService:
    """Service handling material ingestion, attribute retrieval, and catalog search."""

    def __init__(self, db: Session):
        self.db = db

    def list_materials(
        self, query: Optional[str] = None, cpse: Optional[str] = None, limit: int = 50
    ) -> List[MaterialResponse]:
        # Foundation placeholder: Full database query will be bound in Phase 4/5
        return []

    def get_material_by_id(self, material_id: str) -> Optional[MaterialResponse]:
        return None
