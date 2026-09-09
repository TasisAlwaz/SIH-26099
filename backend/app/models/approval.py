import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    match_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=True, index=True
    )
    material_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=True, index=True
    )
    reviewer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    reviewer_role: Mapped[str] = mapped_column(String(100), nullable=False)
    decision: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    comments: Mapped[str] = mapped_column(Text, nullable=True)
    
    action_taken_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    match_rel = relationship("Match", back_populates="approvals")
