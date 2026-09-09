import { apiClient } from "./client";
import { CPSE, Material, PaginatedResult } from "@/types";

export const cpsesApi = {
  getCpses(): Promise<CPSE[]> {
    return apiClient.get<CPSE[]>("/cpses");
  },

  getCpseById(id: string): Promise<CPSE> {
    return apiClient.get<CPSE>(`/cpses/${encodeURIComponent(id)}`);
  },

  getCpseMaterials(
    id: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<PaginatedResult<Material>> {
    return apiClient.get<PaginatedResult<Material>>(
      `/cpses/${encodeURIComponent(id)}/materials`,
      {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 25,
      }
    );
  },
};
