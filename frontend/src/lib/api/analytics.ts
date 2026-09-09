import { apiClient } from "./client";
import { MetricSummary, ProcurementRecord } from "@/types";

export interface RelationshipDistributionItem {
  name: string;
  value: number;
  color: string;
  description: string;
}

export const analyticsApi = {
  getMetrics(): Promise<MetricSummary> {
    return apiClient.get<MetricSummary>("/analytics/metrics");
  },

  getRelationshipDistribution(): Promise<RelationshipDistributionItem[]> {
    return apiClient.get<RelationshipDistributionItem[]>(
      "/analytics/relationship-distribution"
    );
  },

  getProcurementRecords(): Promise<ProcurementRecord[]> {
    return apiClient.get<ProcurementRecord[]>("/analytics/procurement-records");
  },
};
