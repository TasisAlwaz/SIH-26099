import { apiClient } from "./client";
import { AuditLog, PaginatedResult } from "@/types";

export const auditApi = {
  getAuditLogs(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
  }): Promise<PaginatedResult<AuditLog>> {
    return apiClient.get<PaginatedResult<AuditLog>>("/audit", {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 50,
      query: params?.query,
    });
  },

  listAllLogs(): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>("/audit/all");
  },
};
