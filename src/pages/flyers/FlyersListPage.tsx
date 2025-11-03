import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, AlertCircle, Search } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/helpers';

type TabType = 'active' | 'archive';

export const FlyersListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Get status filter from URL query params
  const statusFilter = searchParams.get('status');

  // Determine base path based on current location
  const isMyFlyers = location.pathname.startsWith('/my-flyers');
  const basePath = isMyFlyers ? '/my-flyers' : '/flyers';

  const { data: flyers = [], isLoading } = useQuery({
    queryKey: ['flyers', 'my'],
    queryFn: () => flyersService.getMyFlyers(),
  });

  // Filter flyers by tab (active vs archive) and status filter
  const filteredByTab = useMemo(() => {
    let filtered = flyers;

    // First apply status filter from URL if present
    if (statusFilter) {
      if (statusFilter === 'rejected') {
        // Rejected flyers are drafts with rejection reason
        filtered = flyers.filter(f => f.status === 'draft' && f.rejectionReason);
      } else if (statusFilter === 'draft') {
        // Draft flyers without rejection reason
        filtered = flyers.filter(f => f.status === 'draft' && !f.rejectionReason);
      } else {
        filtered = flyers.filter(f => f.status === statusFilter);
      }
      return filtered;
    }

    // Otherwise apply tab filter
    if (activeTab === 'active') {
      // Active tab: all flyers except expired
      return flyers.filter(f => f.status !== 'expired');
    } else {
      // Archive tab: only expired flyers
      return flyers.filter(f => f.status === 'expired');
    }
  }, [flyers, activeTab, statusFilter]);

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

  // Get title based on status filter
  const getTitle = () => {
    if (statusFilter === 'active') return 'Aktivní letáky';
    if (statusFilter === 'pending_approval') return 'Letáky čekající na schválení';
    if (statusFilter === 'rejected') return 'Zamítnuté letáky';
    if (statusFilter === 'draft') return 'Koncepty letáků';
    return isMyFlyers ? 'Moje letáky' : 'Letáky';
  };

  const getSubtitle = () => {
    if (statusFilter === 'active') return 'Schválené a aktivní letáky';
    if (statusFilter === 'pending_approval') return 'Letáky čekající na schválení';
    if (statusFilter === 'rejected') return 'Zamítnuté letáky, které je potřeba opravit';
    if (statusFilter === 'draft') return 'Rozpracované koncepty letáků';
    return 'Spravujte své propagační letáky';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="mt-2 text-gray-600">{getSubtitle()}</p>
          {statusFilter && (
            <button
              onClick={() => navigate(basePath)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              ← Zobrazit všechny letáky
            </button>
          )}
        </div>
        <Button onClick={() => navigate(`${basePath}/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          Nový leták
        </Button>
      </div>

      {/* Tabs - only show when not filtered by status */}
      {!statusFilter && (
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
      )}

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
              <Button onClick={() => navigate(`${basePath}/new`)}>
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

                  {/* Rejection reason for rejected flyers */}
                  {flyer.rejectionReason && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 mb-1">Důvod zamítnutí:</p>
                          <p className="text-sm text-red-800">{flyer.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {flyer.status === 'draft' && !flyer.rejectionReason && (
                    <>
                      <Button size="sm" onClick={() => navigate(`${basePath}/${flyer.id}`)}>
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
                  {flyer.status === 'draft' && flyer.rejectionReason && (
                    <Button size="sm" onClick={() => navigate(`${basePath}/${flyer.id}`)} className="bg-orange-600 hover:bg-orange-700">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Opravit a odeslat znovu
                    </Button>
                  )}
                  {flyer.status !== 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`${basePath}/${flyer.id}`)}>
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
