import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Calendar } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/helpers';

export const ActiveFlyersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: flyers = [], isLoading } = useQuery({
    queryKey: ['flyers', 'active'],
    queryFn: () => flyersService.getActiveFlyers(),
  });

  // Filter by search query
  const filteredFlyers = useMemo(() => {
    if (!searchQuery.trim()) {
      return flyers;
    }
    const query = searchQuery.toLowerCase();
    return flyers.filter(f =>
      f.name.toLowerCase().includes(query) ||
      formatDate(f.validFrom).toLowerCase().includes(query) ||
      formatDate(f.validTo).toLowerCase().includes(query)
    );
  }, [flyers, searchQuery]);

  const handleViewPdf = async (flyerId: string, flyerName: string) => {
    try {
      // First generate PDF if needed
      await flyersService.generatePdf(flyerId);

      // Then fetch and display it
      const blob = await flyersService.getPdfBlob(flyerId, true);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Chyba při zobrazení PDF');
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Aktivní letáky</h1>
        <p className="mt-2 text-gray-600">
          Prohlížejte aktivní propagační letáky ({flyers.length})
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Hledat podle názvu nebo data platnosti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredFlyers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            {searchQuery ? (
              <Search className="w-16 h-16 mx-auto" />
            ) : (
              <FileText className="w-16 h-16 mx-auto" />
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné aktivní letáky</h3>
              <p className="text-gray-600">Momentálně nejsou k dispozici žádné aktivní letáky</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlyers.map(flyer => (
            <div key={flyer.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{flyer.name}</h3>
                    <StatusBadge status={flyer.status} />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Platnost:</div>
                      <div>{formatDate(flyer.validFrom)} - {formatDate(flyer.validTo)}</div>
                    </div>
                  </div>

                  {flyer.pages && flyer.pages.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Stránky:</span> {flyer.pages.length}
                      {' | '}
                      <span className="font-medium">Produkty:</span>{' '}
                      {flyer.pages.reduce(
                        (sum, page) =>
                          sum + (page.slots?.filter(slot => slot && slot.type === 'product').length || 0),
                        0
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleViewPdf(flyer.id, flyer.name)}
                  className="w-full"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Zobrazit PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
