import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { productsService } from '../../services/productsService';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/SearchInput';
import { formatCurrency, getProductImageUrl } from '../../utils/helpers';
import { AppFooter } from '../../components/layout/AppFooter';

export const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 50;

  // Stable callback for search changes
  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, []);

  const { data, isLoading: isInitialLoading } = useQuery({
    queryKey: ['products', 'my', debouncedSearch, page],
    queryFn: () => productsService.getProducts({
      search: debouncedSearch || undefined,
      page,
      limit,
      isActive: true
    }),
    notifyOnChangeProps: ['data'], // Only re-render when data changes, not loading states
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Opravdu chcete smazat produkt "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error: any) {
        const message = error.response?.data?.message || 'Chyba při mazání produktu';
        alert(message);
      }
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await productsService.exportProducts();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Chyba při exportu: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await productsService.importProducts(file);

      // Show results
      const message = [
        `Import dokončen:`,
        `- Importováno: ${result.imported}`,
        `- Aktualizováno: ${result.updated}`,
        `- Přeskočeno: ${result.skipped}`,
        result.errors.length > 0 ? `\n\nChyby:\n${result.errors.slice(0, 5).join('\n')}` : '',
      ].join('\n');

      alert(message);

      // Refresh product list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      alert(`Chyba při importu: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const products = data?.data || [];
  const totalPages = data?.meta?.totalPages || 0;
  const total = data?.meta?.total || 0;

  // Only show loading on initial load, not during search/pagination
  const isLoading = isInitialLoading && !data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produkty</h1>
          <p className="mt-2 text-gray-600">Spravujte katalog produktů</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportuji...' : 'Export'}
          </Button>
          <Button
            onClick={handleImportClick}
            disabled={isImporting}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importuji...' : 'Import'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nový produkt
          </Button>
        </div>
      </div>

      <SearchInput onSearchChange={handleSearchChange} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné produkty nenalezeny</h3>
          <p className="text-gray-600 mb-6">
            {debouncedSearch ? 'Zkuste upravit vyhledávání' : 'Začněte vytvořením prvního produktu'}
          </p>
          {!debouncedSearch && (
            <Button onClick={() => navigate('/products/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Vytvořit produkt
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produkt
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
                  Podkategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cena
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.id && (
                        <>
                          <img
                            src={getProductImageUrl(product.id)}
                            alt={product.name}
                            className="w-12 h-12 object-contain mr-4 flex-shrink-0"
                            onError={(e) => {
                              // If image doesn't exist, show placeholder
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-12 h-12 bg-gray-200 rounded mr-4 flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                            Bez foto
                          </div>
                        </>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                        {product.supplierNote && (
                          <div className="text-xs text-gray-500 mt-1 truncate" title={product.supplierNote}>
                            {product.supplierNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {product.eanCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.brandName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(product as any).categoryName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(product as any).subcategoryName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-xs text-gray-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                >
                  Předchozí
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  Další
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Zobrazeno <span className="font-medium">{(page - 1) * limit + 1}</span> až{' '}
                    <span className="font-medium">{Math.min(page * limit, total)}</span> z{' '}
                    <span className="font-medium">{total}</span> produktů
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Předchozí</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Strana {page} z {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Další</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      <AppFooter />
    </div>
  );
};
