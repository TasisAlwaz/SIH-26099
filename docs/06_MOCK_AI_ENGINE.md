# N-MAT Phase 6 — Mock AI & Matching Experience

**Project:** N-MAT — National Material Intelligence Platform (SIH Problem Statement 26099)  
**Document Version:** 1.0.0  
**Phase:** 6 — Mock AI & Matching Experience  
**Status:** COMPLETE (Awaiting Project Owner Sign-Off for Phase 7)

---

## 1. Executive Summary & Purpose

Phase 6 implements a comprehensive, transparent, and deterministic **Mock Matching Experience** for the N-MAT platform. 

The primary objective of this phase is to establish the full end-to-end user and system experience for AI-powered material matching, deduplication, and cross-CPSE standardization **without yet introducing heavy machine learning packages or training ML models**.

This mock experience satisfies all functional and demonstration requirements:
1. **Interactive Material Pair Comparison:** Real-time side-by-side analysis of two distinct CPSE legacy materials.
2. **Multi-Signal Heuristic Analysis:** A deterministic 8-signal engineering rules engine evaluating catalog records.
3. **5-Class Relationship Categorization:** Transparent classification into `IDENTICAL`, `DUPLICATE`, `NEAR_DUPLICATE`, `FUNCTIONALLY_EQUIVALENT`, and `NOT_EQUIVALENT`.
4. **Transparent Explainability:** Plain-language rationale explaining *why* the match was determined, accompanied by structured key technical differences.
5. **Human-in-the-Loop Review Gate:** Mandatory workflow allowing authorized officers to Approve, Reject, or Modify recommendations with custom roles and notes.
6. **Sovereign Legacy Code Preservation:** Zero mutations to enterprise legacy codes.
7. **Strict Boundary Control:** Zero real ML dependencies (`torch`, `transformers`, `sentence-transformers`, `faiss`, `scikit-learn`, `pandas`, `numpy`).

---

## 2. Architectural Design & Separation of Concerns

The matching architecture follows an extensible Strategy Pattern designed for hot-swappable inference:

```text
               ┌──────────────────────────────┐
               │    Next.js UI (/matches)     │
               └──────────────┬───────────────┘
                              │ REST API POST /matches/analyze
               ┌──────────────▼───────────────┐
               │     FastAPI Router Layer     │
               │ (endpoints/matches.py)       │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │       MatchingService        │
               │ (services/matching_service)  │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │     BaseMatchingEngine       │ (Abstract Interface)
               │ (services/matching_engine)   │
               └──────────────┬───────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────▼──────────────┐             ┌──────────▼──────────────┐
│  MockMatchingEngine    │             │  NeuralMatchingEngine   │
│  (Phase 6 Active Mode) │             │  (Phase 8 Future Mode)  │
│  Deterministic Rules   │             │  PyTorch / Bi-Encoder   │
└────────────────────────┘             └─────────────────────────┘
```

### 2.1 Factory Pattern (`get_matching_engine()`)
The backend instantiates the matching engine via a centralized factory in `backend/app/services/matching_engine.py`. When `AI_ENGINE_MODE=MOCK` (default in development and demo environments), it returns an instance of `MockMatchingEngine`. In Phase 8, this factory will seamlessly switch to `NeuralMatchingEngine` when `AI_ENGINE_MODE=ML` without modifying client code or API contracts.

### 2.2 Idempotency & Database Persistence
When two materials are analyzed:
1. The service checks PostgreSQL for an existing comparison between the pair (regardless of order: A-vs-B or B-vs-A).
2. If found, it returns the persisted match record immediately, ensuring deterministic stability.
3. If new, it evaluates the pair through the heuristic engine, records a `matches` table entry, stages a corresponding `approvals` queue entry, and commits an `audit_logs` record with `action="ANALYZE_MATCH"` and `source="MATCHING_ENGINE_SERVICE"`.

---

## 3. The 8 Matching Signals & Heuristic Scoring

The `MockMatchingEngine` evaluates 8 multi-attribute engineering signals. Each signal produces a normalized score between `0.0` and `1.0`:

