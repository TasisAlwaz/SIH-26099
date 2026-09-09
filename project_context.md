# Project Context: N-MAT (National Material Intelligence Platform)

**Problem Statement:** Smart India Hackathon (SIH) — PS 26099  
**Platform Name:** N-MAT (National Material Intelligence Platform)  
**Workspace:** `/home/blackhelix/Documents/SIH_26099/N-MAT`  
**Current Phase:** Phase 0 — Project Constitution (Finalized / Ready for Phase 1 Sign-Off)  
**Last Updated:** Phase 0 Baseline Ratification

---

## 1. Executive Summary & Core Objective

N-MAT is an AI-powered National Unified Material Master platform designed for Indian Central Public Sector Enterprises (CPSEs). Disparate CPSEs (e.g., IOCL, NTPC, SAIL, ONGC, HPCL, BPCL, CPCL) catalog identical or functionally interchangeable engineering spares, valves, bearings, electrical cables, fasteners, and piping components under divergent naming conventions, proprietary material codes, and unstructured descriptions.

### Core Objectives:
1. **Multi-CPSE Ingestion:** Ingest raw material catalogs, legacy item codes, engineering specifications, units of measurement (UOM), and procurement spend data.
2. **AI-Driven Deduplication & Equivalence:** Analyze semantic descriptions, standards (IS, ASTM, DIN, ISO), and technical parameters (dimensions, pressure ratings, material grades) to classify pairs into deterministic relationships.
3. **Common National Material Code (NMC):** Recommend a standardized National Material Code for verified clusters while strictly maintaining bidirectional traceability back to each CPSE's legacy code.
4. **Human-in-the-Loop Governance:** Provide procurement officers and catalog managers with explainable AI recommendations, discrepancy highlights, and approval/rejection gates.
5. **Procurement Intelligence:** Aggregate procurement volumes across CPSEs, identify cross-enterprise pricing disparities, and unlock bulk procurement economies of scale.

---

## 2. Approved Technology Stack

Strict enforcement: No alternative databases, frameworks, or libraries may be added without explicit approval.

* **Frontend:**
  * Framework: Next.js (App Router)
  * Library: React, TypeScript
  * Styling: Tailwind CSS, shadcn/ui
  * Icons: Lucide React
  * Analytics & Charts: Recharts
  * Graph & Relationship Visualization: React Flow
* **Backend:**
  * Language: Python (3.11+)
  * Framework: FastAPI (Asynchronous REST APIs)
  * Data Validation & Settings: Pydantic (v2)
  * ORM: SQLAlchemy (v2)
  * Database Migrations: Alembic
* **Database:**
  * Engine: PostgreSQL
* **Machine Learning:**
  * Runtimes: Python, PyTorch
  * Tabular & Numerical: pandas, NumPy, scikit-learn
  * NLP & Embeddings: sentence-transformers
* **Infrastructure & Tools:**
  * Containerization: Docker, Docker Compose
  * Version Control: Git, GitHub

---

## 3. System Architecture & Component Boundaries

### Hierarchy
```
┌────────────────────────────────────────────────────────┐
│             Frontend (Next.js / TypeScript)            │
│  Interactive UI, Review Gates, Recharts, React Flow    │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼─────────────────────────────┐
│             FastAPI Backend (Orchestration)            │
│  Auth, Ingestion, Normalization, NMC Engine, Audit     │
└──────────────┬──────────────────────────┬──────────────┘
               │ SQLAlchemy               │ Internal REST / RPC
┌──────────────▼──────────┐ ┌─────────────▼──────────────┐
│       PostgreSQL        │ │     ML Inference Layer     │
│ Master Data, Mappings,  │ │ (Phase 0-5: Mock Engine)   │
│ Audit Trail, Spend DB   │ │ (Phase 6+: Real PyTorch)   │
└─────────────────────────┘ └────────────────────────────┘
```

### Critical Boundaries
* **Frontend Isolation:** The frontend never directly queries PostgreSQL or executes ML inference. All requests pass through FastAPI.
* **Backend Responsibility:** Authentication, authorization, file ingestion, text normalization, technical attribute extraction orchestration, matching pipeline orchestration, NMC code generation, legacy mapping, approval workflow, audit logging, and analytics.
* **ML Layer Responsibility:** Determining material relationship, calculating confidence scores, providing feature match weights, and generating explainability signals.
* **NMC Generation Invariant:** The ML model must **NEVER** directly generate or mutate National Material Codes. NMC allocation is an authoritative business-logic duty of the backend.

---

