import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    cpse_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cpses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    legacy_code: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    record_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    specification: Mapped[str] = mapped_column(Text, nullable=True)
    uom: Mapped[str] = mapped_column(String(50), nullable=False)
    material_group: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    family: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    size_or_rating: Mapped[str] = mapped_column(String(100), nullable=True)
    material_grade: Mapped[str] = mapped_column(String(100), nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Preserved source labels
    source_match_type: Mapped[str] = mapped_column(String(50), nullable=True)
    is_duplicate_equivalent: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(50), default="SYNTHETIC_DATASET")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("cpse_id", "legacy_code", name="uq_materials_cpse_legacy_code"),
    )

    # Relationships
    cpse_rel = relationship("CPSE", back_populates="materials")
    mappings = relationship("MaterialMapping", back_populates="material_rel", cascade="all, delete-orphan")