| Signal Name | Weight | Evaluation Method & Rules |
| :--- | :---: | :--- |
| **Description Similarity** | `0.25` | Composite of Token Jaccard Similarity (0.50 weight) and Character SequenceMatcher Ratio (0.50 weight) over cleaned, uppercase catalog strings. |
| **Specification Similarity** | `0.15` | Compares structured key-value specification dictionaries (if present) or falls back to text ratio across specification fields. |
| **Category & Family Compatibility** | `0.15` | `1.0` if both category and family match exactly; `0.85` if family matches; `0.50` if category matches but family diverges; `0.0` if categories conflict. |
| **UOM Compatibility** | `0.10` | Evaluates physical units against canonical equivalence sets: `{NOS, EA, PCS, UNIT, NUMBER}`, `{MTR, METRE, METER, M}`, `{KG, KGS, KILOGRAM}`, `{LTR, LITRE, L}`, `{SET, PAIR}`. Returns `1.0` for identical or equivalent units, `0.0` for dimension mismatches. |
| **Size / Rating Compatibility** | `0.10` | Extracts standard dimensional tokens (e.g. `2"`, `2 INCH`, `DN50`, `150#`, `PN16`, `M16`) and compares numeric values and rating classes. Returns `1.0` if identical, `0.0` if conflicting sizes are detected. |
| **Material Grade Compatibility** | `0.10` | Evaluates metallurgical equivalence groups (e.g. `{SS304, AISI304}`, `{SS316, AISI316}`, `{CS, CARBON STEEL, A105, WPB}`, `{MS, MILD STEEL, IS2062}`). Returns `1.0` for exact grade match, `0.85` for metallurgical alias, `0.40` for general ferrous family, and `0.0` for grade clash. |
| **Manufacturer Similarity** | `0.05` | Compares OEM names. If both specify identical OEMs, returns `1.0`. If one or both are generic/unspecified, returns `0.70`. If distinct conflicting OEMs are identified (e.g., Audco vs L&T), returns `0.30`. |
| **Attribute Similarity** | `0.10` | Composite metric aggregating size compatibility, material grade compatibility, and manufacturer alignment. |

**Sum of Signal Weights:** `0.25 + 0.15 + 0.15 + 0.10 + 0.10 + 0.10 + 0.05 + 0.10 = 1.00`.

### 3.1 Hard Penalty Caps
To prevent false-positive matches between fundamentally incompatible items, the engine applies hard penalty ceilings to the aggregate score:
- **Category Clashes:** If category similarity is `0.0`, the final confidence is capped at a maximum of `30.0%`.
- **UOM Clashes:** If unit of measure similarity is `0.0` (e.g., kilograms vs meters), confidence is capped at `45.0%`.
- **Grade Clashes:** If material grades are explicitly conflicting (e.g., Stainless Steel 316 vs Carbon Steel A105), confidence is capped at `78.0%`.

---

## 4. Relationship Classification Logic

The engine deterministically classifies every evaluated pair into one of five standardized relationships:

```text
                          Aggregate Confidence Score
                       ┌───────────────┴───────────────┐
                       ▼                               ▼
                 Score >= 95%                    Score < 95%
                       │                               │
             ┌─────────┴─────────┐                     │
             ▼                   ▼                     │
       Identical Text      Distinct Text               │
        & Attributes        & Attributes               │
             │                   │                     │
             ▼                   ▼                     ▼
        [IDENTICAL]         [DUPLICATE]          Score >= 80%?
                                                ┌──────┴──────┐
                                               YES            NO
                                                │             │
                                                ▼             ▼
                                         [NEAR_DUPLICATE]   Score >= 60%?
                                         (Or OEM Divergence)┌─┴─┐
                                                           YES  NO
                                                            │   │
                                                            ▼   ▼
                                               [FUNCTIONALLY_  [NOT_EQUIVALENT]
                                                 EQUIVALENT]
```

1. **`IDENTICAL`:**
   - Heuristic score $\ge 95.0\%$ with identical cleaned descriptions and identical OEM/grade attributes, OR identical legacy codes across plants.
   - Example: Same item cataloged identically across IOCL and NTPC.
2. **`DUPLICATE`:**
   - Heuristic score $\ge 90.0\%$ with identical engineering specifications, UOM, and size, but minor wording variations in catalog descriptions.
   - Example: `"BALL VALVE 2 INCH SS316 150#"` vs `"VALVE BALL 2 IN SS316 #150 FLANGED"`.
3. **`NEAR_DUPLICATE`:**
   - Heuristic score between $80.0\%$ and $89.9\%$, OR items with identical technical specifications and dimensions but manufactured by different OEMs (e.g., Audco vs L&T).
   - Example: Identical 2" 150# SS316 ball valves from competing manufacturers.
4. **`FUNCTIONALLY_EQUIVALENT`:**
   - Heuristic score between $60.0\%$ and $79.9\%$. Items share the same functional family and application but vary in metallurgy, pressure rating, or sub-component design.
   - Example: Gate Valve 2" CS 150# vs Ball Valve 2" SS316 150#.
5. **`NOT_EQUIVALENT`:**
   - Heuristic score $< 60.0\%$ or category/UOM mismatch. Items cannot substitute for one another.
   - Example: Ball Valve vs Lubricating Grease EP-2.

---

## 5. Transparent Explainability & Differences Detection

To build trust with public sector procurement executives, the engine outputs human-readable rationale and structured differences:

### 5.1 Explainable Rationale
The engine generates clear, concise bullet points highlighting the multi-attribute factors driving the verdict:
- `"Deterministic mock heuristic engine evaluated catalog attributes."`
- `"Descriptions share high token overlap: 'VALVE', 'BALL', 'SS316', '150#'."`
- `"Compatible physical unit of measure detected: 'NOS' ≈ 'EA'."`
- `"Identical engineering dimension confirmed: '2 INCH'."`
- `"Equivalent metallurgical grade identified: 'SS316'."`

