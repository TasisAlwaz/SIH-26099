import os
import re
import io
import csv
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse

router = APIRouter()

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB limit
STAGED_UPLOAD_DIR = Path("/home/blackhelix/Documents/SIH_26099/N-MAT/data/staged_uploads")


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
    Performs file sanitization, size validation, safe staging storage, and records
    the batch upload in the database with STAGED status.
    """
    original_filename = file.filename or "unknown_catalog.csv"
    lower_name = original_filename.lower()

    if not lower_name.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please provide a CSV or Excel (.xlsx/.xls) file.",
        )

    # Sanitize filename and prevent path traversal
    base_name = os.path.basename(original_filename)
    safe_base = re.sub(r"[^a-zA-Z0-9_.-]", "_", base_name)
    if not safe_base:
        safe_base = "catalog.csv"

    # Read content with size check
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed upload size of {MAX_UPLOAD_SIZE // (1024 * 1024)} MB.",
        )

    # Row counting and format verification
    row_count = 0
    error_note = None

    if lower_name.endswith(".csv"):
        try:
            text = content.decode("utf-8", errors="replace")
            reader = csv.reader(io.StringIO(text))
            rows = [r for r in reader if any(cell.strip() for cell in r)]
            row_count = max(0, len(rows) - 1) if rows else 0
        except Exception as e:
            row_count = 0
            error_note = f"CSV row parsing warning: {str(e)}"
    else:
        # Binary Excel (.xlsx/.xls) parsing is not supported in the approved lightweight dependency set.
        # Report 0 rows and explicitly record limitation in staged record metadata.
        row_count = 0
        error_note = (
            "Binary Excel format (.xlsx/.xls) row count unknown without third-party parser; "
            "staged as metadata record for batch processing."
        )

    # Persist file safely in staged directory outside source dataset
    STAGED_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    staged_filename = f"{uuid.uuid4().hex[:8]}_{safe_base}"
    staged_file_path = STAGED_UPLOAD_DIR / staged_filename

    try:
        with open(staged_file_path, "wb") as f:
            f.write(content)
        relative_path = f"data/staged_uploads/{staged_filename}"
    except Exception as e:
        relative_path = None
        error_note = f"Staging storage warning: {str(e)}"

    service = UploadService(db)
    return service.create_staged_upload(
        filename=safe_base,
        cpse_code=cpse_code,
        row_count=row_count,
        source_path=relative_path,
        error_log=error_note,
    )
