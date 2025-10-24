import { api } from './api';
import { User } from '../types';

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const usersService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async assignBrands(userId: string, brandIds: string[]): Promise<User> {
    const response = await api.post<User>(`/users/${userId}/brands`, { brandIds });
    return response.data;
  },
};
