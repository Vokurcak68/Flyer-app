import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import iconsService from '../../services/iconsService';
import { categoriesService } from '../../services/categoriesService';
import { brandsService } from '../../services/brandsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const IconFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    imageData: '',
    imageMimeType: '',
    isEnergyClass: false,
    categoryIds: [] as string[],
    brandIds: [] as string[],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: icon } = useQuery({
    queryKey: ['icons', id],
    queryFn: () => iconsService.getIcon(id!),
    enabled: isEdit,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAllCategories(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsService.getAllBrands(),
  });

  useEffect(() => {
    if (icon) {
      setFormData({
        name: icon.name,
        imageData: '',
        imageMimeType: '',
        isEnergyClass: icon.isEnergyClass || false,
        categoryIds: icon.categories?.map((ic: any) => ic.category.id) || [],
        brandIds: icon.brands?.map((ib: any) => ib.brand.id) || [],
      });
      setImagePreview(icon.imageUrl);
    }
  }, [icon]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setFormData({
          ...formData,
          imageData: base64Data,
          imageMimeType: file.type,
        });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const toggleBrand = (brandId: string) => {
    setFormData((prev) => ({
      ...prev,
      brandIds: prev.brandIds.includes(brandId)
        ? prev.brandIds.filter((id) => id !== brandId)
        : [...prev.brandIds, brandId],
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        name: data.name,
        isEnergyClass: data.isEnergyClass,
        categoryIds: data.categoryIds,
        brandIds: data.brandIds,
      };

      if (data.imageData) {
        payload.imageData = data.imageData;
        payload.imageMimeType = data.imageMimeType;
      }

      if (isEdit && id) {
        return iconsService.updateIcon(id, payload);
      } else {
        if (!data.imageData) {
          throw new Error('Obrázek je povinný');
        }
        return iconsService.createIcon(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icons'] });
      navigate('/admin/icons');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Chyba při ukládání ikony';
      alert(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !formData.imageData) {
      alert('Vyberte prosím obrázek');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/icons')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na ikony
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Upravit ikonu' : 'Nová ikona'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <Input
              label="Název ikony *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Např. WiFi, Bluetooth, atd."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obrázek {!isEdit && '*'}
              </label>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Náhled"
                        className="h-32 w-32 object-contain border-2 border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, imageData: '', imageMimeType: '' });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="icon-image"
                  />
                  <label htmlFor="icon-image">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('icon-image')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      {imagePreview ? 'Změnit obrázek' : 'Vybrat obrázek'}
                    </Button>
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    Podporované formáty: PNG, JPG, SVG. Doporučená velikost: 64x64 px.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isEnergyClass"
                checked={formData.isEnergyClass}
                onChange={(e) => setFormData({ ...formData, isEnergyClass: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isEnergyClass" className="ml-2 block text-sm text-gray-900">
                Ikona energetické třídy
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie
              </label>
              <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">Žádné kategorie k dispozici</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category: any) => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`category-${category.id}`} className="ml-2 block text-sm text-gray-900">
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">Vyberte kategorie, do kterých ikona patří</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Značky
              </label>
              <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
                {brands.length === 0 ? (
                  <p className="text-sm text-gray-500">Žádné značky k dispozici</p>
                ) : (
                  <div className="space-y-2">
                    {brands.map((brand: any) => (
                      <div key={brand.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`brand-${brand.id}`}
                          checked={formData.brandIds.includes(brand.id)}
                          onChange={() => toggleBrand(brand.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`brand-${brand.id}`} className="ml-2 block text-sm text-gray-900">
                          {brand.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">Vyberte značky, pro které je ikona určena</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/icons')}
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
