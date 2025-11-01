export type UserRole = 'admin' | 'supplier' | 'approver' | 'end_user';

export type FlyerStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'expired';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type SlotType = 'empty' | 'product' | 'promo';

export type PromoSlotSize = 'single' | 'horizontal' | 'square' | 'full_page' | 'footer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  brands?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  logoData?: Buffer | null;
  logoMimeType?: string | null;
  createdAt: string;
  _count?: {
    products: number;
  };
}

// Global icon library
export interface Icon {
  id: string;
  name: string;
  imageUrl: string;
  imageMimeType?: string;
  isEnergyClass?: boolean; // Energy class icons are displayed 2x wider
  createdAt: string;
  updatedAt: string;
}

// Product icon assignment
export interface ProductIcon {
  id: string;
  name: string;
  imageUrl: string;
  isEnergyClass?: boolean; // Energy class icons are displayed 2x wider
  position: number;
}

export interface Product {
  id: string;
  supplierId: string;
  eanCode: string;
  name: string;
  description?: string;
  brandId: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  price: number;
  originalPrice?: number;
  icons?: ProductIcon[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoImage {
  id: string;
  name: string;
  defaultSize: PromoSlotSize;
  supplierId: string;
  brandId?: string | null;
  brand?: any;
  isForEndUsers?: boolean;
  createdAt: string;
}

export interface FlyerSlot {
  type: SlotType;
  product?: Product | null;
  promoImage?: PromoImage | null;
  promoSize?: PromoSlotSize;
}

export interface FlyerPage {
  id: string;
  pageNumber: number;
  slots: FlyerSlot[]; // Always 8 slots (0-7)
  footerPromoImage?: PromoImage | null; // Page 1 only: 2cm footer promo
  footerPromoImageId?: string | null;
}

export interface Flyer {
  id: string;
  supplierId: string;
  supplier?: User;
  name: string;
  validFrom: string;
  validTo: string;
  status: FlyerStatus;
  pages: FlyerPage[];
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  publishedAt?: string;
  rejectionReason?: string;
  approvals?: Approval[];
}

export interface Approval {
  id: string;
  flyerId: string;
  flyer?: Flyer;
  approverId: string;
  approver?: User;
  status: ApprovalStatus;
  comment?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface UserFlyer {
  id: string;
  userId: string;
  user?: User;
  name: string;
  pages: FlyerPage[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
