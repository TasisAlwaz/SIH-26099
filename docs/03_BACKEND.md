# Phase 3: Backend Foundation & Database Architecture Specification

**Project:** N-MAT — National Material Intelligence Platform  
**SIH Problem Statement:** PS 26099  
**Document ID:** DOC-03-BACKEND  
**Status:** IMPLEMENTED / RATIFIED  
**Current Phase:** Phase 3 (Backend Foundation)

---

## 1. Backend Architecture

The N-MAT backend is constructed with **Python 3.12**, **FastAPI**, **SQLAlchemy 2.0**, **Alembic**, and **PostgreSQL 16**. It acts as the central orchestration, business-logic, and data governance engine.

```
Frontend (Next.js / TypeScript)
       ↓ (HTTP / REST APIs on port 8000)
FastAPI Backend (/api/v1/)
       ↓                                    ↓ (Internal Matching Interface)
PostgreSQL Database                   ML Layer Abstraction (Mock Engine)
(Port 5433, nmat_db)                  (BaseMatchingEngine contract)
```

### Architectural Boundaries & Invariants:
1. **Frontend Isolation:** All master material data, audit logging, and matching requests flow through the FastAPI backend.
2. **Database Authority:** The backend exclusively manages connections, migrations, and transactions with PostgreSQL.
3. **ML Interface Invariant:** The ML model determines relationship classifications (`IDENTICAL`, `DUPLICATE`, `NEAR_DUPLICATE`, `FUNCTIONALLY_EQUIVALENT`, `NOT_EQUIVALENT`) and similarity scores. **The ML layer never assigns National Material Codes.** Code generation is strictly a backend business-logic responsibility.
4. **Zero ML Ingestion in Phase 3:** No heavy ML dependencies (PyTorch, Transformers, sentence-transformers, scikit-learn) are installed. The backend operates strictly with a deterministic Mock AI interface.

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── main.py                   # FastAPI app instance, CORS, lifespan, exception handler
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py             # Pydantic Settings & environment variables
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py            # Master v1 router assembly
│   │       └── endpoints/        # Modular router endpoints
│   │           ├── health.py     # Live diagnostic health check (API & PostgreSQL)
│   │           ├── auth.py       # Authentication routes (foundation)
│   │           ├── cpses.py      # CPSE enterprise management routes
│   │           ├── materials.py  # Material catalog & attribute routes
│   │           ├── matches.py    # AI matching & deduplication routes
│   │           ├── national_materials.py # National Material Master (NMC) routes
│   │           ├── mappings.py   # Legacy CPSE traceability mapping routes
│   │           ├── approvals.py  # Human-in-the-Loop review queue routes
│   │           ├── audit.py      # Governance audit trail routes
│   │           ├── analytics.py  # Spend & harmonization analytics routes
│   │           └── uploads.py    # Catalog ingestion routes
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py               # Metadata registry for Alembic discovery
│   │   ├── base_class.py         # SQLAlchemy DeclarativeBase
│   │   └── session.py            # Engine, sessionmaker, and get_db dependency
│   ├── models/                   # SQLAlchemy ORM models (Phase 4 schema binding)
│   │   └── __init__.py
│   ├── schemas/                  # Pydantic request & response validation schemas
│   │   ├── common.py             # Shared enums (MatchRelationship, ApprovalStatus)
│   │   ├── cpse.py               # CPSE schemas
│   │   ├── material.py           # Material & MaterialAttribute schemas
│   │   ├── match.py              # MatchSignalBreakdown & MaterialMatch schemas
│   │   ├── national_material.py  # NationalMaterial schemas
│   │   ├── mapping.py            # MaterialMapping schemas
│   │   ├── approval.py           # Approval & decision request schemas
│   │   ├── audit.py              # AuditLog schemas
│   │   └── analytics.py          # MetricSummary & ProcurementRecord schemas
│   └── services/                 # Decoupled business logic layer
│       ├── matching_engine.py    # BaseMatchingEngine abstraction & Mock engine
│       ├── material_service.py   # Material catalog service
│       ├── matching_service.py   # Matching pipeline orchestrator
│       ├── national_material_service.py # National Material Master service
│       ├── approval_service.py   # Review queue service
│       ├── audit_service.py      # Immutable audit logging service
│       ├── analytics_service.py  # Procurement analytics service
│       └── upload_service.py     # Catalog upload ingestion service
├── alembic/                      # Database migration environment
│   ├── env.py                    # Dynamic configuration reading settings.sync_database_url
│   ├── script.py.mako            # Migration template
│   └── versions/                 # Migration revision history
├── tests/                        # Pytest suite
│   ├── conftest.py               # TestClient fixture
│   ├── test_config.py            # Settings validation tests
│   ├── test_db.py                # Live PostgreSQL connection tests
│   └── test_health.py            # Health endpoint & router mounting tests
├── alembic.ini                   # Alembic runtime configuration
├── requirements.txt              # Approved backend dependencies
└── README.md                     # Backend local setup & execution guide
```

---

## 3. Python Environment

* **Path:** `backend/.venv/`
* **Python Version:** 3.12.3
* **Isolation:** The virtual environment is ignored by git (`.gitignore`). No packages are installed globally.

---

## 4. Dependencies

Only approved backend dependencies are installed in `backend/requirements.txt`:

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `fastapi` | `0.115.6` | High-performance asynchronous REST API framework |
| `uvicorn[standard]`| `0.34.0` | ASGI production server |
| `pydantic` | `2.10.4` | Data validation and type enforcement |
| `pydantic-settings`| `2.7.0` | Environment variable parsing and type casting |
| `sqlalchemy` | `2.0.36` | Database ORM and SQL toolkit |
| `alembic` | `1.14.0` | Database schema migrations |
| `psycopg[binary]`| `3.2.4` | Modern PostgreSQL driver for Python |
| `python-dotenv` | `1.0.1` | Local environment configuration loading |
| `httpx` | `0.28.1` | Asynchronous HTTP client for testing |
| `pytest` | `8.3.4` | Automated testing framework |

*All ML frameworks (PyTorch, sentence-transformers, scikit-learn, etc.) are omitted in Phase 3.*

---

## 5. Configuration Strategy

Environment variables are managed via Pydantic `BaseSettings` in `backend/app/core/config.py`:
* `API_HOST`: Network bind address (`0.0.0.0`)
* `API_PORT`: Network port (`8000`)
* `API_V1_STR`: API prefix (`/api/v1`)
* `AI_MODE`: Inference toggle defaulting strictly to `"mock"`
* `POSTGRES_USER`: Database username (`postgres`)
* `POSTGRES_PASSWORD`: Database password
* `POSTGRES_HOST`: Database host (`localhost`)
* `POSTGRES_PORT`: Database port (`5433` for isolated container)
* `POSTGRES_DB`: Target database name (`nmat_db`)
* `DATABASE_URL`: Optional complete connection URI (`postgresql+psycopg://...`)

