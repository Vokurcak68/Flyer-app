import { api } from './api';
import { Flyer, FlyerPage, PaginatedResponse } from '../types';

export interface CreateFlyerDTO {
  name: string;
  validFrom: string;
  validTo: string;
}

export interface UpdateFlyerDTO {
  name?: string;
  validFrom?: string;
  validTo?: string;
  pages?: FlyerPage[];
}

export interface FlyerFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export const flyersService = {
  async getFlyers(filters?: FlyerFilters): Promise<PaginatedResponse<Flyer>> {
    const response = await api.get<PaginatedResponse<Flyer>>('/flyers', { params: filters });
    return response.data;
  },

  async getFlyer(id: string): Promise<Flyer> {
    const response = await api.get<Flyer>(`/flyers/${id}`);
    return response.data;
  },

  async createFlyer(data: CreateFlyerDTO): Promise<Flyer> {
    const response = await api.post<Flyer>('/flyers', data);
    return response.data;
  },

  async updateFlyer(id: string, data: UpdateFlyerDTO): Promise<Flyer> {
    const response = await api.patch<Flyer>(`/flyers/${id}`, data);
    return response.data;
  },

  async deleteFlyer(id: string): Promise<void> {
    await api.delete(`/flyers/${id}`);
  },

  async saveDraft(id: string, data: UpdateFlyerDTO): Promise<Flyer> {
    const response = await api.put<Flyer>(`/flyers/${id}/draft`, data);
    return response.data;
  },

  async submitForApproval(id: string): Promise<Flyer> {
    const response = await api.post<Flyer>(`/flyers/${id}/submit-for-verification`);
    return response.data;
  },

  async getMyFlyers(): Promise<Flyer[]> {
    const response = await api.get<PaginatedResponse<Flyer>>('/flyers');
    return response.data.data; // Extract flyers array from paginated response
  },

  async getActiveFlyers(): Promise<Flyer[]> {
    const response = await api.get<Flyer[]>('/flyers/active');
    return response.data;
  },

  async generatePdf(id: string): Promise<{ message: string; url: string }> {
    const response = await api.post<{ message: string; url: string }>(`/flyers/${id}/generate-pdf`);
    return response.data;
  },

  async getPdfBlob(id: string, bustCache: boolean = false): Promise<Blob> {
    const url = bustCache
      ? `/flyers/${id}/pdf?t=${Date.now()}`
      : `/flyers/${id}/pdf`;
    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },
};
