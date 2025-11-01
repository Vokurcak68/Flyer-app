import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import { usersService } from '../../services/usersService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrátor',
  supplier: 'Dodavatel',
  pre_approver: 'Předschvalovatel',
  approver: 'Schvalovatel',
  end_user: 'Koncový uživatel',
};

export const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'end_user' as UserRole,
  });

  const { data: user } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getUser(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '', // Heslo se při editaci nevyplňuje
        role: user.role,
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEdit && id) {
        // Při editaci neposíláme heslo
        const { password, ...updateData } = data;
        return usersService.updateUser(id, updateData);
      } else {
        return usersService.createUser(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/admin/users');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/users')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na uživatele
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Upravit uživatele' : 'Nový uživatel'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <Input
            label="Jméno *"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />

          <Input
            label="Příjmení *"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />

          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          {!isEdit && (
            <Input
              label="Heslo *"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Minimálně 6 znaků"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Aktualizovat uživatele' : 'Vytvořit uživatele'}
          </Button>
        </div>
      </form>
    </div>
  );
};
