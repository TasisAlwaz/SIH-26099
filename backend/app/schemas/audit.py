from typing import Optional
from app.schemas.common import BaseSchema


class AuditLogBase(BaseSchema):
    user: str
    role: str
    action: str
    entity: str
    old_value: str
    new_value: str
    decision: str
    source: str


class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: Optional[str] = None
