from typing import Dict, List, Optional, Any
from pydantic import Field
from app.schemas.common import BaseSchema, MaterialStatus


class MaterialAttributeSchema(BaseSchema):
    key: str
    name: str
    value: Any
    unit: Optional[str] = None
    is_standardized: bool = True


class MaterialBase(BaseSchema):
    cpse: str
    legacy_code: str
    raw_description: str
    normalized_description: str
    category: str
    uom: str
    manufacturer: Optional[str] = None
    standard: Optional[str] = None
    material_grade: Optional[str] = None
    size_or_rating: Optional[str] = None
    material_group: Optional[str] = None
    family: Optional[str] = None
    record_id: Optional[str] = None
    specifications: Dict[str, str] = Field(default_factory=dict)
    attributes: List[MaterialAttributeSchema] = Field(default_factory=list)



class MaterialCreate(MaterialBase):
    pass


class MaterialResponse(MaterialBase):
    id: str
    national_material_code: Optional[str] = None
    status: MaterialStatus = MaterialStatus.PENDING_REVIEW
    match_confidence: Optional[float] = None
    historical_spend: Optional[float] = None
    historical_qty: Optional[float] = None
    last_updated: str
