import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload

from app.models.upload import Upload
from app.models.cpse import CPSE
from app.schemas.upload import UploadResponse


def format_upload(u: Upload) -> UploadResponse:
    cpse_code = u.cpse_rel.code if u.cpse_rel else None
    created_str = (
        u.created_at.strftime("%Y-%m-%d %H:%M IST")
        if u.created_at
        else "2026-09-09 20:30 IST"
    )
    updated_str = (
        u.updated_at.strftime("%Y-%m-%d %H:%M IST")
        if u.updated_at
        else "2026-09-09 20:30 IST"
    )

    return UploadResponse(
        id=u.id,
        filename=u.filename,
        cpse_code=cpse_code,
        file_type=u.file_type or "CSV",
        status=u.status,
        row_count=u.row_count,
        processed_count=u.processed_count,
        error_log=u.error_log,
        created_at=created_str,
        updated_at=updated_str,
    )


class UploadService:
    def __init__(self, db: Session):
        self.db = db

    def list_uploads(self) -> List[UploadResponse]:
        uploads = (
            self.db.query(Upload)
            .options(joinedload(Upload.cpse_rel))
            .order_by(Upload.created_at.desc())
            .all()
        )
        return [format_upload(u) for u in uploads]

    def create_staged_upload(
        self,
        filename: str,
        cpse_code: Optional[str] = None,
        row_count: int = 0,
        source_path: Optional[str] = None,
    ) -> UploadResponse:
        cpse_id = None
        if cpse_code:
            cpse = self.db.query(CPSE).filter(CPSE.code == cpse_code.upper()).first()
            if cpse:
                cpse_id = cpse.id

        new_upload = Upload(
            id=str(uuid.uuid4()),
            filename=filename,
            cpse_id=cpse_id,
            file_type="CSV" if filename.endswith(".csv") else "EXCEL",
            status="STAGED",
            row_count=row_count,
            processed_count=0,
            source_path=source_path,
        )
        self.db.add(new_upload)
        self.db.commit()
        self.db.refresh(new_upload)
        return format_upload(new_upload)
