from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse

router = APIRouter()


@router.get("", response_model=List[UploadResponse])
def list_uploads(
    db: Session = Depends(get_db),
):
    """List catalog batch upload ingestion history and staging status."""
    service = UploadService(db)
    return service.list_uploads()


@router.get("/status")
def get_upload_status(
    db: Session = Depends(get_db),
):
    """Retrieve upload engine status and current staged upload counts."""
    service = UploadService(db)
    uploads = service.list_uploads()
    return {
        "status": "active",
        "total_uploads": len(uploads),
        "supported_formats": [".csv", ".xlsx", ".xls"],
    }


@router.post("", response_model=UploadResponse)
async def upload_catalog_file(
    file: UploadFile = File(...),
    cpse_code: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Stage an enterprise catalog file (CSV or Excel) for schema validation and ingestion.
    Records the batch upload in the database with STAGED status.
    """
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please provide a CSV or Excel (.xlsx/.xls) file.",
        )

    # Count lines if CSV
    row_count = 0
    try:
        content = await file.read()
        if file.filename.endswith(".csv"):
            lines = content.decode("utf-8", errors="ignore").splitlines()
            row_count = max(0, len(lines) - 1)  # subtract header
        else:
            row_count = 100  # Staged placeholder for binary excel
    except Exception:
        row_count = 0

    service = UploadService(db)
    return service.create_staged_upload(
        filename=file.filename,
        cpse_code=cpse_code,
        row_count=row_count,
        source_path=f"uploads/{file.filename}",
    )
