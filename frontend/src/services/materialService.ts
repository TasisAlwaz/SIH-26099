// ==============================================================================
// N-MAT Platform - Data Access & Service Boundary (Phase 5 Live Backend)
// Connects UI components directly to the FastAPI/PostgreSQL backend services.
// Implements seamless fallbacks for offline development/build verification.
// ==============================================================================

import {
  materialsApi,
  cpsesApi,
  nationalMaterialsApi,
  mappingsApi,
  matchesApi,
  approvalsApi,
  auditApi,
  analyticsApi,
  uploadsApi,
} from "@/lib/api";

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
  PaginatedResult,
} from "@/types";

export const materialService = {
  // --- Metrics ---
  async getMetrics(): Promise<MetricSummary> {
    try {
      return await analyticsApi.getMetrics();
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock metrics:", e);
      return { ...MOCK_METRICS };
    }
  },

  async getRelationshipDistribution(): Promise<{ name: string; value: number; color: string; description?: string }[]> {
    try {
      return await analyticsApi.getRelationshipDistribution();
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock distribution:", e);
      return [...MOCK_RELATIONSHIP_DISTRIBUTION];
    }
  },

  // --- CPSEs ---
  async getCpses(): Promise<CPSE[]> {
    try {
      return await cpsesApi.getCpses();
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock CPSEs:", e);
      return [...MOCK_CPSES];
    }
  },

  async getCpseByCode(code: string): Promise<CPSE | undefined> {
    try {
      return await cpsesApi.getCpseById(code);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock CPSE detail:", e);
      return MOCK_CPSES.find((c) => c.code.toLowerCase() === code.toLowerCase());
    }
  },

  // --- Materials ---
  async getMaterialsPaginated(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    cpse?: string;
    category?: string;
    family?: string;
    uom?: string;
    status?: string;
  }): Promise<PaginatedResult<Material>> {
    try {
      return await materialsApi.getMaterials(params);
    } catch (e) {
      console.warn("Backend unavailable, falling back to paginated mock materials:", e);
      let list = [...MOCK_MATERIALS];
      if (params?.cpse && params.cpse !== "ALL") {
        list = list.filter((m) => m.cpse.toLowerCase() === params.cpse?.toLowerCase());
      }
      if (params?.category && params.category !== "ALL") {
        list = list.filter((m) => m.category.toLowerCase() === params.category?.toLowerCase());
      }
      if (params?.status && params.status !== "ALL") {
        list = list.filter((m) => m.status.toLowerCase() === params.status?.toLowerCase());
      }
      if (params?.query) {
        const q = params.query.toLowerCase();
        list = list.filter(
          (m) =>
            m.legacyCode.toLowerCase().includes(q) ||
            (m.normalizedDescription ? m.normalizedDescription.toLowerCase().includes(q) : false)
        );
      }
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 25;
      const offset = (page - 1) * pageSize;
      const paginated = list.slice(offset, offset + pageSize);
      return {
        items: paginated,
        total: list.length,
        page,
        pageSize,
        totalPages: Math.ceil(list.length / pageSize),
      };
    }
  },

  async getMaterials(params?: {
    query?: string;
    cpse?: string;
    category?: string;
    status?: string;
  }): Promise<Material[]> {
    const res = await this.getMaterialsPaginated({
      query: params?.query,
      cpse: params?.cpse,
      category: params?.category,
      status: params?.status,
      page: 1,
      pageSize: 50,
    });
    return res.items;
  },

  async getMaterialById(id: string): Promise<Material | undefined> {
    try {
      return await materialsApi.getMaterialById(id);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock material:", e);
      return MOCK_MATERIALS.find((m) => m.id === id || m.legacyCode === id);
    }
  },

  // --- Matches ---
  async getMatchesPaginated(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    relationship?: string;
  }): Promise<PaginatedResult<MaterialMatch>> {
    try {
      return await matchesApi.getMatches(params);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock matches:", e);
      return {
        items: MOCK_MATCHES,
        total: MOCK_MATCHES.length,
        page: 1,
        pageSize: MOCK_MATCHES.length,
        totalPages: 1,
      };
    }
  },

  async getMatches(): Promise<MaterialMatch[]> {
    const res = await this.getMatchesPaginated({ page: 1, pageSize: 50 });
    return res.items;
  },

  async getMatchById(id: string): Promise<MaterialMatch | undefined> {
    try {
      return await matchesApi.getMatchById(id);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock match detail:", e);
      return MOCK_MATCHES.find((m) => m.id === id);
    }
  },

  async analyzePair(matAId: string, matBId: string): Promise<MaterialMatch> {
    try {
      return await matchesApi.analyzePair(matAId, matBId);
    } catch (e) {
      console.warn("Backend unavailable, generating client simulated match:", e);
      const matA = MOCK_MATERIALS.find((m) => m.id === matAId) || MOCK_MATERIALS[0];
      const matB = MOCK_MATERIALS.find((m) => m.id === matBId) || MOCK_MATERIALS[1];
      return {
        id: `match-dyn-${Date.now()}`,
        materialA: matA,
        materialB: matB,
        confidence: 92.5,
        relationship: "NEAR_DUPLICATE",
        status: "PENDING",
        breakdown: {
          descriptionSimilarity: 89.0,
          specificationSimilarity: 94.0,
          attributeSimilarity: 95.0,
          uomCompatibility: 100.0,
          manufacturerMatch: 100.0,
        },
        rationale: ["Attributes match operational interchangeability tolerance"],
        detectedDifferences: ["Minor catalog terminology difference"],
        recommendedNmc: matA.nationalMaterialCode || "NMC-100139",
        createdAt: "Just now",
      };
    }
  },

  // --- Approvals (HITL Actions) ---
  async getApprovals(status?: string): Promise<Approval[]> {
    try {
      return await approvalsApi.getApprovals(status);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock approvals:", e);
      let list = [...MOCK_APPROVALS];
      if (status && status !== "ALL") {
        list = list.filter((a) => a.status === status);
      }
      return list;
    }
  },

  async updateApprovalStatus(
    approvalId: string,
    status: ApprovalStatus,
    reviewer: string,
    notes?: string
  ): Promise<Approval | undefined> {
    try {
      return await approvalsApi.updateApprovalStatus(approvalId, status, reviewer, notes);
    } catch (e) {
      console.warn("Backend unavailable, updating local mock state:", e);
      const item = MOCK_APPROVALS.find((a) => a.id === approvalId);
      if (!item) return undefined;
      return {
        ...item,
        status,
        reviewer,
        actionTakenAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        rejectionReason: status === "REJECTED" ? notes : undefined,
      };
    }
  },

  // --- National Materials ---
  async getNationalMaterialsPaginated(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    materialGroup?: string;
    family?: string;
  }): Promise<PaginatedResult<NationalMaterial>> {
    try {
      return await nationalMaterialsApi.getNationalMaterials(params);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock national materials:", e);
      return {
        items: MOCK_NATIONAL_MATERIALS,
        total: MOCK_NATIONAL_MATERIALS.length,
        page: 1,
        pageSize: MOCK_NATIONAL_MATERIALS.length,
        totalPages: 1,
      };
    }
  },

  async getNationalMaterials(): Promise<NationalMaterial[]> {
    const res = await this.getNationalMaterialsPaginated({ page: 1, pageSize: 50 });
    return res.items;
  },

  async getNationalMaterialById(id: string): Promise<NationalMaterial | undefined> {
    try {
      return await nationalMaterialsApi.getNationalMaterialById(id);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock national material detail:", e);
      return MOCK_NATIONAL_MATERIALS.find((n) => n.id === id || n.nationalCode === id);
    }
  },

  async getMappingsForNationalCode(nationalCode: string): Promise<MaterialMapping[]> {
    try {
      return await mappingsApi.getMappingsForNationalCode(nationalCode);
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock mappings:", e);
      return MOCK_MAPPINGS.filter((m) => m.nationalMaterialCode === nationalCode);
    }
  },

  // --- Audit Logs ---
  async getAuditLogs(params?: { page?: number; pageSize?: number; query?: string }): Promise<AuditLog[]> {
    try {
      const res = await auditApi.getAuditLogs(params);
      return res.items;
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock audit logs:", e);
      return [...MOCK_AUDIT_LOGS];
    }
  },

  // --- Procurement / Analytics ---
  async getProcurementRecords(): Promise<ProcurementRecord[]> {
    try {
      return await analyticsApi.getProcurementRecords();
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock procurement records:", e);
      return [...MOCK_PROCUREMENT_RECORDS];
    }
  },

  // --- Uploads ---
  async listUploads() {
    try {
      return await uploadsApi.listUploads();
    } catch (e) {
      console.warn("Backend unavailable, returning empty uploads list:", e);
      return [];
    }
  },

  async uploadCatalogFile(file: File, cpseCode?: string) {
    return await uploadsApi.uploadCatalog(file, cpseCode);
  },
};
