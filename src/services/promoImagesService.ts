import { api } from './api';
import { PromoImage } from '../types';

export const promoImagesService = {
  async getPromoImages(): Promise<PromoImage[]> {
    const response = await api.get<PromoImage[]>('/promo-images');
    return response.data;
  },

  async getPromoImage(id: string): Promise<PromoImage> {
    const response = await api.get<PromoImage>(`/promo-images/${id}`);
    return response.data;
  },

  async createPromoImage(data: { name: string; image: File; defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2'; brandId: string; isForEndUsers?: boolean; fillDate?: boolean }): Promise<PromoImage> {
    // Convert File to Base64
    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(data.image);
    });

    const response = await api.post<PromoImage>('/promo-images', {
      name: data.name,
      imageData,
      imageMimeType: data.image.type,
      defaultSize: data.defaultSize,
      brandId: data.brandId,
      isForEndUsers: data.isForEndUsers,
      fillDate: data.fillDate,
    });
    return response.data;
  },

  async deletePromoImage(id: string): Promise<void> {
    await api.delete(`/promo-images/${id}`);
  },
};
