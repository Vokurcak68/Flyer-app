import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { promoImagesService } from '../../services/promoImagesService';
import { brandsService } from '../../services/brandsService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AppFooter } from '../../components/layout/AppFooter';

export const PromoImageFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    defaultSize: 'single' as 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2',
    brandId: '',
    isForEndUsers: false,
    fillDate: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: promoImage } = useQuery({
    queryKey: ['promo-images', id],
    queryFn: () => promoImagesService.getPromoImage(id!),
    enabled: isEdit,
  });

  // Admin gets all brands, suppliers get only their brands
  const { data: brands = [] } = useQuery({
    queryKey: user?.role === 'admin' ? ['brands', 'all'] : ['brands', 'my-brands'],
    queryFn: () => user?.role === 'admin' ? brandsService.getAllBrands() : brandsService.getMyBrands(),
  });

  useEffect(() => {
    if (promoImage) {
      setFormData({
        name: promoImage.name,
        defaultSize: promoImage.defaultSize,
        brandId: promoImage.brandId || '',
        isForEndUsers: promoImage.isForEndUsers || false,
        fillDate: promoImage.fillDate || false,
      });
      // Set preview from existing image
      const API_URL = process.env.REACT_APP_API_URL || '/api';
      setPreviewUrl(`${API_URL}/promo-images/${id}/image`);
    }
  }, [promoImage, id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return promoImagesService.updatePromoImage(id!, {
          name: formData.name,
          image: selectedFile || undefined,
          defaultSize: formData.defaultSize,
          brandId: formData.brandId,
          isForEndUsers: formData.isForEndUsers,
          fillDate: formData.fillDate,
        });
      } else {
        if (!selectedFile) {
          throw new Error('Soubor je povinný');
        }
        return promoImagesService.createPromoImage({
          name: formData.name,
          image: selectedFile,
          defaultSize: formData.defaultSize,
          brandId: formData.brandId,
          isForEndUsers: formData.isForEndUsers,
          fillDate: formData.fillDate,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images'] });
      navigate('/promo-images');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name from filename if empty
      if (!formData.name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData({ ...formData, name: nameWithoutExt });
      }
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Prosím zadejte název obrázku');
      return;
    }

    if (!isEdit && !selectedFile) {
      alert('Prosím vyberte soubor');
      return;
    }

    if (!formData.brandId || formData.brandId.trim() === '') {
      alert('Prosím vyberte značku');
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formData.brandId)) {
      alert('Neplatná značka. Prosím vyberte značku ze seznamu.');
      return;
    }

    saveMutation.mutate();
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'single': return '1 slot (1×1)';
      case 'horizontal': return '2 sloty vodorovně (2×1)';
      case 'square': return '4 sloty čtverec (2×2)';
      case 'full_page': return 'Celá stránka (8 slotů)';
      case 'footer': return 'Patička (2cm výška, celá šířka)';
      case 'header_2x1': return 'Hlavička 2 sloty (2×1)';
      case 'header_2x2': return 'Hlavička 4 sloty (2×2)';
      default: return size;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/promo-images')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na promo obrázky
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Upravit promo obrázek' : 'Nový promo obrázek'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6 bg-white rounded-lg shadow p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Název obrázku *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="např. Letní akce, Sleva 50%, ..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Značka *
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Vyberte značku</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Vyberte značku, ke které promo obrázek patří
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Velikost (kolik slotů zabírá) *
              </label>
              <select
                value={formData.defaultSize}
                onChange={(e) => setFormData({ ...formData, defaultSize: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">1 slot (1×1)</option>
                <option value="horizontal">2 sloty vodorovně (2×1)</option>
                <option value="square">4 sloty čtverec (2×2)</option>
                <option value="full_page">Celá stránka (8 slotů)</option>
                <option value="footer">Patička (2cm výška, celá šířka)</option>
                <option value="header_2x1">Hlavička 2 sloty (2×1)</option>
                <option value="header_2x2">Hlavička 4 sloty (2×2)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Vyberte velikost podle rozměrů vašeho obrázku, aby se nedeformoval
              </p>
            </div>

            {/* Show fillDate checkbox only for footer size */}
            {formData.defaultSize === 'footer' && (
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="fillDate"
                  checked={formData.fillDate}
                  onChange={(e) => setFormData({ ...formData, fillDate: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="fillDate" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Vyplnit datum
                  </label>
                  <p className="text-xs text-gray-500">
                    Automaticky doplní datum platnosti z letáku bílou barvou vpravo
                  </p>
                </div>
              </div>
            )}

            {/* Only show isForEndUsers checkbox for admin */}
            {user?.role === 'admin' && (
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="isForEndUsers"
                  checked={formData.isForEndUsers}
                  onChange={(e) => setFormData({ ...formData, isForEndUsers: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="isForEndUsers" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Zobrazit koncovým uživatelům
                  </label>
                  <p className="text-xs text-gray-500">
                    Tento obrázek bude dostupný pro koncové uživatele při vytváření jejich letáků
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soubor obrázku {!isEdit && '*'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? selectedFile.name : isEdit ? 'Změnit soubor' : 'Vybrat soubor'}
              </Button>
              {isEdit && !selectedFile && (
                <p className="mt-1 text-xs text-gray-500">
                  Pokud nevyberete nový soubor, zůstane stávající obrázek
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Náhled</h3>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              {previewUrl ? (
                <div className="bg-white rounded-lg p-4 shadow">
                  <img
                    src={previewUrl}
                    alt="Náhled"
                    className="w-full h-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12">Chyba načítání</text></svg>';
                    }}
                  />
                  <div className="mt-4 text-sm text-gray-600">
                    <p className="font-medium">Velikost: {getSizeLabel(formData.defaultSize)}</p>
                    {formData.brandId && brands.find(b => b.id === formData.brandId) && (
                      <p>Značka: {brands.find(b => b.id === formData.brandId)?.name}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-400">Náhled obrázku</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/promo-images')}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Aktualizovat obrázek' : 'Vytvořit obrázek'}
          </Button>
        </div>
      </form>

      <AppFooter />
    </div>
  );
};
