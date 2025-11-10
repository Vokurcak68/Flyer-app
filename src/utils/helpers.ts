import { FlyerPage } from '../types';

export const calculateCompletionPercentage = (pages: FlyerPage[]): number => {
  if (!pages || pages.length === 0) return 0;

  let totalSlots = 0;
  let filledSlots = 0;

  pages.forEach((page) => {
    // Each page always has 8 slots
    totalSlots += 8;
    filledSlots += page.slots.filter((slot) => slot && slot.type !== 'empty').length;
  });

  return totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('cs-CZ').format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
};

export const isValidEAN = (ean: string): boolean => {
  return /^\d{8,13}$/.test(ean);
};

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getProductImageUrl = (productId: string): string => {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  return `${API_URL}/products/${productId}/image`;
};

export const getIconImageUrl = (iconId: string): string => {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  return `${API_URL}/icons/${iconId}/image`;
};
