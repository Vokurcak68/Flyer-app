import { api } from './api';
import { Approval } from '../types';

export interface ApproveDTO {
  comment?: string;
}

export interface RejectDTO {
  comment: string;
}

export const approvalsService = {
  async getPendingApprovals(): Promise<Approval[]> {
    const response = await api.get<Approval[]>('/approvals/pending');
    return response.data;
  },

  async getMyApprovals(): Promise<Approval[]> {
    const response = await api.get<Approval[]>('/approvals/my');
    return response.data;
  },

  async approve(approvalId: string, data?: ApproveDTO): Promise<Approval> {
    const response = await api.post<Approval>(`/approvals/${approvalId}/approve`, data);
    return response.data;
  },

  async reject(approvalId: string, data: RejectDTO): Promise<Approval> {
    const response = await api.post<Approval>(`/approvals/${approvalId}/reject`, data);
    return response.data;
  },
};
