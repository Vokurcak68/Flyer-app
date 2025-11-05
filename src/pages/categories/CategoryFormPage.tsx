import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import { categoriesService } from '../../services/categoriesService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const CategoryFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    mssqlCode: '',
  });

  const { data: category } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoriesService.getCategory(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        mssqlCode: category.mssqlCode || '',
      });
    }
  }, [category]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        name: data.name,
        mssqlCode: data.mssqlCode || undefined,
      };

      if (isEdit && id) {
        return categoriesService.updateCategory(id, payload);
      } else {
        return categoriesService.createCategory(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Chyba při ukládání kategorie';
      alert(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/categories')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na kategorie
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Upravit kategorii' : 'Nová kategorie'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <Input
              label="Název kategorie *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Např. Elektronika, Obuv, atd."
            />

            <div>
              <Input
                label="MSSQL kód"
                value={formData.mssqlCode}
                onChange={(e) => setFormData({ ...formData, mssqlCode: e.target.value })}
                placeholder="Kód pro integraci s MSSQL databází"
              />
              <p className="mt-1 text-sm text-gray-500">Volitelné pole pro mapování s externím systémem</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/categories')}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Ukládám...' : 'Uložit'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