## 4. AI/ML Strategy & Target Classes

### Two-Stage Engine Strategy
* **Stage 1 (Phases 0–5):** MOCK AI ENGINE with deterministic heuristics, rule-based matching, and simulated scoring adhering strictly to the production schema.
* **Stage 2 (Phases 6–8):** Real deep learning model (sentence-transformers embeddings + tabular gradient boosted / rule-based feature verification) trained on CPSE material corpora.
* **Contract Guarantee:** Both engines share identical request/response schemas, enabling hot-swapping without modifying frontend code or core backend routes.

### Deterministic Target Classes
1. `IDENTICAL`: Exact match across engineering specifications, standards, and dimensions (differing only in minor whitespace or formatting).
2. `DUPLICATE`: Same physical item cataloged redundantly under multiple internal records.
3. `NEAR_DUPLICATE`: Minor non-critical variance (e.g., surface coating, length increment) requiring engineering review.
4. `FUNCTIONALLY_EQUIVALENT`: Different makes, specifications, or grades capable of fulfilling the exact same functional role in industrial operations.
5. `NOT_EQUIVALENT`: Incompatible technical parameters, different categories, or distinct physical items.

---

## 5. End-to-End Product Workflow

```
1. CPSE Data Upload (CSV / Excel batch upload)
   ↓
2. Data Validation & Sanitization (Schema check, missing attribute handling)
   ↓
3. Text & Unit Normalization (Standardizing UOM, thread standards, prefixes)
   ↓
4. Technical Attribute Extraction (Dimensions, Material Grade, Pressure, Ratings)
   ↓
5. Candidate Generation & AI Matching (Blocking + Semantic + Parameter Similarity)
   ↓
6. Relationship Classification (5 Deterministic Classes)
   ↓
7. Confidence Score & Explainability Generation (Attribute-by-attribute matching breakdown)
   ↓
8. Human-in-the-Loop Review Queue (Flagged discrepancies, comparison table)
   ↓
9. Officer Decision Gate (Approve, Reject, or Manually Modify)
   ↓
10. National Material Code Assignment (`NMC-XXX-XXXX-XXXX`)
   ↓
11. Bidirectional Legacy Code Mapping (Preserving CPSE source keys)
   ↓
12. Procurement Spend & Inventory Aggregation (Consolidated volumes, price variances)
   ↓
13. Executive Dashboards & Relationship Graphs (React Flow clusters, Recharts analytics)
   ↓
14. Immutable Audit Trail Logging (Timestamp, User ID, Action, Justification)
```

---

## 6. Non-Negotiable Core Principles

1. **Legacy Code Traceability:** CPSE material codes (e.g., IOCL `BRG-00142`, NTPC `MAT-77891`) are never overwritten or deleted. They map bidirectionally to the common NMC (`NMC-BRG-6205-2RS`).
2. **Human-in-the-Loop Governance:** AI recommends, authorized humans approve. Critical industrial procurement decisions must never be automated without human oversight.
3. **Data Integrity & Honesty:** Synthetic data is clearly watermarked. No fabricated government stats, fake ML accuracy claims, or non-existent SAP integrations.
4. **Enterprise/Government Aesthetic:** High-density, professional UI adhering to enterprise standards (GeM / NIC sovereign portal style), avoiding generic student project look-and-feel.
5. **MVP Vertical Slice Focus:** Maintain a clean, runnable, end-to-end demonstrable pipeline above all secondary features.

---

## 7. Phased Development Roadmap

* **Phase 0:** Project Constitution & Governance Rules *(Current Phase - Finalized)*
* **Phase 1:** Environment & Repository Architecture Setup
* **Phase 2:** Frontend Enterprise Shell & Design System
* **Phase 3:** Backend Data Schemas, Database Models & Core Ingestion Engine
* **Phase 4:** Mock AI Engine & Matching Pipeline
* **Phase 5:** Functional Platform Integration & HITL Review Console
* **Phase 6:** ML Model Development & Technical Attribute Extraction
* **Phase 7:** Real ML Integration & Model Swapping
* **Phase 8:** Analytics, Aggregated Procurement & Governance Dashboards
* **Phase 9:** Testing, Performance Validation & Hardening
* **Phase 10:** Production Containerization, Documentation & SIH Live Demo Prep

---

## 8. Development Discipline Constraints

* Sequential phase execution — no skipping phases without explicit user authorization.
* Runnable state preserved after every development milestone.
* Clear separation of concerns among Frontend, Backend, Database, and ML services.
* No application code, package installations, or database migrations in Phase 0.
