import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class MaterialMapping(Base):
    __tablename__ = "material_mappings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    material_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    national_material_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("national_materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(50), default="MAPPED", nullable=False)
    source: Mapped[str] = mapped_column(String(100), default="SYSTEM_HARMONIZATION")
    confidence: Mapped[float] = mapped_column(Float, nullable=True)
    mapped_by: Mapped[str] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        UniqueConstraint("material_id", "national_material_id", name="uq_material_national_mapping"),
    )

    # Relationships
    material_rel = relationship("Material", back_populates="mappings")
    national_material_rel = relationship("NationalMaterial", back_populates="mappings")
