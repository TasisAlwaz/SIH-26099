import { apiClient } from "./client";
import { Material, PaginatedResult } from "@/types";

export interface MaterialQueryParams {
  page?: number;
  pageSize?: number;
  query?: string;
  cpse?: string;
  category?: string;
  family?: string;
  uom?: string;
  status?: string;
}

export const materialsApi = {
  getMaterials(params?: MaterialQueryParams): Promise<PaginatedResult<Material>> {
    return apiClient.get<PaginatedResult<Material>>("/materials", {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 25,
      query: params?.query,
      cpse: params?.cpse,
      category: params?.category,
      family: params?.family,
      uom: params?.uom,
      status: params?.status,
    });
  },

  getMaterialById(id: string): Promise<Material> {
    return apiClient.get<Material>(`/materials/${encodeURIComponent(id)}`);
  },
};