### 5.2 Detected Technical Differences
When variances exist between records, they are surfaced in an alert card:
- `"Material Grade: SS316 vs CS A105"`
- `"Manufacturer / OEM: Audco vs L&T"`
- `"Catalog Description: BALL VALVE 2 INCH SS316 150# vs GATE VALVE 2 INCH CS 150#"`

---

## 6. Standardization Recommendations & Data Governance

### 6.1 National Material Code (NMC) Recommendation Rules
- If either material item already possesses an approved National Material Code in the master database, that existing NMC is proposed for harmonization.
- If neither item has an existing mapped code, the engine returns:
  `"DEMO RECOMMENDATION: NMC PENDING REVIEW"`
- The engine **never** invents fake or non-existent NMC identifiers. All final code allocations require human review sign-off.

### 6.2 Legacy Code Immutability (Sovereign Data Governance)
Under Section 18.16 of the N-MAT Constitution:
- CPSE legacy material codes are sovereign assets belonging to individual enterprises.
- Matching and harmonization **must never overwrite, truncate, or alter** an enterprise's legacy code.
- Mappings link legacy codes to National Material Codes bidirectionally while leaving source records intact.

---

## 7. Mandatory Human-in-the-Loop Review Workflow

AI and heuristic recommendations are non-binding suggestions. Every match analysis stages a record in the Human-in-the-Loop review queue:

```text
┌──────────────────────┐
│ Candidate Match      │
│ (Status: PENDING)    │
└──────────┬───────────┘
           │
           ├───────────────────────────────┬───────────────────────────────┐
           ▼                               ▼                               ▼
    [APPROVE MATCH]                 [REJECT MATCH]                 [MODIFY MATCH]
           │                               │                               │
           ▼                               ▼                               ▼
- Status -> APPROVED            - Status -> REJECTED            - Status -> MODIFIED
- Reviewer: Officer Name        - Reviewer: Officer Name        - Reclassified Relationship
- Notes: Verification log       - Notes: Rejection reason       - Notes: Engineering justification
- Audit: APPROVE_MAPPING        - Audit: REJECT_MAPPING         - Audit: MODIFY_MAPPING
```

### Review Dialog & Modal
The UI at `/matches` and `/approvals` provides a confirmation modal allowing the officer to enter:
1. Reviewer Name (e.g. `"R. K. Sharma"`)
2. Reviewer Role (e.g. `"Chief Material Manager"`, `"Lead Standardization Engineer"`)
3. Reviewer Notes / Justification

---

## 8. Why This Is NOT a Trained ML Model

It is vital to maintain complete technical transparency regarding the current Phase 6 engine:
1. **Rule-Based Heuristic, Not Statistical Learning:** Similarity scores are derived from mathematical token overlap, sequence matching, and metallurgical lookup dictionaries. No model weights were trained or adjusted via gradient descent.
2. **Deterministic Outputs:** Given the same two input materials, the output confidence and breakdown are 100% reproducible and invariant.
3. **No Embeddings or Vector Index:** No high-dimensional vector representations or cosine distance computations are performed.
4. **No Heavy Dependencies:** The engine uses standard Python library modules (`difflib`, `re`, `json`) without importing `torch`, `transformers`, or `scikit-learn`.

---

## 9. Phase 7 & Phase 8 Roadmap

| Phase | Planned Implementation | Dependencies |
| :---: | :--- | :--- |
| **Phase 7** | **ML Training Pipeline (Google Colab):**<br>• Fine-tune a Siamese Bi-Encoder (MiniLM / DeBERTa) on `data/raw/cpse_material_matching_training_synthetic.csv` (31,400 rows).<br>• Output quantized PyTorch / ONNX model weights and evaluation metrics. | GPU Environment (Colab), `sentence-transformers`, `torch`. |
| **Phase 8** | **Model Serving & Hot-Swap:**<br>• Implement `NeuralMatchingEngine(BaseMatchingEngine)` in backend.<br>• Hot-swap `MockMatchingEngine` via `AI_ENGINE_MODE=ML`.<br>• Maintain existing REST API schemas (`breakdown`, `rationale`, `engine`). | Pre-trained model weights from Phase 7. |

---

## 10. Verification & Test Summary

- **Backend Pytest Suite:** 32 tests executed in 0.98 seconds (**100% pass rate**).
  - Validated self-comparison rejection (HTTP 400).
  - Validated deterministic match evaluation and idempotency.
  - Validated all 5 relationship classes (`IDENTICAL`, `DUPLICATE`, `NEAR_DUPLICATE`, `FUNCTIONALLY_EQUIVALENT`, `NOT_EQUIVALENT`).
  - Validated all 8 signal breakdown attributes and explainability generation.
  - Validated audit trail recording (`ANALYZE_MATCH`).
  - Validated CPSE legacy code retention across matching and review lifecycle.
- **Frontend Next.js Build:** `npm run build` compiled 14 of 14 static and dynamic routes with **0 TypeScript and 0 lint errors**.
