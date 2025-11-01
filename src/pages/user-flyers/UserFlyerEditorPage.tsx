import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ArrowLeft, Save, Plus, Minus, Search } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FlyerPageView } from '../../components/flyer/FlyerPageView';
import { DraggableProduct } from '../../components/flyer/DraggableProduct';
import { Product, FlyerPage, FlyerSlot } from '../../types';

export const UserFlyerEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [search, setSearch] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [flyerData, setFlyerData] = useState({
    name: '',
    validFrom: '',
    validTo: '',
    pages: [
      {
        id: crypto.randomUUID(),
        pageNumber: 1,
        slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
      },
    ] as FlyerPage[],
  });

  const { data: flyer, isLoading } = useQuery({
    queryKey: ['flyers', id],
    queryFn: () => flyersService.getFlyer(id!),
    enabled: !isNew,
  });

  const { data: activeFlyers = [] } = useQuery({
    queryKey: ['flyers', 'active'],
    queryFn: () => flyersService.getActiveFlyers(),
  });

  // Load flyer data when fetched
  useEffect(() => {
    if (flyer && !isNew) {
      setFlyerData({
        name: flyer.name,
        validFrom: flyer.validFrom ? new Date(flyer.validFrom).toISOString().split('T')[0] : '',
        validTo: flyer.validTo ? new Date(flyer.validTo).toISOString().split('T')[0] : '',
        pages: flyer.pages && flyer.pages.length > 0
          ? flyer.pages.map(page => ({
              ...page,
              slots: page.slots || Array(8).fill({ type: 'empty' } as FlyerSlot),
            }))
          : [
              {
                id: crypto.randomUUID(),
                pageNumber: 1,
                slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
              },
            ],
      });
    }
  }, [flyer, isNew]);

  // Get available products from active flyers
  const availableProducts = activeFlyers.flatMap(flyer =>
    flyer.pages.flatMap(page =>
      page.slots
        .filter(slot => slot && slot.type === 'product' && slot.product)
        .map(slot => slot.product!)
    )
  );

  const uniqueProducts = Array.from(
    new Map(availableProducts.map(p => [p.id, p])).values()
  );

  const filteredProducts = uniqueProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get all product IDs that are already used in the flyer
  const usedProductIds = new Set(
    flyerData.pages.flatMap(page =>
      page.slots
        .filter(slot => slot?.type === 'product' && slot.product)
        .map(slot => slot.product!.id)
    )
  );

  const saveDraftMutation = useMutation({
    mutationFn: async (data: typeof flyerData) => {
      const pages = data.pages.map((page, index) => ({
        id: page.id,
        pageNumber: index + 1,
        slots: page.slots,
      }));

      if (isNew) {
        return flyersService.createFlyer({
          name: data.name,
          validFrom: data.validFrom,
          validTo: data.validTo,
        }).then(newFlyer =>
          flyersService.updateFlyer(newFlyer.id, { pages })
        );
      } else {
        return flyersService.saveDraft(id!, {
          name: data.name,
          validFrom: data.validFrom,
          validTo: data.validTo,
          pages,
        });
      }
    },
    onSuccess: (updatedFlyer) => {
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      if (isNew) {
        navigate(`/user-flyers/${updatedFlyer.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['flyers', id] });
      }
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const product = uniqueProducts.find(p => p.id === event.active.id);
    if (product) {
      setActiveProduct(product);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProduct(null);

    if (!over) return;

    const product = uniqueProducts.find(p => p.id === active.id);
    if (!product) return;

    const slotId = over.id as string;
    const match = slotId.match(/page-(\d+)-slot-(\d+)/);
    if (!match) return;

    const pageIndex = parseInt(match[1]);
    const slotIndex = parseInt(match[2]);

    const newPages = [...flyerData.pages];
    const newSlots = [...newPages[pageIndex].slots];
    newSlots[slotIndex] = {
      type: 'product',
      product: product,
    };
    newPages[pageIndex] = {
      ...newPages[pageIndex],
      slots: newSlots,
    };
    setFlyerData({ ...flyerData, pages: newPages });
  };

  const handleRemoveProduct = (slotIndex: number) => {
    const newPages = [...flyerData.pages];
    const newSlots = [...newPages[currentPageIndex].slots];
    newSlots[slotIndex] = { type: 'empty' };
    newPages[currentPageIndex] = {
      ...newPages[currentPageIndex],
      slots: newSlots,
    };
    setFlyerData({ ...flyerData, pages: newPages });
  };

  const handleAddPage = () => {
    const newPage: FlyerPage = {
      id: crypto.randomUUID(),
      pageNumber: flyerData.pages.length + 1,
      slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
    };
    setFlyerData({ ...flyerData, pages: [...flyerData.pages, newPage] });
    setCurrentPageIndex(flyerData.pages.length);
  };

  const handleRemovePage = () => {
    if (flyerData.pages.length <= 1) {
      alert('Leták musí mít alespoň jednu stránku');
      return;
    }
    const newPages = flyerData.pages.filter((_, i) => i !== currentPageIndex);
    setFlyerData({ ...flyerData, pages: newPages });
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/user-flyers')} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na seznam
          </Button>
        </div>

        {/* Main Content - 2 column layout */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          {/* Left sidebar - Flyer settings and actions */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">Nastavení letáku</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Název letáku
                  </label>
                  <Input
                    value={flyerData.name}
                    onChange={(e) => setFlyerData({ ...flyerData, name: e.target.value })}
                    placeholder="Název letáku"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platnost od
                  </label>
                  <Input
                    type="date"
                    value={flyerData.validFrom}
                    onChange={(e) => setFlyerData({ ...flyerData, validFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platnost do
                  </label>
                  <Input
                    type="date"
                    value={flyerData.validTo}
                    onChange={(e) => setFlyerData({ ...flyerData, validTo: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Button variant="outline" onClick={() => saveDraftMutation.mutate(flyerData)} isLoading={saveDraftMutation.isPending} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Uložit
                </Button>
              </div>
            </div>
          </div>

          {/* Middle - Flyer page editor */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">
                  Strana {currentPageIndex + 1} z {flyerData.pages.length}
                </h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleAddPage}>
                    <Plus className="w-4 h-4 mr-2" />
                    Přidat stranu
                  </Button>
                  {flyerData.pages.length > 1 && (
                    <Button variant="outline" size="sm" onClick={handleRemovePage}>
                      <Minus className="w-4 h-4 mr-2" />
                      Odebrat stranu
                    </Button>
                  )}
                </div>
              </div>

              <FlyerPageView
                page={flyerData.pages[currentPageIndex]}
                pageIndex={currentPageIndex}
                onRemoveProduct={handleRemoveProduct}
                isEditable
              />

              <div className="mt-6 flex justify-center space-x-2">
                {flyerData.pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`w-10 h-10 rounded ${
                      currentPageIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar - Product selection */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h3 className="font-bold mb-4 flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Dostupné produkty
              </h3>
              <Input
                type="text"
                placeholder="Hledat produkty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">Žádné produkty k dispozici</p>
                    <p className="text-xs mt-2">Produkty jsou dostupné pouze z aktivních letáků</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const isUsed = usedProductIds.has(product.id);
                    return (
                      <div key={product.id} className={isUsed ? 'opacity-50' : ''}>
                        <DraggableProduct product={product} />
                        {isUsed && (
                          <p className="text-xs text-gray-500 mt-1">Již použito v letáku</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeProduct && <DraggableProduct product={activeProduct} />}
      </DragOverlay>
    </DndContext>
  );
};
