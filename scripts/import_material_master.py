#!/usr/bin/env python3
"""
N-MAT Material Master Ingestion & Database Seeding Script.
Smart India Hackathon (SIH) — Problem Statement 26099.

This script imports the synthetic material master dataset into PostgreSQL:
1. CPSE master records (IOCL, NTPC, SAIL, BHEL)
2. National Materials (1,340 unique common_national_code clusters)
3. CPSE Legacy Materials (9,600 records with full technical attributes)
4. Bidirectional Material Mappings (linking materials to national codes)
5. Ingestion Upload history logs
6. Representative HITL candidate pairs (matches) and officer approvals
7. Immutable audit trail events

Strict Architectural Constraints:
- Pure Python standard library for data reading (built-in csv module, zero pandas/numpy/ML dependencies)
- Original dataset data/raw/cpse_material_master_synthetic.csv is treated as strictly read-only
- Fully idempotent and transactional
"""

import os
import sys
import csv
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

# Add backend directory to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select, delete, func
from app.db.session import SessionLocal, engine
from app.models.cpse import CPSE
from app.models.national_material import NationalMaterial
from app.models.material import Material
from app.models.mapping import MaterialMapping
from app.models.match import Match
from app.models.approval import Approval
from app.models.audit import AuditLog
from app.models.upload import Upload

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("nmat.importer")

CSV_PATH = REPO_ROOT / "data" / "raw" / "cpse_material_master_synthetic.csv"

CPSE_METADATA = [
    {
        "code": "IOCL",
        "name": "Indian Oil Corporation Limited",
        "category": "Maharatna",
        "ministry": "Ministry of Petroleum and Natural Gas",
    },
    {
        "code": "NTPC",
        "name": "NTPC Limited",
        "category": "Maharatna",
        "ministry": "Ministry of Power",
    },
    {
        "code": "SAIL",
        "name": "Steel Authority of India Limited",
        "category": "Maharatna",
        "ministry": "Ministry of Steel",
    },
    {
        "code": "BHEL",
        "name": "Bharat Heavy Electricals Limited",
        "category": "Maharatna",
        "ministry": "Ministry of Heavy Industries",
    },
]


def clean_str(val: str | None) -> str:
    if not val:
        return ""
    return " ".join(val.strip().split())


