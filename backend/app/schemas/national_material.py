from typing import Dict, List, Optional
from pydantic import Field
from app.schemas.common import BaseSchema
from app.schemas.material import MaterialResponse


class NationalMaterialBase(BaseSchema):
    national_code: str = Field(..., description="Canonical NMC, e.g. NMC-BRG-6205-2RS")
    standard_description: str
    category: str
    material_group: Optional[str] = None
    family: Optional[str] = None
    equivalence_group: Optional[str] = None
    uom: Optional[str] = "NOS"
    key_specifications: Dict[str, str] = Field(default_factory=dict)


class NationalMaterialResponse(NationalMaterialBase):
    id: str
    participating_cpses_count: int = 0
    legacy_codes_count: int = 0
    total_historical_spend: float = 0.0
    total_annual_qty: float = 0.0
    status: str = "ACTIVE"
    created_at: str
    updated_at: str
    mapped_materials: Optional[List[MaterialResponse]] = None

