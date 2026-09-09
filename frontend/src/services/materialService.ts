// ==============================================================================
// N-MAT Platform - Data Access & Service Boundary
// Provides an abstraction layer separating UI components from data origin.
// In Phase 2: Resolves from centralized in-memory mock datasets.
// In Phase 3+: Will seamlessly route to FastAPI endpoints (/api/v1/...).
// ==============================================================================

import {
  MOCK_METRICS,
  MOCK_CPSES,
  MOCK_MATERIALS,
  MOCK_MATCHES,
  MOCK_NATIONAL_MATERIALS,
  MOCK_MAPPINGS,
  MOCK_APPROVALS,
  MOCK_AUDIT_LOGS,
  MOCK_PROCUREMENT_RECORDS,
  MOCK_RELATIONSHIP_DISTRIBUTION,
} from "@/data/mock";

import {
  CPSE,
  Material,
  MaterialMatch,
  NationalMaterial,
  MaterialMapping,
  Approval,
  AuditLog,
  ProcurementRecord,
  MetricSummary,
  ApprovalStatus,
  MatchRelationship,
} from "@/types";

// In-memory state for interactive mock actions in the frontend demo
let approvalsState: Approval[] = [...MOCK_APPROVALS];
let matchesState: MaterialMatch[] = [...MOCK_MATCHES];
let auditLogsState: AuditLog[] = [...MOCK_AUDIT_LOGS];

