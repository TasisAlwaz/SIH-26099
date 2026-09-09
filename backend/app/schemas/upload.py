from typing import Optional
from app.schemas.common import BaseSchema


class UploadResponse(BaseSchema):
    id: str
    filename: str
    cpse_code: Optional[str] = None
    file_type: str = "CSV"
    status: str
    row_count: int = 0
    processed_count: int = 0
    error_log: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
