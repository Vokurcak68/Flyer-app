import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { Plus, Search, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FlyerPageView } from '../../components/flyer/FlyerPageView';
import { DraggableProduct } from '../../components/flyer/DraggableProduct';
import { Product, FlyerPage, FlyerSlot } from '../../types';

export const UserFlyersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [flyerData, setFlyerData] = useState({
    name: 'Můj vlastní leták',
    pages: [
      {
        id: '1',
        pageNumber: 1,
        slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
      },
    ] as FlyerPage[],
  });

  const { data: activeFlyers = [] } = useQuery({
    queryKey: ['flyers', 'active'],
    queryFn: () => flyersService.getActiveFlyers(),
  });

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
      id: Date.now().toString(),
      pageNumber: flyerData.pages.length + 1,
      slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
    };
    setFlyerData({ ...flyerData, pages: [...flyerData.pages, newPage] });
    setCurrentPageIndex(flyerData.pages.length);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <Input
              value={flyerData.name}
              onChange={(e) => setFlyerData({ ...flyerData, name: e.target.value })}
              className="text-lg font-bold max-w-md"
            />
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Uložit leták
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
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
              {filteredProducts.map(product => (
                <DraggableProduct key={product.id} product={product} />
              ))}
            </div>
          </div>

          <div className="col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Strana {currentPageIndex + 1} z {flyerData.pages.length}</h3>
              <Button variant="outline" size="sm" onClick={handleAddPage}>
                <Plus className="w-4 h-4 mr-2" />
                Přidat stranu
              </Button>
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
                    currentPageIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
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
