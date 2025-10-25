import { api } from './api';
import { Product, PaginatedResponse } from '../types';

export interface CreateProductDTO {
  ean: string;
  name: string;
  description?: string;
  brandId: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  iconIds?: string[];
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export interface ProductFilters {
  brandId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const productsService = {
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const response = await api.get<PaginatedResponse<Product>>('/products', { params: filters });
    return response.data;
  },

  async getProduct(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: CreateProductDTO): Promise<Product> {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getMyProducts(): Promise<Product[]> {
    const response = await api.get<PaginatedResponse<Product>>('/products');
    return response.data.data; // Extract products array from paginated response
  },
};
