from typing import Optional
from pydantic import Field
from app.schemas.common import BaseSchema, MatchRelationship


class MaterialMappingBase(BaseSchema):
    national_material_id: str
    national_material_code: str
    cpse: str
    legacy_material_code: str
    raw_description: str
    confidence: Optional[float] = None
    relationship: Optional[MatchRelationship] = None
    source_label: Optional[str] = None
    source: Optional[str] = None


class MaterialMappingResponse(MaterialMappingBase):
    id: str
    mapped_at: Optional[str] = None
    approved_by: str
