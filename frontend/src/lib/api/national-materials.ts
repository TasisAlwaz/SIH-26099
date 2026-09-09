import { apiClient } from "./client";
import { NationalMaterial, PaginatedResult } from "@/types";

export interface NationalMaterialQueryParams {
  page?: number;
  pageSize?: number;
  query?: string;
  materialGroup?: string;
  family?: string;
}

export const nationalMaterialsApi = {
  getNationalMaterials(
    params?: NationalMaterialQueryParams
  ): Promise<PaginatedResult<NationalMaterial>> {
    return apiClient.get<PaginatedResult<NationalMaterial>>("/national-materials", {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 25,
      query: params?.query,
      material_group: params?.materialGroup,
      family: params?.family,
    });
  },

  getNationalMaterialById(id: string): Promise<NationalMaterial> {
    return apiClient.get<NationalMaterial>(
      `/national-materials/${encodeURIComponent(id)}`
    );
  },
};