def seed_database(force: bool = False):
    if not CSV_PATH.exists():
        logger.error(f"Dataset not found at expected path: {CSV_PATH}")
        sys.exit(1)

    logger.info(f"Connecting to database via {engine.url.render_as_string(hide_password=True)}...")

    with SessionLocal() as db:
        # Check existing materials count
        existing_materials_count = db.scalar(select(func.count(Material.id))) or 0
        if existing_materials_count > 0 and not force:
            logger.info(
                f"Database already populated ({existing_materials_count} materials found). "
                "Use --force to re-seed from scratch."
            )
            return

        if force and existing_materials_count > 0:
            logger.warning("Force flag passed. Cleaning existing application data...")
            db.execute(delete(Approval))
            db.execute(delete(Match))
            db.execute(delete(MaterialMapping))
            db.execute(delete(Material))
            db.execute(delete(NationalMaterial))
            db.execute(delete(Upload))
            db.execute(delete(AuditLog))
            db.execute(delete(CPSE))
            db.commit()
            logger.info("Cleaned existing data.")

        # 1. Seed / Resolve CPSE Entities
        logger.info("Synchronizing CPSE master records...")
        cpse_map = {}  # code -> CPSE model instance
        for meta in CPSE_METADATA:
            existing = db.scalar(select(CPSE).where(CPSE.code == meta["code"]))
            if not existing:
                cpse = CPSE(
                    id=str(uuid.uuid4()),
                    code=meta["code"],
                    name=meta["name"],
                    category=meta["category"],
                    ministry=meta["ministry"],
                    is_active=True,
                )
                db.add(cpse)
                db.flush()
                cpse_map[meta["code"]] = cpse
                logger.info(f"  Created CPSE: {meta['code']} - {meta['name']}")
            else:
                cpse_map[meta["code"]] = existing
                logger.info(f"  Existing CPSE: {meta['code']} - {existing.name}")

        db.commit()

        # 2. Read and Profile CSV
        logger.info(f"Reading raw material dataset from {CSV_PATH}...")
        rows = []
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)

        total_rows = len(rows)
        logger.info(f"Loaded {total_rows} records from CSV.")

        # Group rows by common_national_code to synthesize national material standards
        nmc_groups = defaultdict(list)
        for r in rows:
            nmc_groups[r["common_national_code"].strip()].append(r)

        logger.info(f"Found {len(nmc_groups)} unique common_national_code clusters.")

        # 3. Create National Material Master Records
        logger.info("Populating national_materials table...")
        national_map = {}  # nmc_code -> NationalMaterial.id
        nmc_objects = []

        for nmc_code, cluster in nmc_groups.items():
            # Pick canonical representative row (prefer exact match or first row)
            rep_row = cluster[0]
            for r in cluster:
                if r.get("match_type") == "exact":
                    rep_row = r
                    break

            std_desc = clean_str(rep_row.get("material_description"))
            std_spec = clean_str(rep_row.get("technical_specification"))
            uom = clean_str(rep_row.get("uom")).upper() or "NOS"
            group = clean_str(rep_row.get("material_group"))
            family = clean_str(rep_row.get("family"))
            eq_group = clean_str(rep_row.get("equivalence_group"))

            nat_mat = NationalMaterial(
                id=str(uuid.uuid4()),
                national_code=nmc_code,
                equivalence_group=eq_group,
                standard_description=std_desc,
                standard_specification=std_spec,
                uom=uom,
                material_group=group,
                family=family,
                is_active=True,
            )
            nmc_objects.append(nat_mat)
            national_map[nmc_code] = nat_mat.id

        db.add_all(nmc_objects)
        db.flush()
        logger.info(f"Successfully staged {len(nmc_objects)} National Materials.")

        # 4. Create CPSE Legacy Materials & Material Mappings
        logger.info("Populating materials and material_mappings tables...")
        material_objects = []
        mapping_objects = []
        record_id_to_mat_id = {}
        cpse_counts = defaultdict(int)

        for r in rows:
            cpse_code = r["cpse"].strip()
            cpse_obj = cpse_map.get(cpse_code)
            if not cpse_obj:
                logger.warning(f"Unknown CPSE: {cpse_code}, skipping row {r.get('record_id')}")
                continue

            mat_id = str(uuid.uuid4())
            record_id = r.get("record_id", "").strip() or None
            legacy_code = clean_str(r.get("material_code"))
            desc = clean_str(r.get("material_description"))
            spec = clean_str(r.get("technical_specification"))
            uom = clean_str(r.get("uom")).upper() or "NOS"
            group = clean_str(r.get("material_group"))
            family = clean_str(r.get("family"))
            size_or_rating = clean_str(r.get("size_or_rating"))
            grade = clean_str(r.get("material_grade"))
            manufacturer = clean_str(r.get("manufacturer"))
            match_type = clean_str(r.get("match_type"))
            is_dup = r.get("is_duplicate_equivalent", "0").strip() in ("1", "true", "True")
            nmc_code = clean_str(r.get("common_national_code"))

            mat = Material(
                id=mat_id,
                cpse_id=cpse_obj.id,
                legacy_code=legacy_code,
                record_id=record_id,
                description=desc,
                specification=spec,
                uom=uom,
                material_group=group,
                family=family,
                size_or_rating=size_or_rating,
                material_grade=grade,
                manufacturer=manufacturer,
                source_match_type=match_type,
                is_duplicate_equivalent=is_dup,
                source="SYNTHETIC_DATASET",
            )
            material_objects.append(mat)
            if record_id:
                record_id_to_mat_id[record_id] = mat_id
            cpse_counts[cpse_code] += 1

            # Create Mapping linking to National Material
            nat_id = national_map.get(nmc_code)
            if nat_id:
                mapping = MaterialMapping(
                    id=str(uuid.uuid4()),
                    material_id=mat_id,
                    national_material_id=nat_id,
                    status="MAPPED",
                    source="SYNTHETIC_GROUND_TRUTH",
                    confidence=1.0,
                    mapped_by="SYSTEM_INGESTION",
                )
                mapping_objects.append(mapping)

        # Batch insert for high performance
        batch_size = 2000
        for i in range(0, len(material_objects), batch_size):
            db.add_all(material_objects[i : i + batch_size])
            db.flush()
        logger.info(f"Successfully staged {len(material_objects)} CPSE Legacy Materials.")

        for i in range(0, len(mapping_objects), batch_size):
            db.add_all(mapping_objects[i : i + batch_size])
            db.flush()
        logger.info(f"Successfully staged {len(mapping_objects)} Material Mappings.")

        # 5. Create Ingestion Upload Records
        logger.info("Recording batch upload audit logs for CPSE catalogs...")
        for cpse_code, count in cpse_counts.items():
            cpse_obj = cpse_map[cpse_code]
            upload = Upload(
                id=str(uuid.uuid4()),
                filename=f"{cpse_code}_legacy_material_master.csv",
                cpse_id=cpse_obj.id,
                file_type="CSV",
                status="COMPLETED",
                row_count=count,
                processed_count=count,
                source_path=str(CSV_PATH),
            )
            db.add(upload)

        # 6. Generate Representative HITL Matches & Approvals for Live Demo
        logger.info("Generating representative HITL matches and officer review queues...")
        # Select representative clusters with materials from multiple CPSEs
        multi_cpse_clusters = [
            cluster for cluster in nmc_groups.values()
            if len({r["cpse"] for r in cluster}) >= 2 and len(cluster) >= 4
        ]

        sample_matches = []
        sample_approvals = []

        demo_scenarios = [
            {
                "status": "PENDING",
                "relationship": "DUPLICATE",
                "confidence": 94.8,
                "engine": "MOCK_HEURISTIC",
                "breakdown": {
                    "description_similarity": 92.4,
                    "specification_similarity": 95.8,
                    "attribute_similarity": 98.0,
                    "uom_compatibility": 100.0,
                    "manufacturer_match": 88.0,
                },
                "rationale": [
                    "Identical physical and functional specification across enterprises",
                    "Units of measurement strictly align (NOS / NOS)",
                    "Material grade and sizing verified within standard tolerance",
                ],
                "differences": [
                    "Minor textual formatting and CPSE prefix discrepancy",
                ],
                "approval": None,
            },
            {
                "status": "PENDING",
                "relationship": "NEAR_DUPLICATE",
                "confidence": 88.2,
                "engine": "MOCK_HEURISTIC",
                "breakdown": {
                    "description_similarity": 86.0,
                    "specification_similarity": 89.5,
                    "attribute_similarity": 90.0,
                    "uom_compatibility": 100.0,
                    "manufacturer_match": 75.0,
                },
                "rationale": [
                    "Functional parameters match operational interchangeability threshold",
                    "Identical core family and dimensional ratings",
                ],
                "differences": [
                    "Surface coating / grade designation variation requires cataloging sign-off",
                ],
                "approval": None,
            },
            {
                "status": "APPROVED",
                "relationship": "IDENTICAL",
                "confidence": 99.1,
                "engine": "MOCK_HEURISTIC",
                "breakdown": {
                    "description_similarity": 99.0,
                    "specification_similarity": 99.5,
                    "attribute_similarity": 100.0,
                    "uom_compatibility": 100.0,
                    "manufacturer_match": 98.0,
                },
                "rationale": [
                    "Exact physical match across Indian Standard IS specification",
                    "100% attribute parity verified by automated rule engine",
                ],
                "differences": [],
                "approval": {
                    "reviewer_name": "Rajesh Kumar",
                    "reviewer_role": "Chief Materials Manager (IOCL)",
                    "decision": "APPROVED",
                    "comments": "Verified against IS-1239 standard. Harmonization approved.",
                },
            },
            {
                "status": "APPROVED",
                "relationship": "FUNCTIONALLY_EQUIVALENT",
                "confidence": 86.5,
                "engine": "MOCK_HEURISTIC",
                "breakdown": {
                    "description_similarity": 82.0,
                    "specification_similarity": 88.0,
                    "attribute_similarity": 90.0,
                    "uom_compatibility": 100.0,
                    "manufacturer_match": 60.0,
                },
                "rationale": [
                    "Different approved manufacturers but identical operational rating",
                    "Interchangeable in standard plant maintenance workflows",
                ],
                "differences": [
                    "Different OEM brands (SKF vs FAG)",
                ],
                "approval": {
                    "reviewer_name": "Amitabha Sen",
                    "reviewer_role": "General Manager Procurement (SAIL)",
                    "decision": "APPROVED",
                    "comments": "Cross-manufacturer interchangeability approved for joint tender.",
                },
            },
            {
                "status": "REJECTED",
                "relationship": "NOT_EQUIVALENT",
                "confidence": 42.0,
                "engine": "MOCK_HEURISTIC",
                "breakdown": {
                    "description_similarity": 48.0,
                    "specification_similarity": 35.0,
                    "attribute_similarity": 40.0,
                    "uom_compatibility": 100.0,
                    "manufacturer_match": 30.0,
                },
                "rationale": [
                    "Pressure rating mismatch exceeds safety tolerance limit (Class 150 vs Class 300)",
                    "Non-interchangeable components in high-pressure steam service",
                ],
                "differences": [
                    "Rating: 150# vs 300#",
                    "Flange thickness differs by 8mm",
                ],
                "approval": {
                    "reviewer_name": "Dr. V. Ramanathan",
                    "reviewer_role": "Director Technical (NTPC)",
                    "decision": "REJECTED",
                    "comments": "Critical pressure rating difference. Must remain separate item codes.",
                },
            },
        ]

        # Generate ~15 match records across selected multi-CPSE clusters
        for idx, cluster in enumerate(multi_cpse_clusters[:15]):
            scenario = demo_scenarios[idx % len(demo_scenarios)]
            r_a = cluster[0]
            # Find a paired row from a different CPSE
            r_b = next((r for r in cluster[1:] if r["cpse"] != r_a["cpse"]), cluster[1])

            mat_a_id = record_id_to_mat_id.get(r_a["record_id"])
            mat_b_id = record_id_to_mat_id.get(r_b["record_id"])

            if not mat_a_id or not mat_b_id:
                continue

            match_id = str(uuid.uuid4())
            match = Match(
                id=match_id,
                material_a_id=mat_a_id,
                material_b_id=mat_b_id,
                relationship=scenario["relationship"],
                source_label=r_a.get("match_type"),
                confidence=scenario["confidence"],
                status=scenario["status"],
                breakdown=scenario["breakdown"],
                rationale=scenario["rationale"],
                differences=scenario["differences"],
                recommended_nmc=r_a.get("common_national_code"),
                engine=scenario["engine"],
            )
            sample_matches.append(match)

            if scenario["approval"]:
                app_meta = scenario["approval"]
                approval = Approval(
                    id=str(uuid.uuid4()),
                    match_id=match_id,
                    material_id=mat_a_id,
                    reviewer_name=app_meta["reviewer_name"],
                    reviewer_role=app_meta["reviewer_role"],
                    decision=app_meta["decision"],
                    comments=app_meta["comments"],
                    action_taken_at=datetime.now(timezone.utc),
                )
                sample_approvals.append(approval)
            else:
                approval = Approval(
                    id=str(uuid.uuid4()),
                    match_id=match_id,
                    material_id=mat_a_id,
                    reviewer_name="Pending Officer Review",
                    reviewer_role="Procurement Officer",
                    decision="PENDING",
                    comments="Awaiting parameter verification and sign-off.",
                    action_taken_at=None,
                )
                sample_approvals.append(approval)

        db.add_all(sample_matches)
        db.flush()
        db.add_all(sample_approvals)
        db.flush()
        logger.info(f"Staged {len(sample_matches)} matches and {len(sample_approvals)} approvals.")

        # 7. Immutable Audit Trail Entries
        logger.info("Recording initial audit log events...")
        audit_events = [
            AuditLog(
                id=str(uuid.uuid4()),
                actor_name="SYSTEM_INITIALIZER",
                actor_role="N-MAT System Automation",
                action="DATASET_INGESTION_COMPLETED",
                entity_type="DATASET",
                entity_id="cpse_material_master_synthetic.csv",
                previous_state={"total_rows": 0},
                new_state={
                    "total_rows": total_rows,
                    "unique_national_codes": len(nmc_groups),
                    "cpse_breakdown": dict(cpse_counts),
                },
                source="SCRIPTS_IMPORT",
            ),
            AuditLog(
                id=str(uuid.uuid4()),
                actor_name="SYSTEM_HARMONIZATION",
                actor_role="Unified Master Engine",
                action="NATIONAL_CODES_INITIALIZED",
                entity_type="NATIONAL_MATERIAL",
                entity_id="ALL",
                previous_state={},
                new_state={"count": len(nmc_groups)},
                source="SCRIPTS_IMPORT",
            ),
        ]
        db.add_all(audit_events)

        # Commit entire transaction
        db.commit()
        logger.info("All transactions committed successfully to PostgreSQL.")

    # Final summary report
    print("\n" + "=" * 60)
    print("N-MAT PHASE 4 — DATABASE SEEDING COMPLETE")
    print("=" * 60)
    print(f"  CPSE Records Ingested:        {len(CPSE_METADATA)}")
    for code, count in cpse_counts.items():
        print(f"    - {code}: {count} items")
    print(f"  National Materials Created:   {len(nmc_groups)}")
    print(f"  CPSE Materials Created:       {len(material_objects)}")
    print(f"  Material Mappings Created:    {len(mapping_objects)}")
    print(f"  HITL Matches Staged:          {len(sample_matches)}")
    print(f"  Officer Approvals Recorded:   {len(sample_approvals)}")
    print(f"  Audit Logs Created:           {len(audit_events)}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Seed N-MAT PostgreSQL database from raw CSV.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Clean existing records before importing.",
    )
    args = parser.parse_args()
    seed_database(force=args.force)
