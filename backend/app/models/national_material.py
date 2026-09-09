import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class NationalMaterial(Base):
    __tablename__ = "national_materials"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    national_code: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    equivalence_group: Mapped[str] = mapped_column(
        String(100), index=True, nullable=True
    )
    standard_description: Mapped[str] = mapped_column(Text, nullable=False)
    standard_specification: Mapped[str] = mapped_column(Text, nullable=True)
    uom: Mapped[str] = mapped_column(String(50), nullable=False)
    material_group: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    family: Mapped[str] = mapped_column(String(100), index=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    mappings = relationship("MaterialMapping", back_populates="national_material_rel", cascade="all, delete-orphan")
