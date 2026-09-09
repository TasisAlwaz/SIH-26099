# N-MAT — National Material Intelligence Platform

**Smart India Hackathon (SIH) — Problem Statement:** PS 26099  
**Current Development Phase:** Phase 1 — Environment & Repository Setup (In Progress)  
**Document Classification:** Enterprise Architecture & Technical Specification

---

## 1. Problem Overview

Central Public Sector Enterprises (CPSEs) across India—including organizations such as IOCL, NTPC, SAIL, ONGC, HPCL, BPCL, and CPCL—procure massive quantities of industrial materials, equipment, and spare parts. Currently, each enterprise maintains isolated Material Masters with disparate classification schemas, custom naming conventions, non-standardized descriptions, and proprietary material item codes.

As a result:
* Identical engineering items (e.g., standard bearings, flanges, valves, fasteners, cables) are cataloged under disparate naming conventions across CPSEs.
* Fragmented procurement prevents CPSEs from aggregating demand or achieving sovereign economies of scale.
* Discrepancies in technical attributes lead to redundant inventory accumulation and high operational overhead.

---

## 2. Project Objective

N-MAT builds an AI-powered National Unified Material Master platform designed to:
1. **Multi-Source Ingestion:** Ingest raw material catalogs, legacy item codes, engineering specifications, units of measurement (UOM), and procurement spend data from participating CPSEs.
2. **Deterministic AI Deduplication:** Analyze unstructured descriptions, national/international standards (IS, ASTM, DIN, ISO), and technical parameters to classify material relationships into 5 deterministic classes (`IDENTICAL`, `DUPLICATE`, `NEAR_DUPLICATE`, `FUNCTIONALLY_EQUIVALENT`, `NOT_EQUIVALENT`).
3. **Common National Material Code (NMC):** Recommend a standardized National Material Code for approved clusters.
4. **Non-Destructive Traceability:** Preserve unbroken, bidirectional traceability back to each participating CPSE's legacy material code.
5. **Human-in-the-Loop Governance:** Provide procurement and cataloging officers with explainable AI rationale, parameter discrepancy matrices, and approval/rejection gates.
6. **Procurement Intelligence:** Aggregate procurement demand, identify price variations, and surface consolidated purchasing opportunities.

---

## 3. High-Level Architecture

The platform operates on a strict multi-tier architecture with explicit service isolation:

```
┌────────────────────────────────────────────────────────┐
│             Frontend (Next.js / TypeScript)            │
│  Enterprise UI, Review Gate, Recharts, React Flow      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST APIs
┌──────────────────────────▼─────────────────────────────┐
│             FastAPI Backend (Orchestration)            │
│  Auth, Ingestion, Normalization, NMC Engine, Audit     │
└──────────────┬──────────────────────────┬──────────────┘
               │ SQLAlchemy               │ Internal REST / RPC
┌──────────────▼──────────┐ ┌─────────────▼──────────────┐
│   PostgreSQL Database   │ │     ML Inference Layer     │
│ Master Catalogs, Audit, │ │ (Phase 0-5: Mock Engine)   │
│ Traceability Mappings   │ │ (Phase 6+: Real PyTorch)   │
└─────────────────────────┘ └────────────────────────────┘
```

### Key Architectural Invariants:
* **Frontend Isolation:** The frontend never directly accesses PostgreSQL or executes ML inference. All client interactions route strictly through the FastAPI backend.
* **NMC Generation Boundary:** The ML model determines relationships, confidence scores, and feature weights. The ML model **never** generates National Material Codes; code generation is an authoritative backend business logic responsibility.
* **Phased AI Replacement:** The system initially uses a Mock AI Engine that exposes the identical API contract as the future trained PyTorch ML model, ensuring zero frontend rework upon model cutover.

---

## 4. Approved Technology Stack

| Layer | Approved Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React, TypeScript | Enterprise web application framework |
| | Tailwind CSS, shadcn/ui | UI design system and components |
| | Lucide React | Standardized enterprise iconography |
| | Recharts | Cross-CPSE spend and volume analytics |
| | React Flow | Material relationship cluster graphs |
| **Backend** | Python (3.11+), FastAPI | Asynchronous REST API orchestration |
| | Pydantic (v2) | Strict schema validation and contracts |
| | SQLAlchemy (v2), Alembic | Relational ORM and database migrations |
| **Database** | PostgreSQL | Sovereign master data and audit trail storage |
| **Machine Learning** | PyTorch, sentence-transformers | Deep learning semantic representations |
| | scikit-learn, pandas, NumPy | Attribute matching, tabular pipelines |
| **Infrastructure** | Docker, Docker Compose | Reproducible multi-service containerization |
| | Git, GitHub | Version control and collaborative governance |

