import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    cpse_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cpses.id", ondelete="SET NULL"), nullable=True, index=True
    )
    file_type: Mapped[str] = mapped_column(String(50), default="CSV")
    status: Mapped[str] = mapped_column(String(50), default="STAGED", index=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    processed_count: Mapped[int] = mapped_column(Integer, default=0)
    error_log: Mapped[str] = mapped_column(Text, nullable=True)
    source_path: Mapped[str] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    cpse_rel = relationship("CPSE", back_populates="uploads")
