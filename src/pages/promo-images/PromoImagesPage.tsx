import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Image as ImageIcon, Search } from 'lucide-react';
import { promoImagesService } from '../../services/promoImagesService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/helpers';
import { AppFooter } from '../../components/layout/AppFooter';

export const PromoImagesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: promoImages = [], isLoading } = useQuery({
    queryKey: ['promo-images', user?.role],
    queryFn: () => promoImagesService.getPromoImages(),
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promoImagesService.deletePromoImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-images', user?.role] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Opravdu chcete smazat promo obrázek "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getPromoImageUrl = (id: string) => {
    const API_URL = process.env.REACT_APP_API_URL || '/api';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promo obrázky</h1>
          <p className="mt-2 text-gray-600">Spravujte propagační obrázky pro letáky</p>
        </div>
        <Button onClick={() => navigate('/promo-images/new')}>
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
              <Button onClick={() => navigate('/promo-images/new')}>
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
                    onClick={() => navigate(`/promo-images/${promoImage.id}/edit`)}
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

      <AppFooter />
    </div>
  );
};