---

## 5. Repository Structure

```
N-MAT/
│
├── docs/                      # Architectural & phase documentation
│   ├── 00_PROJECT_CONSTITUTION.md
│   └── 01_ENVIRONMENT_AND_REPOSITORY.md
├── frontend/                  # Next.js frontend application (Phase 2)
├── backend/                   # FastAPI backend application (Phase 3)
├── ml/                        # ML inference pipelines & training (Phase 6)
├── data/                      # Dataset samples and schemas
├── models/                    # ML model checkpoints and artifacts
├── scripts/                   # Utility and setup automation scripts
├── docker/                    # Dockerfiles and container initialization scripts
├── project_context.md         # Authoritative project memory and context
├── PROGRESS.md                # Phase-by-phase execution tracking
├── .env.example               # Environment variable template (no secrets)
├── .gitignore                 # Comprehensive repository ignore rules
├── docker-compose.yml         # Containerized development infrastructure
└── README.md                  # Project overview and specifications
```

---

## 6. Phased Development Roadmap

The project follows a strict, sequential milestone structure:

* [x] **Phase 0 — Project Constitution:** Principles, tech stack, architecture boundaries ratified.
* [ ] **Phase 1 — Environment & Repository Setup:** *(Current Phase)* Tooling verification, git initialization, docker foundation.
* [ ] **Phase 2 — Frontend Shell & Design System:** Next.js application shell, enterprise layout, theme, and mock screens.
* [ ] **Phase 3 — Backend Foundation & Database:** FastAPI setup, PostgreSQL models, migrations, and ingestion pipeline.
* [ ] **Phase 4 — Mock AI Engine & Matching Engine:** Deterministic rule-based matching and simulation engine.
* [ ] **Phase 5 — Functional Platform & HITL Console:** Complete end-to-end integration with human review workflow.
* [ ] **Phase 6 — ML Model Development:** Feature extraction, embeddings, and classification model training.
* [ ] **Phase 7 — ML Integration & Model Swap:** Hot-swapping Mock AI engine with trained PyTorch model.
* [ ] **Phase 8 — Analytics & Procurement Intelligence:** Aggregation dashboards, spend insights, and graph visualizations.
* [ ] **Phase 9 — Testing, Security & Hardening:** End-to-end testing, audit trail verification, performance checks.
* [ ] **Phase 10 — Containerized Deployment & Demo Prep:** Final Docker Compose stack and SIH demo rehearsal.

---

## 7. Current Project Status

* **Status:** In Phase 1 (Environment & Repository Setup).
* **Application Features Implemented:** **None** (per Phase 1 rules).
* **Database Tables / Migrations:** **None** created yet.
* **ML Models:** **None** created or trained yet.
* **Active Deliverables:**
  * Constitution ratified: `docs/00_PROJECT_CONSTITUTION.md`
  * Project context established: `project_context.md`
  * Repository initialized with `.gitignore` and `.gitkeep` markers
  * Environment template created: `.env.example`
  * Docker Compose infrastructure initialized: `docker-compose.yml`
  * Phase progress tracking initialized: `PROGRESS.md`

---

## 8. Development Rules & Governance

1. **No Application Features in Phase 1:** All source code development begins only in their respective assigned phases (Frontend in Phase 2, Backend in Phase 3, ML in Phase 6).
2. **Never Commit Secrets:** `.env`, API keys, private certificates, and credentials must never enter version control.
3. **Legacy Code Invariant:** CPSE material codes are never deleted, overwritten, or destroyed.
4. **Human-in-the-Loop Mandate:** Industrial materials are never merged or consolidated without human officer authorization.
5. **Honest Metrics:** Synthetic demo datasets are explicitly labeled as simulated; no false government statistics or fabricated benchmarks.

---

## 9. How the Project Will Eventually Run Locally

*(Note: Application services will be enabled progressively in upcoming phases).*

### Prerequisites (Target Stack)
* Linux / macOS / WSL2 environment
* Docker Engine (24.0+) and Docker Compose (v2+)
* Node.js (v20+ LTS) and npm
* Python (3.11+)

### Target Execution Flow (Phases 3+)
```bash
# 1. Clone repository
git clone <repository-url>
cd N-MAT

# 2. Configure environment
cp .env.example .env

# 3. Start PostgreSQL container foundation
docker compose up -d postgres

# 4. Backend initialization (Phase 3+)
# cd backend && uvicorn app.main:app --reload

# 5. Frontend initialization (Phase 2+)
# cd frontend && npm run dev
```
