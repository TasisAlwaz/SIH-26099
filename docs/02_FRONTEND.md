# Phase 2: Frontend Architecture & UI Implementation Specification

**Project:** N-MAT — National Material Intelligence Platform  
**SIH Problem Statement:** PS 26099  
**Document ID:** DOC-02-FRONTEND  
**Status:** IMPLEMENTED / RATIFIED  
**Current Phase:** Phase 2 (Frontend Foundation)

---

## 1. Executive Summary & Architecture

The N-MAT frontend is an enterprise-grade web console built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui design patterns**, **Lucide React**, **Recharts**, and **React Flow**.

It serves as the unified interface for Central Public Sector Enterprise (CPSE) procurement officers, catalog managers, and government auditors to review multi-source inventory catalogs, inspect AI deduplication recommendations, and establish non-destructive bidirectional mappings to standardized Common National Material Codes (NMC).

### Layer Isolation Guarantees (Phase 2 Invariants)
* **Zero Backend Connection:** In Phase 2, the frontend does not connect to a live FastAPI instance, PostgreSQL database, or remote ML inference service.
* **Service Boundary:** All pages and components query a decoupled data-access service layer (`src/services/materialService.ts`). When the FastAPI backend is launched in Phase 3+, only this service adapter will be modified to make real `fetch()` calls without refactoring the UI component tree.
* **Honest Demonstration Badge:** A persistent sovereign notice banner and watermarking badges clearly label all data and metrics as synthetic/simulated for SIH evaluation.

---

## 2. Directory Structure

```
frontend/
├── package.json                   # Dependencies (Next.js 14, React 18, Recharts, React Flow)
├── tsconfig.json                  # Strict TypeScript configuration with @/* path aliases
├── tailwind.config.ts             # Enterprise color palette and typography tokens
├── postcss.config.mjs             # Tailwind & Autoprefixer plugin configuration
├── next.config.mjs                # Next.js App Router configuration
├── public/                        # Static assets & brand icons
└── src/
    ├── app/                       # Next.js App Router routes & layouts
    │   ├── layout.tsx             # Root layout with AppLayout wrapper & metadata
    │   ├── page.tsx               # Root redirect to /dashboard
    │   ├── globals.css            # Base Tailwind layers & enterprise scrollbars
    │   ├── dashboard/page.tsx     # National Dashboard & KPI telemetry
    │   ├── materials/             # Material Master Explorer
    │   │   ├── page.tsx           # Searchable, filterable CPSE material catalog
    │   │   └── [id]/page.tsx      # Granular technical specification & mapping history
    │   ├── matches/page.tsx       # Core AI Match Center (interactive inference demo)
    │   ├── approvals/page.tsx     # Human-in-the-Loop review queue & decision gate
    │   ├── national-materials/    # Standardized National Materials (NMC)
    │   │   ├── page.tsx           # Unified master records table
    │   │   └── [id]/page.tsx      # Multi-CPSE bidirectional traceability graph
    │   ├── cpses/page.tsx         # CPSE enterprise status & catalog volume
    │   ├── upload/page.tsx        # Multi-stage catalog upload simulator
    │   ├── analytics/page.tsx     # Recharts spend harmonization analytics
    │   ├── audit/page.tsx         # Cryptographically traceable audit log
    │   └── settings/page.tsx      # System preferences & explicit "AI Mode: MOCK" flag
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx      # Responsive desktop/mobile shell
    │   │   ├── Sidebar.tsx        # 10-module operational sidebar with active states
    │   │   └── TopBar.tsx         # Sovereign header, search, AI mode pill, user role
    │   └── ui/
    │       ├── StatusBadge.tsx     # Badges for 5 match classes and approval states
    │       ├── ConfidenceBadge.tsx # High/Medium/Low score pills with colored pips
    │       ├── MetricCard.tsx      # Standardized metric cards with trends & icons
    │       ├── PageHeader.tsx      # Uniform header with title, subtitle & action slots
    │       ├── LoadingState.tsx    # Accessible loading spinner and feedback text
    │       ├── EmptyState.tsx      # Filter reset and empty queue fallback state
    │       └── WatermarkBadge.tsx  # "DEMO DATA" transparency banner and badges
    ├── data/
    │   └── mock/index.ts          # Centralized synthetic datasets (84k mock scale)
    ├── services/
    │   └── materialService.ts     # Data-access layer simulating backend responses
    ├── types/
    │   └── index.ts               # Strict TypeScript domain interfaces
    └── lib/
        └── utils.ts               # Class merging (cn) and Indian Rupee / number formatting
```

---

## 3. Implemented Routes & Capabilities

