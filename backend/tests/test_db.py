import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy import text, select, func
from sqlalchemy.exc import IntegrityError

from app.db.session import engine
from app.models.cpse import CPSE
from app.models.national_material import NationalMaterial
from app.models.material import Material
from app.models.mapping import MaterialMapping
from app.models.match import Match
from app.models.approval import Approval
from app.models.audit import AuditLog
from app.models.upload import Upload


def test_real_postgres_connection():
    """Verify that SQLAlchemy establishes a live connection to PostgreSQL."""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1;")).scalar()
        assert result == 1

        version = conn.execute(text("SELECT version();")).scalar()
        assert "PostgreSQL" in version


def test_seeded_database_counts(db_session):
    """Verify that the material master dataset has been properly seeded."""
    cpse_count = db_session.scalar(select(func.count(CPSE.id)))
    assert cpse_count >= 4, f"Expected at least 4 CPSEs, found {cpse_count}"

    nat_count = db_session.scalar(select(func.count(NationalMaterial.id)))
    assert nat_count >= 1340, f"Expected >= 1340 national materials, found {nat_count}"

    mat_count = db_session.scalar(select(func.count(Material.id)))
    assert mat_count >= 9600, f"Expected >= 9600 legacy materials, found {mat_count}"

    map_count = db_session.scalar(select(func.count(MaterialMapping.id)))
    assert map_count >= 9600, f"Expected >= 9600 material mappings, found {map_count}"

    matches_count = db_session.scalar(select(func.count(Match.id)))
    assert matches_count >= 10, f"Expected >= 10 matches, found {matches_count}"

    approvals_count = db_session.scalar(select(func.count(Approval.id)))
    assert approvals_count >= 5, f"Expected >= 5 approvals, found {approvals_count}"


def test_cpse_uniqueness(db_session):
    """Verify that CPSE code uniqueness constraint is strictly enforced."""
    unique_code = f"TEST_CPSE_{uuid.uuid4().hex[:6].upper()}"
    cpse1 = CPSE(
        id=str(uuid.uuid4()),
        code=unique_code,
        name="Test CPSE One",
        category="Navratna",
        ministry="Ministry of Heavy Industries",
    )
    db_session.add(cpse1)
    db_session.commit()

    # Attempting duplicate code must raise IntegrityError
    cpse2 = CPSE(
        id=str(uuid.uuid4()),
        code=unique_code,
        name="Test CPSE Duplicate",
        category="Miniratna",
        ministry="Ministry of Steel",
    )
    db_session.add(cpse2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Cleanup
    db_session.delete(cpse1)
    db_session.commit()


def test_material_composite_uniqueness(db_session):
    """Verify that (cpse_id, legacy_code) composite uniqueness is enforced."""
    # Fetch an existing CPSE
    cpse = db_session.scalar(select(CPSE).limit(1))
    assert cpse is not None

    test_code = f"MAT-TEST-{uuid.uuid4().hex[:6]}"
    mat1 = Material(
        id=str(uuid.uuid4()),
        cpse_id=cpse.id,
        legacy_code=test_code,
        description="Test Ball Valve 2 INCH 150#",
        uom="NOS",
        material_group="Valves",
        family="Ball Valve",
    )
    db_session.add(mat1)
    db_session.commit()

    # Duplicate legacy code under the same CPSE must fail
    mat2 = Material(
        id=str(uuid.uuid4()),
        cpse_id=cpse.id,
        legacy_code=test_code,
        description="Duplicate Ball Valve",
        uom="NOS",
    )
    db_session.add(mat2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Cleanup
    db_session.delete(mat1)
    db_session.commit()


def test_bidirectional_material_mapping(db_session):
    """Verify bidirectional relationship traversal between Material and NationalMaterial."""
    # Find an existing mapped material
    mat = db_session.scalar(select(Material).limit(1))
    assert mat is not None
    assert len(mat.mappings) > 0

    mapping = mat.mappings[0]
    nat_mat = mapping.national_material_rel
    assert nat_mat is not None
    assert nat_mat.national_code.startswith("NMC-")
    assert mat.cpse_rel is not None
    assert mat.cpse_rel.code in ["IOCL", "NTPC", "SAIL", "BHEL"]


def test_match_explainability_json(db_session):
    """Verify that Match stores and retrieves structured JSON breakdown and rationale."""
    match = db_session.scalar(select(Match).where(Match.status == "PENDING").limit(1))
    assert match is not None
    assert match.breakdown is not None
    assert "description_similarity" in match.breakdown
    assert "uom_compatibility" in match.breakdown
    assert isinstance(match.rationale, list)
    assert match.material_a_rel is not None
    assert match.material_b_rel is not None


def test_hitl_approval_workflow(db_session):
    """Verify Approval model links to Match and records decision details."""
    approval = db_session.scalar(select(Approval).limit(1))
    assert approval is not None
    assert approval.decision in ["APPROVED", "REJECTED"]
    assert approval.reviewer_name != ""
    assert approval.reviewer_role != ""
    assert approval.match_rel is not None


def test_audit_log_recording(db_session):
    """Verify AuditLog persists structured state transitions and actor details."""
    logs = db_session.scalars(select(AuditLog)).all()
    assert len(logs) >= 2
    ingest_log = next((l for l in logs if l.action == "DATASET_INGESTION_COMPLETED"), None)
    assert ingest_log is not None
    assert ingest_log.actor_name == "SYSTEM_INITIALIZER"
    assert ingest_log.new_state["total_rows"] == 9600


def test_cascade_delete_integrity(db_session):
    """Verify that foreign key CASCADE delete cleans up dependent mappings on material deletion."""
    cpse = db_session.scalar(select(CPSE).limit(1))
    nat_mat = db_session.scalar(select(NationalMaterial).limit(1))

    temp_mat_id = str(uuid.uuid4())
    temp_mat = Material(
        id=temp_mat_id,
        cpse_id=cpse.id,
        legacy_code=f"TEMP-{uuid.uuid4().hex[:6]}",
        description="Temporary Test Item",
        uom="NOS",
    )
    db_session.add(temp_mat)
    db_session.commit()

    temp_map_id = str(uuid.uuid4())
    temp_map = MaterialMapping(
        id=temp_map_id,
        material_id=temp_mat_id,
        national_material_id=nat_mat.id,
        status="MAPPED",
    )
    db_session.add(temp_map)
    db_session.commit()

    # Verify map exists
    assert db_session.scalar(select(MaterialMapping).where(MaterialMapping.id == temp_map_id)) is not None

    # Delete material -> mapping must be cascade-deleted
    db_session.delete(temp_mat)
    db_session.commit()

    assert db_session.scalar(select(MaterialMapping).where(MaterialMapping.id == temp_map_id)) is None