export const materialService = {
  // --- Metrics ---
  async getMetrics(): Promise<MetricSummary> {
    return { ...MOCK_METRICS };
  },

  async getRelationshipDistribution() {
    return [...MOCK_RELATIONSHIP_DISTRIBUTION];
  },

  // --- CPSEs ---
  async getCpses(): Promise<CPSE[]> {
    return [...MOCK_CPSES];
  },

  async getCpseByCode(code: string): Promise<CPSE | undefined> {
    return MOCK_CPSES.find((c) => c.code.toLowerCase() === code.toLowerCase());
  },

  // --- Materials ---
  async getMaterials(params?: {
    query?: string;
    cpse?: string;
    category?: string;
    status?: string;
  }): Promise<Material[]> {
    let list = [...MOCK_MATERIALS];
    if (!params) return list;

    if (params.cpse && params.cpse !== "ALL") {
      list = list.filter((m) => m.cpse.toLowerCase() === params.cpse?.toLowerCase());
    }
    if (params.category && params.category !== "ALL") {
      list = list.filter((m) => m.category.toLowerCase() === params.category?.toLowerCase());
    }
    if (params.status && params.status !== "ALL") {
      list = list.filter((m) => m.status.toLowerCase() === params.status?.toLowerCase());
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (m) =>
          m.legacyCode.toLowerCase().includes(q) ||
          m.rawDescription.toLowerCase().includes(q) ||
          m.normalizedDescription.toLowerCase().includes(q) ||
          (m.nationalMaterialCode && m.nationalMaterialCode.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getMaterialById(id: string): Promise<Material | undefined> {
    return MOCK_MATERIALS.find((m) => m.id === id || m.legacyCode === id);
  },

  // --- Matches ---
  async getMatches(): Promise<MaterialMatch[]> {
    return [...matchesState];
  },

  async getMatchById(id: string): Promise<MaterialMatch | undefined> {
    return matchesState.find((m) => m.id === id);
  },

  // Simulated AI match analysis
  async analyzePair(matAId: string, matBId: string): Promise<MaterialMatch> {
    const matA = MOCK_MATERIALS.find((m) => m.id === matAId) || MOCK_MATERIALS[0];
    const matB = MOCK_MATERIALS.find((m) => m.id === matBId) || MOCK_MATERIALS[1];

    // Check if predefined match exists
    const existing = matchesState.find(
      (m) =>
        (m.materialA.id === matA.id && m.materialB.id === matB.id) ||
        (m.materialA.id === matB.id && m.materialB.id === matA.id)
    );
    if (existing) return existing;

    // Generate dynamic mock match
    const isSameCategory = matA.category === matB.category;
    const confidence = isSameCategory ? 92.5 : 34.0;
    const relationship: MatchRelationship = isSameCategory ? "NEAR_DUPLICATE" : "NOT_EQUIVALENT";

    const newMatch: MaterialMatch = {
      id: `match-dyn-${Date.now()}`,
      materialA: matA,
      materialB: matB,
      confidence,
      relationship,
      status: "PENDING",
      breakdown: {
        descriptionSimilarity: isSameCategory ? 89.0 : 30.0,
        specificationSimilarity: isSameCategory ? 94.0 : 25.0,
        attributeSimilarity: isSameCategory ? 95.0 : 20.0,
        uomCompatibility: matA.uom === matB.uom ? 100.0 : 50.0,
        manufacturerMatch: matA.manufacturer === matB.manufacturer ? 100.0 : 70.0,
      },
      rationale: isSameCategory
        ? [
            `Identical material category: ${matA.category}`,
            `Compatible UOM standard: ${matA.uom}`,
            `Technical parameters align within operational tolerance threshold`,
          ]
        : [
            `Disparate material categories (${matA.category} vs ${matB.category})`,
            `Physical and mechanical incompatibility`,
          ],
      detectedDifferences: isSameCategory
        ? ["Manufacturer variation or slight difference in description length"]
        : ["Fundamental engineering specification mismatch"],
      recommendedNmc: isSameCategory
        ? matA.nationalMaterialCode || `NMC-${matA.category.substring(0, 3).toUpperCase()}-CANONICAL`
        : "N/A",
      createdAt: "Just now",
    };

    matchesState = [newMatch, ...matchesState];
    return newMatch;
  },

  // --- Approvals (HITL Actions) ---
  async getApprovals(): Promise<Approval[]> {
    return [...approvalsState];
  },

  async updateApprovalStatus(
    approvalId: string,
    status: ApprovalStatus,
    reviewer: string,
    notes?: string
  ): Promise<Approval | undefined> {
    const idx = approvalsState.findIndex((a) => a.id === approvalId);
    if (idx === -1) return undefined;

    const item = approvalsState[idx];
    const updated: Approval = {
      ...item,
      status,
      reviewer,
      actionTakenAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      rejectionReason: status === "REJECTED" ? notes || "Rejected during technical review" : undefined,
    };
    approvalsState[idx] = updated;

    // Record in audit log
    const auditEntry: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST",
      user: reviewer,
      role: "CHIEF_PROCUREMENT_OFFICER",
      action: status === "APPROVED" ? "APPROVE_MAPPING" : "REJECT_MAPPING",
      entity: `${item.cpseA}:${item.legacyCodeA} ↔ ${item.cpseB}:${item.legacyCodeB}`,
      oldValue: `Pending AI Recommendation: ${item.relationship} (${item.confidence}%)`,
      newValue: `Officer Decision: ${status} → ${status === "APPROVED" ? item.recommendedNmc : "Segregated"}`,
      decision: status === "APPROVED" ? "APPROVED" : "REJECTED",
      source: "Approval Queue Console",
    };
    auditLogsState = [auditEntry, ...auditLogsState];

    return updated;
  },

  // --- National Materials ---
  async getNationalMaterials(): Promise<NationalMaterial[]> {
    return [...MOCK_NATIONAL_MATERIALS];
  },

  async getNationalMaterialById(id: string): Promise<NationalMaterial | undefined> {
    return MOCK_NATIONAL_MATERIALS.find((n) => n.id === id || n.nationalCode === id);
  },

  async getMappingsForNationalCode(nationalCode: string): Promise<MaterialMapping[]> {
    return MOCK_MAPPINGS.filter((m) => m.nationalMaterialCode === nationalCode);
  },

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    return [...auditLogsState];
  },

  // --- Procurement / Analytics ---
  async getProcurementRecords(): Promise<ProcurementRecord[]> {
    return [...MOCK_PROCUREMENT_RECORDS];
  },
};
