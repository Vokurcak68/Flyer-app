import api from './api';
import { Icon } from '../types';

export interface CreateIconData {
  name: string;
  imageData: string; // Base64
  imageMimeType: string;
  isEnergyClass?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
}

export interface UpdateIconData {
  name?: string;
  imageData?: string; // Base64
  imageMimeType?: string;
  isEnergyClass?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
}

class IconsService {
  async getAllIcons(): Promise<Icon[]> {
    const response = await api.get<Icon[]>('/icons');
    return response.data;
  }

  async getIcon(id: string): Promise<Icon> {
    const response = await api.get<Icon>(`/icons/${id}`);
    return response.data;
  }

  async createIcon(data: CreateIconData): Promise<Icon> {
    const response = await api.post<Icon>('/icons', data);
    return response.data;
  }

  async updateIcon(id: string, data: UpdateIconData): Promise<Icon> {
    const response = await api.put<Icon>(`/icons/${id}`, data);
    return response.data;
  }

  async deleteIcon(id: string): Promise<void> {
    await api.delete(`/icons/${id}`);
  }

  getIconImageUrl(id: string): string {
    const API_URL = process.env.REACT_APP_API_URL || '/api';
    return `${API_URL}/icons/${id}/image`;
  }
}

const iconsService = new IconsService();
export default iconsService;
