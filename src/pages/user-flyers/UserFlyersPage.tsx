import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Search } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/helpers';

type TabType = 'active' | 'archive';

export const UserFlyersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: flyers = [], isLoading } = useQuery({
    queryKey: ['flyers', 'my'],
    queryFn: () => flyersService.getMyFlyers(),
  });

  // Filter flyers by tab (active vs archive)
  const filteredByTab = useMemo(() => {
    if (activeTab === 'active') {
      // Active tab: all flyers except expired
      return flyers.filter(f => f.status !== 'expired');
    } else {
      // Archive tab: only expired flyers
      return flyers.filter(f => f.status === 'expired');
    }
  }, [flyers, activeTab]);

  // Filter by search query
  const filteredFlyers = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByTab;
    }
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(f =>
      f.name.toLowerCase().includes(query) ||
      formatDate(f.validFrom).toLowerCase().includes(query) ||
      formatDate(f.validTo).toLowerCase().includes(query)
    );
  }, [filteredByTab, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => flyersService.deleteFlyer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Opravdu chcete smazat "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moje letáky</h1>
          <p className="mt-2 text-gray-600">Spravujte své vlastní letáky</p>
        </div>
        <Button onClick={() => navigate('/user-flyers/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nový leták
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Aktivní letáky
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
              {flyers.filter(f => f.status !== 'expired').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'archive'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Archiv
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
              {flyers.filter(f => f.status === 'expired').length}
            </span>
          </button>
        </nav>
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
              <Plus className="w-16 h-16 mx-auto" />
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
          ) : activeTab === 'archive' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné vypršelé letáky</h3>
              <p className="text-gray-600">Archiv je prázdný</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné letáky nenalezeny</h3>
              <p className="text-gray-600 mb-6">Začněte vytvořením prvního letáku</p>
              <Button onClick={() => navigate('/user-flyers/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Vytvořit leták
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {filteredFlyers.map(flyer => (
            <div key={flyer.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{flyer.name}</h3>
                    <StatusBadge status={flyer.status} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Platnost: {formatDate(flyer.validFrom)} - {formatDate(flyer.validTo)}</div>
                    <div>Stránky: {flyer.pages?.length || 0} | Produkty: {flyer.pages?.reduce((s, p) => s + (p.slots?.filter(slot => slot && slot.type === 'product').length || 0), 0) || 0}</div>
                    <div>Vytvořeno: {formatDate(flyer.createdAt)}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {flyer.status === 'draft' && (
                    <>
                      <Button size="sm" onClick={() => navigate(`/user-flyers/${flyer.id}`)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Upravit
                      </Button>
                      <button
                        onClick={() => handleDelete(flyer.id, flyer.name)}
                        className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {flyer.status !== 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/user-flyers/${flyer.id}`)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Zobrazit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
