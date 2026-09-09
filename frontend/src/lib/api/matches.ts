import { apiClient } from "./client";
import { MaterialMatch, PaginatedResult } from "@/types";

export interface MatchQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  relationship?: string;
}

export const matchesApi = {
  getMatches(params?: MatchQueryParams): Promise<PaginatedResult<MaterialMatch>> {
    return apiClient.get<PaginatedResult<MaterialMatch>>("/matches", {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 25,
      status: params?.status,
      relationship: params?.relationship,
    });
  },

  getMatchById(id: string): Promise<MaterialMatch> {
    return apiClient.get<MaterialMatch>(`/matches/${encodeURIComponent(id)}`);
  },

  analyzePair(materialAId: string, materialBId: string): Promise<MaterialMatch> {
    return apiClient.post<MaterialMatch>("/matches/analyze", {
      materialAId,
      materialBId,
    });
  },
};
