# N-MAT: National Material Intelligence Platform
## Phase 0 — Project Constitution

**Problem Statement:** SIH PS 26099  
**Platform Name:** N-MAT (National Material Intelligence Platform)  
**Document ID:** DOC-00-CONSTITUTION  
**Status:** RATIFIED / ACTIVE  
**Current Phase:** Phase 0 (Project Constitution)

---

## 1. Project Identity & Core Objective

### Identity
* **Project Name:** N-MAT — National Material Intelligence Platform
* **SIH Problem Statement:** PS 26099
* **Domain:** Enterprise / Government Material Intelligence & Master Data Governance

### Core Objective
Build an AI-powered National Unified Material Master platform capable of:
1. Ingesting and analyzing material codes, descriptions, specifications, technical parameters, and procurement information across multiple Central Public Sector Enterprises (CPSEs).
2. Identifying identical, duplicate, near-duplicate, and functionally equivalent materials across disparate CPSE catalogs.
3. Recommending a standardized Common National Material Code (NMC) while strictly preserving complete traceability to every participating CPSE's legacy material code.
4. Enabling human-in-the-loop governance for transparent verification, auditing, and procurement consolidation.

---

## 2. Approved Technology Stack

Only the technologies explicitly listed below are approved for development. No alternative framework, database, or library may be introduced without explicit approval.

| Layer | Approved Technology | Purpose / Notes |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Enterprise React framework for dashboard and workflows |
| | React | Component UI architecture |
| | TypeScript | Strict type safety across client interactions |
| | Tailwind CSS | Utility-first styling for enterprise UI |
| | shadcn/ui | Accessible, high-density enterprise component primitives |
| | Lucide React | Standardized UI iconography |
| | Recharts | Procurement and aggregation analytics charts |
| | React Flow | Visualizing material relationships and cluster graphs |
| **Backend** | Python (3.11+) | Core backend runtimes |
| | FastAPI | High-performance asynchronous REST API framework |
| | Pydantic (v2) | Strict data validation, schema enforcement, and serialization |
| | SQLAlchemy (v2) | Database ORM and relational modeling |
| | Alembic | Database migration management |
| **Database** | PostgreSQL | Relational master storage, ACID transactions, relational mapping |
| **Machine Learning** | Python | ML pipeline and inference execution |
| | pandas | Data manipulation and tabular data preparation |
| | NumPy | Numerical operations and vector calculations |
| | scikit-learn | Feature extraction, traditional similarity metrics, clustering |
| | PyTorch | Deep learning model execution |
| | sentence-transformers | Domain-tuned semantic embeddings for technical descriptions |
| **Infrastructure** | Docker | Containerized environments for reproducible execution |
| | Docker Compose | Multi-container orchestration (Frontend, Backend, DB, ML) |
| | Git | Source control |
| | GitHub | Version control and collaborative code review |

---

## 3. Approved Architecture & Responsibility Boundaries

### Layer Hierarchy
```
Frontend (Next.js / TypeScript)
       ↓ (HTTP / REST APIs)
FastAPI Backend (Orchestration & Business Logic)
       ↓                                    ↓ (Internal RPC / REST)
PostgreSQL Database                   ML Inference Layer (Mock / Real)
```

### Critical Architectural Boundaries
1. **Frontend Isolation:** The frontend must **NEVER** directly execute ML models or directly access the database. All interactions flow strictly through the FastAPI backend.
2. **Backend Responsibilities:**
   * User Authentication & Role-Based Authorization (RBAC)
   * Material catalog ingestion & data validation
   * Text normalization & technical parameter extraction orchestration
   * Matching orchestration & dispatch to the ML inference layer
   * National Material Code (NMC) generation and lifecycle management
   * Legacy CPSE material code mapping and bidirectional traceability
   * Human-in-the-loop review and approval workflows
   * Immutable audit logging and compliance tracking
   * Analytics and aggregated procurement reporting APIs
3. **ML Layer Responsibilities:**
   * Determining material relationship classification
   * Computing confidence scores and attribute-level match signals
   * Providing explainable matching breakdowns
   * **Constraint:** The ML model must **NEVER** directly generate National Material Codes. National code assignment is strictly a business-logic responsibility handled by the backend.

---

## 4. AI/ML Architecture Principles

### Phased AI Delivery (Mock Engine → Real Engine)
* **Initial Phase:** The platform initiates with a **MOCK AI ENGINE** to guarantee end-to-end integration and stability.
* **Interface Parity:** The Mock Engine and the Real Trained ML Engine must adhere to the exact same logical API interface and schema contract.
* **Seamless Replacement:** Switching from mock inference to the trained deep learning model must require zero frontend changes and zero database schema rewrites.

### Target Relationship Classes
The ML model classifies material pairs into exactly five deterministic relationship categories:
1. `IDENTICAL`: Exact match across specifications, standards, and dimensions (differing only in trivial phrasing/spacing).
2. `DUPLICATE`: Same physical item cataloged under duplicate internal references within or across CPSEs.
3. `NEAR_DUPLICATE`: Minor non-critical specification differences (e.g., slight variation in length, finish, or packaging) that require engineering confirmation.
4. `FUNCTIONALLY_EQUIVALENT`: Different materials, makes, or designs that serve the exact same engineering function and can substitute for one another.
5. `NOT_EQUIVALENT`: Distinct materials with incompatible technical attributes or functions.

