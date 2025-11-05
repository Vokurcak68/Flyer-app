import { api } from './api';

export interface Category {
  id: string;
  name: string;
  mssqlCode?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    subcategories: number;
  };
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const categoriesService = {
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getCategory(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data: { name: string; mssqlCode?: string }): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: { name?: string; mssqlCode?: string }): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    const response = await api.get<Subcategory[]>(`/categories/${categoryId}/subcategories`);
    return response.data;
  },
};
