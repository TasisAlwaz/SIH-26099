import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship as sa_relationship
from app.db.base_class import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    material_a_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    material_b_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True
    )
    relationship: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    source_label: Mapped[str] = mapped_column(
        String(50), nullable=True
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)
    
    # Explainability & Breakdown JSON
    breakdown: Mapped[dict] = mapped_column(JSON, nullable=True)
    rationale: Mapped[list] = mapped_column(JSON, nullable=True)
    differences: Mapped[list] = mapped_column(JSON, nullable=True)
    recommended_nmc: Mapped[str] = mapped_column(String(100), nullable=True)
    engine: Mapped[str] = mapped_column(String(50), default="MOCK_HEURISTIC")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    material_a_rel = sa_relationship("Material", foreign_keys=[material_a_id])
    material_b_rel = sa_relationship("Material", foreign_keys=[material_b_id])
    approvals = sa_relationship("Approval", back_populates="match_rel")
