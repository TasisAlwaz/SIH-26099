# Phase 1: Environment & Repository Architecture Specification

**Project:** N-MAT — National Material Intelligence Platform  
**SIH Problem Statement:** PS 26099  
**Document ID:** DOC-01-ENV-REPO  
**Status:** ACTIVE / BASELINE  
**Current Phase:** Phase 1 (Environment & Repository Setup)

---

## 1. Ubuntu Prerequisites

The primary development environment for N-MAT is Linux Ubuntu (tested on Ubuntu 24.04 LTS / 22.04 LTS).

### System Requirements
* **OS:** Ubuntu Linux (x86_64 architecture)
* **Memory:** 16 GB RAM recommended (minimum 8 GB for containerized PostgreSQL + inference services)
* **Disk:** 20 GB free disk space (to support container images, datasets, and local ML environments)
* **Virtualization:** Docker Engine with non-root group access configured (`docker` group)

---

## 2. Required Tools & Audit Status

Development requires the following toolchain. Below is the verified status on the local environment:

| Tool | Required Version | Local Audit Status | Installed Path / Details |
| :--- | :--- | :--- | :--- |
| **git** | >= 2.40 | **Installed** | `/usr/bin/git` (v2.43.0) |
| **gh** | >= 2.30 | **MISSING** | Not installed (Optional for local CLI, recommended for PR management) |
| **node** | >= 20.x (LTS) | **Installed** | `/usr/bin/node` (v24.20.0) |
| **npm** | >= 10.x | **Installed** | `/usr/bin/npm` (v11.19.0) |
| **python3** | >= 3.11 | **Installed** | `/usr/bin/python3` (v3.12.3) |
| **pip** | >= 23.x | **Installed** | `/usr/lib/python3/dist-packages/pip` (v24.0) |
| **python3-venv** | Python 3 standard | **Installed** | `python3 -m venv` functional |
| **docker** | >= 24.x | **Installed** | `/usr/bin/docker` (Docker Engine v29.8.0) |
| **docker compose** | >= v2.20 | **Installed** | Docker Compose v5.5.1 plugin active |
| **psql** | >= 15.x | **Installed** | `/usr/bin/psql` (PostgreSQL client v16.15) |

### Installation Command for Missing Tool (`gh` CLI):
To install GitHub CLI on Ubuntu when approved by the owner:
```bash
# Optional: Install GitHub CLI
type -p curl >/dev/null || sudo apt update && sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y
```

---

## 3. Project Directory Structure

The repository structure matches the approved architecture:

```
/home/blackhelix/Documents/SIH_26099/N-MAT/
│
├── docs/                                # Architecture, specifications & phase documentation
│   ├── 00_PROJECT_CONSTITUTION.md       # Ratified project constitution & invariants
│   └── 01_ENVIRONMENT_AND_REPOSITORY.md # Environment, repository & setup specification
├── frontend/                            # Next.js web application (Phase 2)
│   └── .gitkeep
├── backend/                             # FastAPI application & business logic (Phase 3)
│   └── .gitkeep
├── ml/                                  # ML pipelines & inference logic (Phase 6)
│   └── .gitkeep
├── data/                                # Sample datasets & schema definitions
│   └── .gitkeep
├── models/                              # ML checkpoints (ignored by Git, managed via releases)
│   └── .gitkeep
├── scripts/                             # Operational & automation shell scripts
│   └── .gitkeep
├── docker/                              # Container definitions & DB init scripts
│   └── postgres-init/
│       └── .gitkeep
├── project_context.md                   # Authoritative repository context & roadmap
├── PROGRESS.md                          # Phase execution tracker
├── .gitignore                           # Comprehensive Git exclusion rules
├── .env.example                         # Environment configuration template
├── docker-compose.yml                   # Phase 1 minimal infrastructure (PostgreSQL)
└── README.md                            # Primary project overview
```

---

## 4. Git Strategy

* **Local Repository:** Initialized via `git init` with `main` as the default branch.
* **Tracking Invariant:** Empty directory trees are maintained with standard `.gitkeep` markers.
* **Exclusion Invariant:** Temporary, binary, cache, and sensitive files are excluded via root `.gitignore`.

---

## 5. GitHub Strategy

* **Remote Origin:** Repository to be hosted under authorized GitHub organization / user profile for SIH submission.
* **Pull Request Protection:** All contributions to `main` must pass peer review and validation checks.
* **Release Artifacts:** Model binaries and large data dumps must be published via GitHub Releases or external object storage, never committed to git history.

