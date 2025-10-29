import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

class CategoriesService {
  async getAllCategories(): Promise<Category[]> {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  }

  async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    const response = await axios.get(`${API_URL}/categories/${categoryId}/subcategories`);
    return response.data;
  }
}

export const categoriesService = new CategoriesService();
