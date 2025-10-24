import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CompletionBar } from '../../components/ui/CompletionBar';
import { formatDate } from '../../utils/helpers';

export const FlyersListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: flyers = [], isLoading } = useQuery({
    queryKey: ['flyers', 'my'],
    queryFn: () => flyersService.getMyFlyers(),
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Letáky</h1>
          <p className="mt-2 text-gray-600">Spravujte své propagační letáky</p>
        </div>
        <Button onClick={() => navigate('/flyers/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nový leták
        </Button>
      </div>

      {flyers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné letáky nenalezeny</h3>
          <p className="text-gray-600 mb-6">Začněte vytvořením prvního letáku</p>
          <Button onClick={() => navigate('/flyers/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Vytvořit leták
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {flyers.map(flyer => (
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
                  <div className="mt-3 max-w-xs">
                    <CompletionBar percentage={flyer.completionPercentage} showLabel={false} />
                  </div>
                </div>
                <div className="flex space-x-2">
                  {flyer.status === 'draft' && (
                    <>
                      <Button size="sm" onClick={() => navigate(`/flyers/${flyer.id}`)}>
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
                    <Button size="sm" variant="outline" onClick={() => navigate(`/flyers/${flyer.id}`)}>
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