---

## 6. Branch Strategy

* `main`: Production-ready, stable, and demonstrable milestone releases.
* `develop`: Integration branch for active phase increments.
* `feature/<phase-number>-<feature-name>`: Specific phase task branches (e.g., `feature/p2-frontend-shell`, `feature/p3-backend-fastapi`).
* `fix/<issue-name>`: Targeted bug fixes.

---

## 7. Commit Conventions

Conventional Commits standard is strictly enforced:
* `feat(<scope>): <description>` — New capabilities (e.g., `feat(ingestion): add CSV parser for CPSE catalogs`)
* `fix(<scope>): <description>` — Bug fixes (e.g., `fix(norm): correct pressure rating regex parser`)
* `docs(<scope>): <description>` — Documentation only (e.g., `docs(phase-1): document repository architecture`)
* `chore(<scope>): <description>` — Configuration, dependencies, or environment changes
* `test(<scope>): <description>` — Test additions or modifications
* `refactor(<scope>): <description>` — Code reorganization without functional change

---

## 8. Environment Variables Strategy

* All runtime variables are managed via `.env` loaded at process start.
* The repository contains only `.env.example` with placeholder strings.
* Variable categories:
  1. `APP_ENV`: Execution mode (`development`, `staging`, `production`)
  2. `POSTGRES_*` and `DATABASE_URL`: PostgreSQL connection strings
  3. `BACKEND_*` and `SECRET_KEY`: FastAPI settings and JWT security keys
  4. `AI_MODE`: Inference toggle (`mock` during Phases 0-5; `real` in Phases 6-8)
  5. `NEXT_PUBLIC_*`: Frontend client variables exposed in browser runtime

---

## 9. Secrets Management

* **Zero Secret Policy:** No plain-text passwords, private keys (`*.pem`, `*.key`), or real JWT tokens are permitted in git.
* **Local Developer Safeguard:** `.gitignore` explicitly ignores `.env*` files (except `.env.example`).
* **CI/CD Auditing:** Automated pre-commit checks or git hooks prevent accidental staging of credential files.

---

## 10. Docker Strategy

* **Phase 1 Infrastructure:** A minimal `docker-compose.yml` deploying PostgreSQL 16 on Alpine Linux.
* **Persistence:** Database storage is backed by a named Docker volume (`nmat_postgres_data`).
* **Healthchecks:** Container health is verified using `pg_isready`.
* **Subsequent Phases:** Backend, Frontend, and ML service containers will be introduced in their respective development phases without altering the foundation.

---

## 11. Local Development Strategy

1. **Development Stack:**
   * PostgreSQL runs containerized via Docker Compose.
   * Frontend runs via Node.js dev server (`npm run dev`) during active UI development.
   * Backend runs via Uvicorn hot-reload (`uvicorn app.main:app --reload`) inside a Python virtual environment.
2. **Network Bridge:** Frontend communicates with Backend via `http://localhost:8000`, Backend connects to PostgreSQL on `localhost:5432`.

---

## 12. Backup Strategy

* **Source Code:** Git versioning backed up to remote GitHub repository.
* **Database Master Data:** Automated pg_dump scripts placed under `scripts/backup_db.sh` for development snapshots.
* **Synthetic / Benchmark Datasets:** Canonical raw CSVs preserved in `data/raw/` with read-only permissions.

---

## 13. AI Coding-Agent Rules

1. **Documentation Precedence:** Every agent must inspect `docs/00_PROJECT_CONSTITUTION.md` and `project_context.md` prior to executing code modifications.
2. **Sequential Execution:** Agents must strictly adhere to the designated phase and never proceed ahead of owner approval.
3. **No Unapproved Dependencies:** New packages or external libraries must be explicitly approved before adding to `package.json` or `requirements.txt`.
4. **Runnable State Invariant:** No change should leave the application in a non-compiling or broken state.
5. **No Synthetic Fabrication:** Agents must never invent fake metrics, fake benchmark scores, or pretend mock services are production ML models.

---

## 14. Repository Rules

1. **No Code in Root Directory:** All application code resides in `frontend/`, `backend/`, or `ml/`.
2. **Deterministic Architecture:** The 4-tier layer boundary (Frontend $\rightarrow$ FastAPI $\rightarrow$ PostgreSQL $\rightarrow$ ML) is immutable.
3. **Traceability Preservation:** CPSE legacy codes must never be altered or purged.
4. **Human Review Governance:** Every AI recommendation requires human officer review and sign-off.