| Route | Module Name | Primary Features & UI Elements |
| :--- | :--- | :--- |
| `/dashboard` | **National Dashboard** | 8 KPI cards, Recharts relationship distribution pie, CPSE volume bar chart, Before/After rationalization flow, recent AI recommendations table. |
| `/materials` | **Material Explorer** | Search by description/code, multi-select CPSE & category filters, status filters, dense tabular view, navigation to detail records. |
| `/materials/[id]`| **Material Detail** | Deep inspection of raw vs normalized description, granular attribute table (bore, OD, width, grade), and CPSE legacy lineage. |
| `/matches` | **AI Match Center** | Core intelligence showcase: Preset & custom pair selection, "Analyze Match" simulation, 5-vector similarity breakdown, explainability ("WHY THIS MATCH?"), and mock Approve/Reject gates. |
| `/approvals` | **Approval Queue** | Human-in-the-Loop review queue, status filters (Pending, Approved, Rejected), officer decision buttons with inline state updates and audit dispatch. |
| `/national-materials` | **National Master** | Table of standardized National Material Codes (`NMC-*`), participating CPSE count, legacy codes count, and spend aggregation. |
| `/national-materials/[id]` | **Traceability Matrix**| Visual convergence graph linking central NMC node to individual CPSE legacy codes (`BRG-00142`, `MAT-77891`, `45000621`), guaranteeing non-destructive mapping. |
| `/cpses` | **CPSE Management** | Cards for 8 enterprises (IOCL, NTPC, SAIL, HPCL, BPCL, CPCL, GAIL, BHEL) showing catalog sync times, imported items, and standardization progress. |
| `/upload` | **Data Upload** | 5-stage ingestion simulator (File selection $\rightarrow$ Validation $\rightarrow$ Column detection $\rightarrow$ Normalization preview $\rightarrow$ Ingestion gate). |
| `/analytics` | **Analytics** | Category spend comparison, rationalization trend curve, AI confidence distribution histogram, estimated economic savings. |
| `/audit` | **Audit Trail** | Immutable log tracking officer decisions, timestamp, role, before/after values, and originating subsystem. |
| `/settings` | **Settings** | Authenticated CPO profile, display density selector, and prominent active flag: `AI MODE: MOCK`. |

---

## 4. Design System & Visual Language

* **Enterprise Credibility:** Deep Navy (`#0f172a`, `#1e293b`), Slate neutral backgrounds (`#f8fafc`), and Sovereign Blue accents (`#0284c7`, `#2563eb`).
* **Deterministic Status Colors:**
  * `IDENTICAL`: Emerald (`#059669`)
  * `DUPLICATE`: Amber (`#d97706`)
  * `NEAR_DUPLICATE`: Violet / Indigo (`#6366f1`)
  * `FUNCTIONALLY_EQUIVALENT`: Cyan / Sky (`#0891b2`)
  * `NOT_EQUIVALENT`: Rose (`#e11d48`)
* **Typography:** Clean sans-serif with monospace font for identifiers (`NMC-BRG-6205-2RS`, `MAT-77891`).
* **High Information Density:** Dense tables with custom scrollbars, minimal padding, and clear hierarchy tailored for enterprise operators.

---

## 5. Mock Data & Centralized Service Boundary

* **Centralized Data:** Stored exclusively in `src/data/mock/index.ts`. No hardcoded strings scattered in UI components.
* **Domain Realism:** Realistic industrial engineering components (Deep groove bearings 6205-2RS, API 6D Class 300# valves, IS 7098 1100V copper cables, M8x40 SS304 fasteners, and API 676 positive displacement pumps).
* **Service Abstraction:** Components call methods on `materialService` (`getMaterials`, `analyzePair`, `updateApprovalStatus`, `getNationalMaterials`). This allows future API endpoints to be connected with zero component modifications.

---

## 6. Accessibility & Responsive Strategy

* **Accessibility:** Semantic HTML `<header>`, `<aside>`, `<main>`, `<table>`, `<th>`, `<button>`. High-contrast text exceeding WCAG AA standards.
* **Responsive Breakpoints:**
  * Mobile (`< 768px`): Drawer sidebar with slide-out animation and backdrop overlay; stacked metric cards and scrollable tables.
  * Tablet (`768px - 1024px`): 2-column metric cards, responsive search inputs.
  * Desktop (`> 1024px`): Permanent fixed sidebar, multi-column analytics grid, side-by-side AI match comparison.

---

## 7. Current Limitations & Phase 3 Transition Plan

* **Mock AI Inference:** Match results are dynamically resolved using heuristic scoring and predefined test vectors.
* **In-Memory State:** Approvals and uploads mutate local memory; refreshing resets to baseline.
* **Next Steps for Phase 3:** Launch FastAPI backend, define SQLAlchemy schemas for PostgreSQL, and replace `materialService` in-memory methods with authenticated REST calls.
