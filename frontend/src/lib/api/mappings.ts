import { apiClient } from "./client";
import { MaterialMapping, PaginatedResult } from "@/types";

export const mappingsApi = {
  getMappings(params?: {
    page?: number;
    pageSize?: number;
    cpse?: string;
  }): Promise<PaginatedResult<MaterialMapping>> {
    return apiClient.get<PaginatedResult<MaterialMapping>>("/mappings", {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 25,
      cpse: params?.cpse,
    });
  },

  getMappingsForMaterial(materialId: string): Promise<MaterialMapping[]> {
    return apiClient.get<MaterialMapping[]>(
      `/mappings/material/${encodeURIComponent(materialId)}`
    );
  },

  getMappingsForNationalCode(nationalCode: string): Promise<MaterialMapping[]> {
    return apiClient.get<MaterialMapping[]>(
      `/mappings/national/${encodeURIComponent(nationalCode)}`
    );
  },
};