---

## 6. FastAPI Application & Lifespan

The application is defined in `backend/app/main.py`.
* Uses `asynccontextmanager` for clean startup and shutdown events.
* Logs active environment configuration and database targets.
* Serves interactive OpenAPI documentation at `/api/v1/docs`.

---

## 7. API Versioning

All operational routes are mounted under `/api/v1/` to ensure contract stability and backward compatibility.

---

## 8. Database Connection & SQLAlchemy

* **Engine:** Synchronous SQLAlchemy engine configured with `pool_pre_ping=True` and connection pooling (`pool_size=10`, `max_overflow=20`).
* **Driver:** `psycopg` (v3).
* **Session Management:** `SessionLocal` factory with session dependency `get_db()` guaranteeing session disposal via `finally: db.close()`.
* **Declarative Base:** Standardized in `backend/app/db/base_class.py`.

---

## 9. Alembic Migration Architecture

* Initialized in `backend/alembic/`.
* `alembic/env.py` dynamically sources connection strings from `settings.sync_database_url` and tracks `target_metadata = Base.metadata`.
* Verified with `alembic current` with exit code 0.

---

## 10. CORS Configuration

Configured in `backend/app/main.py` using `CORSMiddleware`:
* Permitted origins: `["http://localhost:3000", "http://127.0.0.1:3000"]` (sourced from `settings.BACKEND_CORS_ORIGINS`).
* Wildcard CORS is disabled to adhere to enterprise security standards.

---

## 11. Error Handling & Structured Logging

* Global exception handler catches unhandled exceptions and formats standard JSON error payloads (`{"error": "...", "message": "...", "path": "..."}`) with HTTP 500 status codes.
* Structured logging via Python `logging` with timestamps, log levels, and module identifiers.

---

## 12. Service Layer Architecture

Business logic is strictly decoupled from HTTP route handlers:
* `MaterialService`: Catalog search and attribute queries
* `MatchingService`: Candidate pair generation and AI dispatch
* `NationalMaterialService`: NMC code allocation and legacy mapping
* `ApprovalService`: Human-in-the-Loop review workflows
* `AuditService`: Audit logging
* `AnalyticsService`: Aggregation and spend analytics
* `UploadService`: Staging raw CSV/Excel files

---

## 13. ML Engine Abstraction (Mock vs Real)

Defined in `backend/app/services/matching_engine.py`:
* `BaseMatchingEngine(ABC)`: Defines uniform async methods `analyze_pair()` and `batch_match()`.
* `MockMatchingEngine`: Generates deterministic similarity signals (Description, Specification, Attribute, UOM, Manufacturer) and relationship classifications without loading neural weights.
* `get_matching_engine()`: Resolves engine dynamically; raises `NotImplementedError` if `AI_MODE="real"` is requested prior to Phase 6.

---

## 14. Health Check Verification

`GET /api/v1/health` checks:
* API process liveness
* Live database ping (`SELECT version();`) returning connected status
* AI engine mode report (`mock`)

---

## 15. Testing Suite

Located in `backend/tests/`:
* `test_config.py`: Verifies settings and AI mode default.
* `test_db.py`: Executes live query against PostgreSQL container.
* `test_health.py`: Validates health check payload and all 10 module routers.
* **Test Results:** 5 passed in 0.06s (100% pass rate).

---

## 16. Current Limitations & Next Steps

* Endpoints currently return foundation payloads; database persistence and data models will be bound in Phase 4/5.
* Real ML integration is deferred to Phase 6.
