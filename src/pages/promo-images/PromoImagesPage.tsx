import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { promoImagesService } from '../../services/promoImagesService';
import { brandsService } from '../../services/brandsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const PromoImagesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<'single' | 'horizontal' | 'square' | 'full_page' | 'footer'>('single');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const { data: promoImages = [], isLoading } = useQuery({
    queryKey: ['promo-images'],
    queryFn: () => promoImagesService.getPromoImages(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', 'my-brands'],
    queryFn: () => brandsService.getMyBrands(),
  });

  // Debug
  React.useEffect(() => {
    console.log('PromoImages loaded:', promoImages);
  }, [promoImages]);

  const uploadMutation = useMutation({
    mutationFn: (data: { name: string; image: File; defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer'; brandId?: string }) =>
      promoImagesService.createPromoImage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images'] });
      setIsUploadModalOpen(false);
      setUploadName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedSize('single');
      setSelectedBrandId('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promoImagesService.deletePromoImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images'] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name from filename if empty
      if (!uploadName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadName(nameWithoutExt);
      }
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      alert('Prosím zadejte název obrázku');
      return;
    }
    if (!selectedFile) {
      alert('Prosím vyberte soubor');
      return;
    }
    await uploadMutation.mutateAsync({
      name: uploadName,
      image: selectedFile,
      defaultSize: selectedSize,
      brandId: selectedBrandId || undefined
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Opravdu chcete smazat promo obrázek "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getPromoImageUrl = (id: string) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    const url = `${API_URL}/promo-images/${id}/image`;
    console.log('🖼️ Loading promo image from:', url);
    return url;
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Promo obrázky</h1>
          <p className="mt-2 text-gray-600">Spravujte propagační obrázky pro letáky</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nahrát obrázek
        </Button>
      </div>

      {promoImages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné promo obrázky</h3>
          <p className="text-gray-600 mb-6">
            Začněte nahráním prvního propagačního obrázku
          </p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nahrát první obrázek
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {promoImages.map((promoImage) => (
            <div key={promoImage.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={getPromoImageUrl(promoImage.id)}
                  alt={promoImage.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12">No Image</text></svg>';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{promoImage.name}</h3>
                {promoImage.brand && (
                  <p className="text-xs text-blue-600 mb-2 truncate">{promoImage.brand.name}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(promoImage.createdAt).toLocaleDateString('cs-CZ')}
                  </span>
                  <button
                    onClick={() => handleDelete(promoImage.id, promoImage.name)}
                    className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadName('');
          setSelectedFile(null);
          setPreviewUrl(null);
          setSelectedBrandId('');
        }}
        title="Nahrát promo obrázek"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Název obrázku
            </label>
            <Input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="např. Letní akce, Sleva 50%, ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Značka (volitelné)
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bez značky</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Přiřaďte promo obrázek ke značce pro lepší organizaci
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Velikost (kolik slotů zabírá)
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as 'single' | 'horizontal' | 'square' | 'full_page' | 'footer')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="single">1 slot (1×1)</option>
              <option value="horizontal">2 sloty vodorovně (2×1)</option>
              <option value="square">4 sloty čtverec (2×2)</option>
              <option value="full_page">Celá stránka (8 slotů)</option>
              <option value="footer">Patička (2cm výška, celá šířka)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Vyberte velikost podle rozměrů vašeho obrázku, aby se nedeformoval
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soubor obrázku
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {selectedFile ? selectedFile.name : 'Vybrat soubor'}
            </Button>
          </div>

          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Náhled
              </label>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadName('');
                setSelectedFile(null);
                setPreviewUrl(null);
                setSelectedBrandId('');
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={uploadMutation.isPending}
              disabled={!uploadName.trim() || !selectedFile}
            >
              Nahrát
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
