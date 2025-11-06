import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Upload, Image as ImageIcon, Search } from 'lucide-react';
import { promoImagesService } from '../../services/promoImagesService';
import { brandsService } from '../../services/brandsService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/helpers';

export const PromoImagesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPromoImage, setEditingPromoImage] = useState<any | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2'>('single');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [isForEndUsers, setIsForEndUsers] = useState(false);
  const [fillDate, setFillDate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: promoImages = [], isLoading } = useQuery({
    queryKey: ['promo-images', user?.role],
    queryFn: () => promoImagesService.getPromoImages(),
  });

  // Admin gets all brands, suppliers get only their brands
  const { data: brands = [] } = useQuery({
    queryKey: user?.role === 'admin' ? ['brands', 'all'] : ['brands', 'my-brands'],
    queryFn: () => user?.role === 'admin' ? brandsService.getAllBrands() : brandsService.getMyBrands(),
  });

  // Filter by search query
  const filteredPromoImages = useMemo(() => {
    if (!searchQuery.trim()) {
      return promoImages;
    }
    const query = searchQuery.toLowerCase();
    return promoImages.filter(img =>
      img.name.toLowerCase().includes(query) ||
      img.brand?.name.toLowerCase().includes(query)
    );
  }, [promoImages, searchQuery]);

  const uploadMutation = useMutation({
    mutationFn: (data: { name: string; image: File; defaultSize: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2'; brandId: string; isForEndUsers?: boolean; fillDate?: boolean }) =>
      promoImagesService.createPromoImage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images', user?.role] });
      setIsUploadModalOpen(false);
      setUploadName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedSize('single');
      setSelectedBrandId('');
      setIsForEndUsers(false);
      setFillDate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; image?: File; defaultSize?: 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2'; brandId?: string; isForEndUsers?: boolean; fillDate?: boolean } }) =>
      promoImagesService.updatePromoImage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images', user?.role] });
      setIsUploadModalOpen(false);
      setEditingPromoImage(null);
      setUploadName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedSize('single');
      setSelectedBrandId('');
      setIsForEndUsers(false);
      setFillDate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promoImagesService.deletePromoImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images', user?.role] });
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

    // For new promo image, file is required
    if (!editingPromoImage && !selectedFile) {
      alert('Prosím vyberte soubor');
      return;
    }

    if (!selectedBrandId || selectedBrandId.trim() === '') {
      alert('Prosím vyberte značku');
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedBrandId)) {
      alert('Neplatná značka. Prosím vyberte značku ze seznamu.');
      return;
    }

    if (editingPromoImage) {
      // Update existing promo image
      await updateMutation.mutateAsync({
        id: editingPromoImage.id,
        data: {
          name: uploadName,
          image: selectedFile || undefined,
          defaultSize: selectedSize,
          brandId: selectedBrandId,
          isForEndUsers,
          fillDate,
        },
      });
    } else {
      // Create new promo image
      await uploadMutation.mutateAsync({
        name: uploadName,
        image: selectedFile!,
        defaultSize: selectedSize,
        brandId: selectedBrandId,
        isForEndUsers,
        fillDate,
      });
    }
  };

  const handleEdit = (promoImage: any) => {
    setEditingPromoImage(promoImage);
    setUploadName(promoImage.name);
    setSelectedSize(promoImage.defaultSize);
    setSelectedBrandId(promoImage.brandId || '');
    setIsForEndUsers(promoImage.isForEndUsers || false);
    setFillDate(promoImage.fillDate || false);
    setPreviewUrl(getPromoImageUrl(promoImage.id));
    setIsUploadModalOpen(true);
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

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'single': return '1 slot (1×1)';
      case 'horizontal': return '2 sloty (2×1)';
      case 'square': return '4 sloty (2×2)';
      case 'full_page': return 'Celá stránka';
      case 'footer': return 'Patička';
      case 'header_2x1': return 'Hlavička 2 sloty (2×1)';
      case 'header_2x2': return 'Hlavička 4 sloty (2×2)';
      default: return size;
    }
  };

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

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Hledat podle názvu nebo značky..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPromoImages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            {searchQuery ? (
              <Search className="w-16 h-16 mx-auto" />
            ) : (
              <ImageIcon className="w-16 h-16 mx-auto" />
            )}
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné výsledky</h3>
              <p className="text-gray-600 mb-6">Zkuste změnit vyhledávací dotaz</p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Vymazat vyhledávání
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné promo obrázky</h3>
              <p className="text-gray-600 mb-6">Začněte nahráním prvního propagačního obrázku</p>
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nahrát první obrázek
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {filteredPromoImages.map((promoImage) => (
            <div key={promoImage.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4 flex-1">
                  {/* Thumbnail */}
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={getPromoImageUrl(promoImage.id)}
                      alt={promoImage.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12">No Image</text></svg>';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{promoImage.name}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {promoImage.brand && (
                        <div>Značka: <span className="text-blue-600 font-medium">{promoImage.brand.name}</span></div>
                      )}
                      <div>Velikost: {getSizeLabel(promoImage.defaultSize)}</div>
                      {user?.role === 'admin' && (
                        <div>
                          Dostupnost: <span className={promoImage.isForEndUsers ? 'text-green-600' : 'text-gray-600'}>
                            {promoImage.isForEndUsers ? 'Koncové uživatele' : 'Dodavatelé'}
                          </span>
                        </div>
                      )}
                      <div>Vytvořeno: {formatDate(promoImage.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(promoImage)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                    title="Editovat"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(promoImage.id, promoImage.name)}
                    className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                    title="Smazat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingPromoImage(null);
          setUploadName('');
          setSelectedFile(null);
          setPreviewUrl(null);
          setSelectedBrandId('');
          setIsForEndUsers(false);
          setFillDate(false);
        }}
        title={editingPromoImage ? 'Editovat promo obrázek' : 'Nahrát promo obrázek'}
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
              Značka *
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Velikost (kolik slotů zabírá)
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as 'single' | 'horizontal' | 'square' | 'full_page' | 'footer' | 'header_2x1' | 'header_2x2')}
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
          {selectedSize === 'footer' && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="fillDate"
                checked={fillDate}
                onChange={(e) => setFillDate(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="fillDate" className="text-sm font-medium text-gray-700">
                Vyplnit datum
              </label>
              <p className="text-xs text-gray-500">
                (Automaticky doplní datum platnosti z letáku bílou barvou vpravo)
              </p>
            </div>
          )}

          {/* Only show isForEndUsers checkbox for admin */}
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isForEndUsers"
                checked={isForEndUsers}
                onChange={(e) => setIsForEndUsers(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isForEndUsers" className="text-sm font-medium text-gray-700">
                Zobrazit koncovým uživatelům
              </label>
              <p className="text-xs text-gray-500">
                (Tento obrázek bude dostupný pro koncové uživatele při vytváření jejich letáků)
              </p>
            </div>
          )}

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
                setIsForEndUsers(false);
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={uploadMutation.isPending || updateMutation.isPending}
              disabled={!uploadName.trim() || (!editingPromoImage && !selectedFile) || !selectedBrandId}
            >
              {editingPromoImage ? 'Uložit změny' : 'Nahrát'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
