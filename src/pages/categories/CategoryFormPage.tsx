import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { categoriesService, Subcategory } from '../../services/categoriesService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AppFooter } from '../../components/layout/AppFooter';

export const CategoryFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    mssqlCode: '',
    requiresInstallationType: false,
  });

  // Subcategory management state
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('');

  const { data: category } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoriesService.getCategory(id!),
    enabled: isEdit,
  });

  // Load subcategories when editing
  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', id],
    queryFn: () => categoriesService.getSubcategories(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        mssqlCode: category.mssqlCode || '',
        requiresInstallationType: category.requiresInstallationType || false,
      });
    }
  }, [category]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        name: data.name,
        mssqlCode: data.mssqlCode || undefined,
        requiresInstallationType: data.requiresInstallationType,
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

  // Subcategory mutations
  const createSubcategoryMutation = useMutation({
    mutationFn: (name: string) => categoriesService.createSubcategory(id!, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', id] });
      queryClient.invalidateQueries({ queryKey: ['categories', id] });
      setNewSubcategoryName('');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Chyba při vytváření podkategorie';
      alert(errorMessage);
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ subcategoryId, name }: { subcategoryId: string; name: string }) =>
      categoriesService.updateSubcategory(subcategoryId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', id] });
      setEditingSubcategoryId(null);
      setEditingSubcategoryName('');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Chyba při úpravě podkategorie';
      alert(errorMessage);
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: (subcategoryId: string) => categoriesService.deleteSubcategory(subcategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', id] });
      queryClient.invalidateQueries({ queryKey: ['categories', id] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Chyba při mazání podkategorie';
      alert(errorMessage);
    },
  });

  const handleAddSubcategory = () => {
    if (newSubcategoryName.trim()) {
      createSubcategoryMutation.mutate(newSubcategoryName.trim());
    }
  };

  const handleStartEdit = (subcategory: Subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditingSubcategoryName(subcategory.name);
  };

  const handleSaveEdit = () => {
    if (editingSubcategoryId && editingSubcategoryName.trim()) {
      updateSubcategoryMutation.mutate({
        subcategoryId: editingSubcategoryId,
        name: editingSubcategoryName.trim(),
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSubcategoryId(null);
    setEditingSubcategoryName('');
  };

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    if (window.confirm(`Opravdu chcete smazat podkategorii "${subcategory.name}"?`)) {
      deleteSubcategoryMutation.mutate(subcategory.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresInstallationType"
                checked={formData.requiresInstallationType}
                onChange={(e) => setFormData({ ...formData, requiresInstallationType: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="requiresInstallationType" className="ml-2 block text-sm text-gray-900">
                Rozlišovat vestavné a volně stojící spotřebiče
              </label>
            </div>
            <p className="text-sm text-gray-500 -mt-4 ml-6">
              Zaškrtněte, pokud produkty v této kategorii potřebují rozlišení mezi vestavnými a volně stojícími spotřebiči
            </p>
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

      {/* Subcategories management - only shown when editing */}
      {isEdit && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Podkategorie</h2>

          {/* Add new subcategory */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Přidat novou podkategorii
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
                  }
                }}
                placeholder="Název podkategorie"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
              <Button
                type="button"
                onClick={handleAddSubcategory}
                disabled={!newSubcategoryName.trim() || createSubcategoryMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                Přidat
              </Button>
            </div>
          </div>

          {/* Subcategories list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Existující podkategorie ({subcategories.length})
            </h3>
            {subcategories.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Žádné podkategorie</p>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {subcategories.map((subcategory) => (
                  <li key={subcategory.id} className="p-3 hover:bg-gray-50">
                    {editingSubcategoryId === subcategory.id ? (
                      // Edit mode
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingSubcategoryName}
                          onChange={(e) => setEditingSubcategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={!editingSubcategoryName.trim() || updateSubcategoryMutation.isPending}
                          className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                          title="Uložit"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-600 hover:text-gray-700"
                          title="Zrušit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">{subcategory.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(subcategory)}
                            className="p-2 text-blue-600 hover:text-blue-700"
                            title="Upravit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(subcategory)}
                            disabled={deleteSubcategoryMutation.isPending}
                            className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Smazat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
};
