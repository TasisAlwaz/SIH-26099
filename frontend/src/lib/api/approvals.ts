import { apiClient } from "./client";
import { Approval, ApprovalStatus } from "@/types";

export const approvalsApi = {
  getApprovals(status?: string): Promise<Approval[]> {
    return apiClient.get<Approval[]>("/approvals", {
      status: status && status !== "ALL" ? status : undefined,
    });
  },

  updateApprovalStatus(
    id: string,
    status: ApprovalStatus,
    reviewer: string,
    reviewNotes?: string
  ): Promise<Approval> {
    return apiClient.post<Approval>(`/approvals/${encodeURIComponent(id)}/action`, {
      status,
      reviewer,
      reviewNotes,
    });
  },
};
