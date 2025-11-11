import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertCircle, CheckCircle, Package, PlayCircle } from 'lucide-react';
import { productsService } from '../../services/productsService';
import { Input } from '../../components/ui/Input';
import { AppFooter } from '../../components/layout/AppFooter';

export const ActiveFlyersProductsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['active-flyers-products'],
    queryFn: () => productsService.getActiveFlyersProducts(),
  });

  const markSoldOutMutation = useMutation({
    mutationFn: () => productsService.markDiscontinuedAsSoldOut(),
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['active-flyers-products'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Chyba při označování produktů');
    },
  });

  const handleMarkSoldOut = () => {
    const discontinuedCount = products.filter(p => p.discontinued).length;
    if (discontinuedCount === 0) {
      alert('Žádné ukončené produkty k označení');
      return;
    }
    if (confirm(`Opravdu chcete označit ${discontinuedCount} ukončených produktů jako vyprodáno?`)) {
      markSoldOutMutation.mutate();
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.eanCode.toLowerCase().includes(search.toLowerCase()) ||
    product.brandName.toLowerCase().includes(search.toLowerCase())
  );

  const discontinuedCount = products.filter(p => p.discontinued).length;
  const activeCount = products.length - discontinuedCount;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Produkty v aktivních letácích</h1>
          <button
            onClick={handleMarkSoldOut}
            disabled={markSoldOutMutation.isPending || discontinuedCount === 0}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            {markSoldOutMutation.isPending ? 'Zpracovávám...' : 'Označit ukončené jako vyprodáno'}
          </button>
        </div>
        <p className="text-gray-600">
          Přehled produktů obsažených v aktuálně platných aktivních letácích se stavem dostupnosti v ERP
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Celkem produktů</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Aktivní v ERP</p>
              <p className="text-2xl font-bold text-green-700">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ukončené</p>
              <p className="text-2xl font-bold text-red-700">{discontinuedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Hledat podle názvu, EAN nebo značky..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Název produktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Značka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cena
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Letáky
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {search ? 'Žádné produkty nenalezeny' : 'Žádné produkty v aktivních letácích'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className={product.discontinued ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.discontinued ? (
                        <div className="flex items-center text-red-600" title="Produkt není nalezen v ERP">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600" title="Produkt je aktivní v ERP">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{product.eanCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.brandColor && (
                          <div
                            className="w-4 h-4 rounded mr-2"
                            style={{ backgroundColor: product.brandColor }}
                            title={product.brandColor}
                          />
                        )}
                        <span className="text-sm text-gray-900">{product.brandName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.categoryName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-xs text-gray-500 line-through">
                            {Math.round(product.originalPrice).toLocaleString('cs-CZ')} Kč
                          </div>
                        )}
                        <div className="font-medium text-red-600">
                          {Math.round(product.price).toLocaleString('cs-CZ')} Kč
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.flyers.map((flyer, index) => (
                          <div key={flyer.id} className={index > 0 ? 'mt-1 pt-1 border-t' : ''}>
                            <div className="font-medium">{flyer.name}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(flyer.validFrom).toLocaleDateString('cs-CZ')} - {new Date(flyer.validTo).toLocaleDateString('cs-CZ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};
