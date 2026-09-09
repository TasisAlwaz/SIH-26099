// ==============================================================================
// N-MAT Platform - Centralized TypeScript Domain Interfaces
// ==============================================================================

export type MatchRelationship =
  | "IDENTICAL"
  | "DUPLICATE"
  | "NEAR_DUPLICATE"
  | "FUNCTIONALLY_EQUIVALENT"
  | "NOT_EQUIVALENT";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED";

export type MaterialStatus = "STANDARDIZED" | "PENDING_REVIEW" | "UNMATCHED" | "FLAGGED";

export interface CPSE {
  id: string;
  code: string; // e.g. "IOCL", "NTPC", "SAIL", "ONGC", "HPCL", "BPCL", "CPCL", "GAIL", "BHEL"
  name: string;
  category: "Maharatna" | "Navratna" | "Miniratna";
  ministry: string;
  materialsImported: number;
  materialsStandardized: number;
  matchCandidates: number;
  approvedMappings: number;
  lastSynchronization: string;
  status: "ACTIVE" | "SYNCING" | "ERROR";
}

export interface MaterialAttribute {
  key: string;
  name: string;
  value: string | number;
  unit?: string;
  isStandardized?: boolean;
}

export interface Material {
  id: string;
  cpse: string;
  legacyCode: string;
  rawDescription: string;
  normalizedDescription: string;
  category: "Bearing" | "Valve" | "Fastener" | "Electrical" | "Piping" | "Rotating Equipment" | "Sealing";
  uom: string;
  manufacturer?: string;
  standard?: string; // e.g. "IS 1364", "ASTM A105", "DIN 625"
  materialGrade?: string; // e.g. "SS316", "SS304", "WCB", "CS"
  specifications: Record<string, string>;
  attributes: MaterialAttribute[];
  nationalMaterialCode?: string;
  status: MaterialStatus;
  matchConfidence?: number;
  lastUpdated: string;
  historicalSpend?: number;
  historicalQty?: number;
}

export interface MatchSignalBreakdown {
  descriptionSimilarity: number;
  specificationSimilarity: number;
  attributeSimilarity: number;
  uomCompatibility: number;
  manufacturerMatch: number;
}

export interface MaterialMatch {
  id: string;
  materialA: Material;
  materialB: Material;
  confidence: number; // 0 to 100
  relationship: MatchRelationship;
  status: ApprovalStatus;
  breakdown: MatchSignalBreakdown;
  rationale: string[];
  detectedDifferences: string[];
  recommendedNmc: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface NationalMaterial {
  id: string;
  nationalCode: string; // e.g. "NMC-BRG-6205-2RS"
  standardDescription: string;
  category: string;
  keySpecifications: Record<string, string>;
  participatingCpsesCount: number;
  legacyCodesCount: number;
  totalHistoricalSpend: number;
  totalAnnualQty: number;
  status: "ACTIVE" | "UNDER_REVIEW" | "DEPRECATED";
  createdAt: string;
  updatedAt: string;
}

export interface MaterialMapping {
  id: string;
  nationalMaterialId: string;
  nationalMaterialCode: string;
  cpse: string;
  legacyMaterialCode: string;
  rawDescription: string;
  confidence: number;
  relationship: MatchRelationship;
  mappedAt: string;
  approvedBy: string;
}

export interface Approval {
  id: string;
  matchId: string;
  cpseA: string;
  legacyCodeA: string;
  descriptionA: string;
  cpseB: string;
  legacyCodeB: string;
  descriptionB: string;
  relationship: MatchRelationship;
  confidence: number;
  status: ApprovalStatus;
  recommendedNmc: string;
  createdAt: string;
  reviewer?: string;
  actionTakenAt?: string;
  rejectionReason?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: "CHIEF_PROCUREMENT_OFFICER" | "CATALOG_MASTER_ADMIN" | "DATA_ENGINEER" | "SYSTEM_AUDITOR";
  action: "APPROVE_MAPPING" | "REJECT_MAPPING" | "MODIFY_MAPPING" | "MANUAL_MERGE" | "CATALOG_INGEST" | "SYSTEM_NORMALIZATION";
  entity: string;
  oldValue: string;
  newValue: string;
  decision: "APPROVED" | "REJECTED" | "MODIFIED" | "TRIGGERED";
  source: string; // e.g. "AI Match Center", "Manual Review Queue", "Automated Batch Ingestion"
}

export interface ProcurementRecord {
  category: string;
  legacyCodesCount: number;
  consolidatedNmcCount: number;
  totalSpendInr: number;
  estimatedHarmonizationBenefitInr: number;
  rationalizationRatio: number; // e.g. 0.42 (42% code reduction)
}

export interface MetricSummary {
  totalMaterials: number;
  materialsAnalyzed: number;
  duplicateCandidates: number;
  approvedMatches: number;
  nationalMaterials: number;
  cpsesConnected: number;
  pendingReviews: number;
  potentiallyRationalizableCodes: number;
  estimatedConsolidationSavingsInr: number;
}
