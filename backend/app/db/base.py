# Import all the models here for Alembic target_metadata discovery
from app.db.base_class import Base
from app.models.cpse import CPSE
from app.models.national_material import NationalMaterial
from app.models.material import Material
from app.models.mapping import MaterialMapping
from app.models.match import Match
from app.models.approval import Approval
from app.models.audit import AuditLog
from app.models.upload import Upload

__all__ = [
    "Base",
    "CPSE",
    "NationalMaterial",
    "Material",
    "MaterialMapping",
    "Match",
    "Approval",
    "AuditLog",
    "Upload",
]

