import { api } from './api';
import { LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<any>('/auth/login', credentials);
    // Backend returns access_token, but we need to map it to token
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },

  async register(data: { email: string; password: string; name: string; role: string }) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
};
