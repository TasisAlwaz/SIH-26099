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
  normalizedDescription?: string | null;
  category: string;
  materialGroup?: string;
  family?: string;
  sizeOrRating?: string;
  recordId?: string;
  uom: string;
  manufacturer?: string;
  standard?: string | null; // e.g. "IS 1364", "ASTM A105", "DIN 625"
  materialGrade?: string; // e.g. "SS316", "SS304", "WCB", "CS"
  specifications: Record<string, string>;
  attributes: MaterialAttribute[];
  nationalMaterialCode?: string;
  status: MaterialStatus;
  matchConfidence?: number | null;
  lastUpdated?: string | null;
  historicalSpend?: number;
  historicalQty?: number;
}

export interface MatchSignalBreakdown {
  descriptionSimilarity: number;
  specificationSimilarity: number;
  attributeSimilarity: number;
  uomCompatibility: number;
  manufacturerMatch: number;
  familyCompatibility?: number;
  sizeRatingCompatibility?: number;
  materialGradeCompatibility?: number;
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
  engine?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface NationalMaterial {
  id: string;
  nationalCode: string; // e.g. "NMC-BRG-6205-2RS"
  standardDescription: string;
  category: string;
  materialGroup?: string;
  family?: string;
  equivalenceGroup?: string;
  uom?: string;
  keySpecifications: Record<string, string>;
  participatingCpsesCount: number;
  legacyCodesCount: number;
  totalHistoricalSpend: number;
  totalAnnualQty: number;
  status: "ACTIVE" | "UNDER_REVIEW" | "DEPRECATED";
  createdAt: string;
  updatedAt: string;
  mappedMaterials?: Material[];
}

export interface MaterialMapping {
  id: string;
  nationalMaterialId: string;
  nationalMaterialCode: string;
  cpse: string;
  legacyMaterialCode: string;
  rawDescription: string;
  confidence?: number | null;
  relationship?: MatchRelationship | string | null;
  sourceLabel?: string | null;
  source?: string | null;
  mappedAt?: string | null;
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
  createdAt?: string | null;
  reviewer?: string | null;
  actionTakenAt?: string | null;
  rejectionReason?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp?: string | null;
  user: string;
  role: string;
  action: string;
  entity: string;
  oldValue: string;
  newValue: string;
  decision: string;
  source: string;
}

export interface ProcurementRecord {
  category: string;
  legacyCodesCount: number;
  consolidatedNmcCount: number;
  totalSpendInr?: number | null;
  estimatedHarmonizationBenefitInr?: number | null;
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
  estimatedConsolidationSavingsInr?: number | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadRecord {
  id: string;
  filename: string;
  cpseCode?: string;
  fileType: string;
  status: string;
  rowCount: number;
  processedCount: number;
  errorLog?: string;
  createdAt: string;
  updatedAt: string;
}

