import { api } from './api';
import { Brand } from '../types';

export const brandsService = {
  async getAllBrands(): Promise<Brand[]> {
    const response = await api.get<Brand[]>('/brands');
    return response.data;
  },

  async getBrands(): Promise<Brand[]> {
    const response = await api.get<Brand[]>('/brands');
    return response.data;
  },

  async getMyBrands(): Promise<Brand[]> {
    const response = await api.get<Brand[]>('/brands/my-brands');
    return response.data;
  },

  async getBrand(id: string): Promise<Brand> {
    const response = await api.get<Brand>(`/brands/${id}`);
    return response.data;
  },

  async createBrand(data: { name: string; logoData?: string; logoMimeType?: string }): Promise<Brand> {
    const response = await api.post<Brand>('/brands', data);
    return response.data;
  },

  async updateBrand(id: string, data: { name?: string; logoData?: string; logoMimeType?: string }): Promise<Brand> {
    const response = await api.put<Brand>(`/brands/${id}`, data);
    return response.data;
  },

  async deleteBrand(id: string): Promise<void> {
    await api.delete(`/brands/${id}`);
  },
};
