from typing import Optional
from pydantic import Field
from app.schemas.common import BaseSchema


class CPSEBase(BaseSchema):
    code: str = Field(..., description="Enterprise acronym, e.g. IOCL, NTPC, SAIL")
    name: str = Field(..., description="Full enterprise legal name")
    category: str = Field("Maharatna", description="Maharatna / Navratna / Miniratna")
    ministry: str
    status: str = "ACTIVE"


class CPSECreate(CPSEBase):
    pass


class CPSEResponse(CPSEBase):
    id: str
    materials_imported: int = 0
    materials_standardized: int = 0
    match_candidates: int = 0
    approved_mappings: int = 0
    last_synchronization: Optional[str] = None