---

## 5. Core Product Workflow

Every feature must support and reinforce the core product workflow:

```
CPSE Data Upload (CSV / Excel / JSON)
       ↓
Data Validation & Schema Ingestion
       ↓
Normalization (UOM, Standards, Abbreviations)
       ↓
Technical Attribute Extraction (Dimensions, Material Grade, Pressure, Ratings)
       ↓
AI Candidate Matching (Blocking + Semantic + Parameter Matching)
       ↓
Relationship Classification (IDENTICAL | DUPLICATE | NEAR_DUPLICATE | FUNCTIONALLY_EQUIVALENT | NOT_EQUIVALENT)
       ↓
Confidence Scoring & Feature Weighting
       ↓
Explainable Recommendation (Attribute Comparison & Rationale)
       ↓
Human-in-the-Loop Review (Discrepancy Highlighting)
       ↓
Decision Gate: Approve / Reject / Modify
       ↓
Assign Common National Material Code (NMC-*)
       ↓
Establish CPSE Legacy Code Mapping (Preserving Source Reference)
       ↓
Procurement Aggregation (Consolidated Quantities & Spend Analysis)
       ↓
Executive Analytics & Discrepancy Dashboards
       ↓
Immutable Audit Trail Logging
```

---

## 6. Legacy Code Traceability Principle

1. **Non-Destructive Governance:** Existing CPSE material codes must **NEVER** be destroyed, deleted, or silently overwritten.
2. **Traceability Guarantee:** The system guarantees continuous bidirectional lookup:
   CPSE -> Legacy Material Code <-> Common National Material Code (NMC)
3. **Canonical Example:**
   * **IOCL:** `BRG-00142` -> `NMC-BRG-6205-2RS`
   * **NTPC:** `MAT-77891` -> `NMC-BRG-6205-2RS`
   * **SAIL:** `45000621` -> `NMC-BRG-6205-2RS`

---

## 7. Human-in-the-Loop (HITL) Governance Principle

* **AI Recommends, Humans Decide:** AI generates confidence scores, relationship classifications, and rationales. Authorized officers approve, modify, or reject master records.
* **No Blind Auto-Consolidation:** The system must never alter or merge mission-critical industrial material masters automatically based purely on algorithmic outputs.
* **Full Auditability:** Every approval, rejection, override, and comment must be timestamped, attributed to an authenticated user ID, and permanently stored in the audit log.

---

## 8. Data & Honesty Principle

* **Synthetic Data Transparency:** Demo and test datasets may use synthetic or public samples. All synthetic data must be explicitly labeled as demo/simulated data.
* **Zero Fabrication Policy:** The system and team must **NEVER** fabricate:
  * Official government statistics or unverified ministry claims
  * Real CPSE procurement volumes or financial expenditures
  * Exaggerated ML accuracy or benchmark figures
  * Non-existent live SAP/ERP enterprise integrations
  * False claims of active production deployment
  * Fictitious financial savings figures
* **Verification Standard:** Any simulated metric must be clearly surfaced with a "Simulated / Demo" badge in the UI.

---

## 9. MVP Focus Principle

* Prioritize a complete, functional vertical slice over excessive horizontal features.
* The primary evaluation baseline for the SIH demo is:
  Messy CPSE Records -> Upload -> Normalize -> AI Match -> Explain -> Human Review -> National Code -> Legacy Mapping -> Procurement Aggregation -> Dashboard
* Features outside this primary path must never jeopardize the stability or performance of the core vertical slice.

---

## 10. SIH Design & Aesthetics Principle

* The UI must look and feel like a serious, production-grade enterprise/government material intelligence portal (consistent with Indian sovereign digital platforms like GeM, NIC, and enterprise ERP consoles).
* **Anti-Patterns:**
  * Must NOT look like a generic student CRUD project.
  * Must NOT look like an empty template admin dashboard.
  * Must NOT be presented as a simple AI chatbot.
  * Must NOT rely on trivial, naive string-matching algorithms.
* **Key Differentiators:**
  1. Hybrid AI matching (semantic embeddings + rule-based engineering attribute comparison)
  2. Granular parameter-by-parameter comparison tables
  3. Transparent, explainable AI matching rationale
  4. Role-based Human-in-the-loop review workflows
  5. Multi-CPSE legacy code traceability matrices
  6. Cross-enterprise procurement aggregation and potential savings insights
  7. Interactive graph visualization of material clusters and equivalence networks

---

## 11. Development Discipline & Rules

1. **Documentation as Truth:** Documentation defines reality; code implements documentation.
2. **Strict Phased Progression:** Phases must be executed sequentially (Phase 0 -> Phase 1 -> ... -> Phase 10). Skipping phases without explicit sign-off is prohibited.
3. **No Unapproved Technologies:** Every added dependency must strictly match the approved tech stack.
4. **Runnable State Preservation:** The application must compile, build, and remain runnable at each milestone.
5. **Separation of Concerns:** Rigid boundaries between Frontend, Backend, Database, and ML services.
6. **No Speculative Architecture:** Keep implementations simple, robust, and maintainable before optimizing prematurely.
7. **Phase 0 Rule:** No application code, package installations, backend/frontend code, DB migrations, or ML training during Phase 0. Wait for explicit owner approval before advancing to Phase 1.
