import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Star } from 'lucide-react';
import iconsService from '../../services/iconsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const IconsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: icons = [], isLoading } = useQuery({
    queryKey: ['icons'],
    queryFn: () => iconsService.getAllIcons(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => iconsService.deleteIcon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icons'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Chyba při mazání ikony';
      alert(errorMessage);
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Opravdu chcete smazat ikonu "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredIcons = icons.filter((icon: any) =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ikony</h1>
          <p className="mt-2 text-gray-600">Spravujte ikony pro produkty</p>
        </div>
        <Button onClick={() => navigate('/admin/icons/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nová ikona
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Hledat podle názvu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredIcons.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Star className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné ikony nenalezeny</h3>
          <p className="text-gray-600 mb-6">
            {search ? 'Zkuste upravit vyhledávání' : 'Začněte vytvořením první ikony'}
          </p>
          {!search && (
            <Button onClick={() => navigate('/admin/icons/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Vytvořit ikonu
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Náhled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Název
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Značky
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIcons.map((icon: any) => (
                <tr key={icon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={icon.imageUrl}
                      alt={icon.name}
                      className="h-8 w-auto object-contain"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{icon.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {icon.categories && icon.categories.length > 0
                        ? icon.categories.map((ic: any) => ic.category.name).join(', ')
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {icon.brands && icon.brands.length > 0
                        ? icon.brands.map((ib: any) => ib.brand.name).join(', ')
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      icon.isEnergyClass ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {icon.isEnergyClass ? 'Energetická třída' : 'Běžná'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/admin/icons/${icon.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(icon.id, icon.name)}
                        className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
