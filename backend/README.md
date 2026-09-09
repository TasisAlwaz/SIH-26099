# N-MAT Backend Foundation (FastAPI & PostgreSQL)

**Project:** N-MAT — National Material Intelligence Platform (SIH PS 26099)  
**Phase:** Phase 3 — Backend Foundation  
**Runtimes:** Python 3.12+, FastAPI, SQLAlchemy, Alembic, PostgreSQL 16  

---

## 1. Directory Structure

```
backend/
├── app/
│   ├── main.py                   # FastAPI app entry point & lifespan
│   ├── core/
│   │   └── config.py             # Pydantic Settings & environment variables
│   ├── api/
│   │   └── v1/
│   │       ├── api.py            # Master v1 router assembly
│   │       └── endpoints/        # Modular API endpoints (health, materials, etc.)
│   ├── db/
│   │   ├── base.py               # Metadata registry for Alembic
│   │   ├── base_class.py         # SQLAlchemy DeclarativeBase
│   │   └── session.py            # Engine & sessionmaker dependency
│   ├── models/                   # SQLAlchemy ORM models (Phase 3/4)
│   ├── schemas/                  # Pydantic request & response validation schemas
│   └── services/                 # Business logic services & AI engine abstraction
├── alembic/                      # Alembic database migration scripts
├── tests/                        # Pytest suite for API and database tests
├── requirements.txt              # Approved backend package dependencies
└── README.md
```

---

## 2. Local Execution

### Activate Virtual Environment
```bash
source .venv/bin/activate
```

### Run Tests
```bash
pytest -v
```

### Start Local Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

### API Documentation
* Swagger UI: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
* Health Diagnostic: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
