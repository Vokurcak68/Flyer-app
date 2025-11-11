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
  isActive?: boolean;
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

  async getMyProductsStats(): Promise<{ total: number; active: number }> {
    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params: { limit: 1 } // Get minimal data, we only need the count
    });

    // Count active products from total
    const activeResponse = await api.get<PaginatedResponse<Product>>('/products', {
      params: { limit: 1, isActive: true }
    });

    return {
      total: response.data.meta?.total || 0,
      active: activeResponse.data.meta?.total || 0
    };
  },

  async exportProducts(): Promise<Blob> {
    const response = await api.get('/products/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  async importProducts(file: File): Promise<{ imported: number; updated: number; skipped: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/products/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async validateEAN(
    ean: string,
    price?: number,
    originalPrice?: number,
  ): Promise<{
    ean: string;
    found: boolean;
    pricesMatch: boolean;
    erpPrice?: number;
    erpOriginalPrice?: number;
    erpProductName?: string;
    erpBrand?: string;
    erpCategoryCode?: string;
    erpInstallationType?: 'BUILT_IN' | 'FREESTANDING';
  }> {
    const params: any = {};
    if (price !== undefined) params.price = price.toString();
    if (originalPrice !== undefined) params.originalPrice = originalPrice.toString();

    const response = await api.get<{
      ean: string;
      found: boolean;
      pricesMatch: boolean;
      erpPrice?: number;
      erpOriginalPrice?: number;
      erpProductName?: string;
      erpBrand?: string;
      erpCategoryCode?: string;
      erpInstallationType?: 'BUILT_IN' | 'FREESTANDING';
    }>(`/products/${ean}/validate-ean`, { params });
    return response.data;
  },

  async checkDuplicateEan(ean: string): Promise<{
    exists: boolean;
    count: number;
    latestProduct: Product | null;
    allProducts: Product[];
  }> {
    const response = await api.get<{
      exists: boolean;
      count: number;
      latestProduct: Product | null;
      allProducts: Product[];
    }>(`/products/check-duplicate-ean/${ean}`);
    return response.data;
  },
};
