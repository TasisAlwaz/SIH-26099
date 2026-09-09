from pydantic import Field
from app.schemas.common import BaseSchema, MatchRelationship


class MaterialMappingBase(BaseSchema):
    national_material_id: str
    national_material_code: str
    cpse: str
    legacy_material_code: str
    raw_description: str
    confidence: float
    relationship: MatchRelationship


class MaterialMappingResponse(MaterialMappingBase):
    id: str
    mapped_at: str
    approved_by: str
