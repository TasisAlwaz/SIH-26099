import { apiClient } from "./client";
import { UploadRecord } from "@/types";

export const uploadsApi = {
  listUploads(): Promise<UploadRecord[]> {
    return apiClient.get<UploadRecord[]>("/uploads");
  },

  uploadCatalog(file: File, cpseCode?: string): Promise<UploadRecord> {
    const formData = new FormData();
    formData.append("file", file);
    if (cpseCode) {
      formData.append("cpse_code", cpseCode);
    }
    return apiClient.upload<UploadRecord>("/uploads", formData);
  },
};
