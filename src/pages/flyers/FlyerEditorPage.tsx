import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ArrowLeft, Save, Send, Plus, Minus, Search, FileText } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { productsService } from '../../services/productsService';
import { promoImagesService } from '../../services/promoImagesService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FlyerPageView } from '../../components/flyer/FlyerPageView';
import { DraggableProduct } from '../../components/flyer/DraggableProduct';
import { DraggablePromoImage } from '../../components/flyer/DraggablePromoImage';
import { RejectionHistory } from '../../components/flyer/RejectionHistory';
import { Product, FlyerPage, FlyerSlot } from '../../types';
import { useAutoSave } from '../../hooks/useAutoSave';

export const FlyerEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [promoSearch, setPromoSearch] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const preparePagesForAPI = (pages: FlyerPage[]): any[] => {
    return pages.map(page => ({
      pageNumber: page.pageNumber,
      footerPromoImageId: page.footerPromoImageId || null,
      slots: page.slots.map(slot => ({
        type: slot?.type || 'empty',
        productId: slot?.type === 'product' && slot.product ? slot.product.id : null,
        promoImageId: slot?.type === 'promo' && slot.promoImage ? slot.promoImage.id : null,
        promoSize: slot?.promoSize || null,
      })),
    }));
  };

  const [flyerData, setFlyerData] = useState({
    name: 'Nový leták',
    validFrom: '',
    validTo: '',
    pages: [{
      id: '1',
      pageNumber: 1,
      slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
    }] as FlyerPage[],
  });

  const { data: flyer, isLoading } = useQuery({
    queryKey: ['flyers', id],
    queryFn: () => flyersService.getFlyer(id!),
    enabled: !isNew,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'flyer-editor', search, productPage],
    queryFn: () => productsService.getProducts({
      search: search || undefined,
      page: productPage,
      limit: 20,
      isActive: true,
    }),
  });

  // Při změně stránky nebo při prvním načtení přidáme produkty do seznamu
  useEffect(() => {
    if (productsData?.data) {
      if (productPage === 1) {
        setAllProducts(productsData.data);
      } else {
        setAllProducts(prev => [...prev, ...productsData.data]);
      }
    }
  }, [productsData, productPage]);

  // Resetovat stránku při změně vyhledávání
  useEffect(() => {
    setProductPage(1);
    setAllProducts([]);
  }, [search]);

  const { data: promoImages = [] } = useQuery({
    queryKey: ['promo-images'],
    queryFn: () => promoImagesService.getPromoImages(),
  });

  useEffect(() => {
    if (flyer) {
      setFlyerData({
        name: flyer.name,
        validFrom: flyer.validFrom ? new Date(flyer.validFrom).toISOString().split('T')[0] : '',
        validTo: flyer.validTo ? new Date(flyer.validTo).toISOString().split('T')[0] : '',
        pages: flyer.pages.length > 0 ? flyer.pages : [{
          id: '1',
          pageNumber: 1,
          slots: Array(8).fill({ type: 'empty' } as FlyerSlot),
        }],
      });
    }
  }, [flyer]);

  const saveDraftMutation = useMutation({
    mutationFn: async (data: typeof flyerData) => {
      if (isNew) {
        const created = await flyersService.createFlyer({
          name: data.name,
          validFrom: data.validFrom,
          validTo: data.validTo,
        });
        return flyersService.updateFlyer(created.id, {
          name: data.name,
          validFrom: data.validFrom,
          validTo: data.validTo,
          pages: preparePagesForAPI(data.pages)
        });
      }
      return flyersService.updateFlyer(id!, {
        name: data.name,
        validFrom: data.validFrom,
        validTo: data.validTo,
        pages: preparePagesForAPI(data.pages),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      if (isNew) navigate(`/flyers/${data.id}`, { replace: true });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const created = await flyersService.createFlyer({
          name: flyerData.name,
          validFrom: flyerData.validFrom,
          validTo: flyerData.validTo,
        });
        await flyersService.updateFlyer(created.id, {
          pages: preparePagesForAPI(flyerData.pages)
        });
        await flyersService.submitForApproval(created.id);
        return created;
      }
      await flyersService.updateFlyer(id!, {
        name: flyerData.name,
        validFrom: flyerData.validFrom,
        validTo: flyerData.validTo,
      });
      return flyersService.submitForApproval(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      navigate('/flyers');
    },
  });

  const { isSaving, lastSaved } = useAutoSave({
    data: flyerData,
    onSave: async (data) => {
      if (!isNew) await saveDraftMutation.mutateAsync(data);
    },
    delay: 120000, // 2 minutes
    enabled: !isNew,
  });

  const handleViewPdf = async () => {
    if (isNew || !id) {
      alert('Prosím nejdříve uložte leták');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      let pdfBlob: Blob;

      if (flyer?.status === 'draft') {
        // For drafts, always generate new PDF
        await flyersService.generatePdf(id);
        pdfBlob = await flyersService.getPdfBlob(id, true);
      } else {
        // For non-drafts (pending_approval, approved, active), only show saved PDF
        pdfBlob = await flyersService.getPdfBlob(id, false);
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(blobUrl, `pdf_${id}_${Date.now()}`);
      if (!newWindow) {
        alert('Povolte vyskakovací okna');
        URL.revokeObjectURL(blobUrl);
      } else {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
    } catch (error) {
      alert('Chyba při zobrazení PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const product = allProducts.find(p => p.id === event.active.id);
    if (product) setActiveProduct(product);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProduct(null);
    if (!over) return;

    const dropId = over.id as string;

    // Footer drop
    const footerMatch = dropId.match(/page-(\d+)-footer/);
    if (footerMatch) {
      const pageIndex = parseInt(footerMatch[1]);
      const promoId = active.id.toString().startsWith('promo-') ? active.id.toString().replace('promo-', '') : null;
      const promo = promoId ? promoImages.find(p => p.id === promoId) : null;

      if (promo && promo.defaultSize === 'footer') {
        const newPages = [...flyerData.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], footerPromoImage: promo, footerPromoImageId: promo.id };
        setFlyerData({ ...flyerData, pages: newPages });
      } else if (promo) {
        alert('Do patičky pouze promo s velikostí "Patička"');
      }
      return;
    }

    // Slot drop
    const slotMatch = dropId.match(/page-(\d+)-slot-(\d+)/);
    if (!slotMatch) return;

    const pageIndex = parseInt(slotMatch[1]);
    const slotIndex = parseInt(slotMatch[2]);

    const product = allProducts.find(p => p.id === active.id);
    const promoId = active.id.toString().startsWith('promo-') ? active.id.toString().replace('promo-', '') : null;
    const promo = promoId ? promoImages.find(p => p.id === promoId) : null;

    const newPages = [...flyerData.pages];
    const newSlots = [...newPages[pageIndex].slots];

    if (product) {
      newSlots[slotIndex] = { type: 'product', product };
    } else if (promo) {
      if (promo.defaultSize === 'footer') {
        alert('Promo "Patička" pouze do patičky na stránce 1');
        return;
      }
      newSlots[slotIndex] = { type: 'promo', promoImage: promo, promoSize: promo.defaultSize };
    } else return;

    newPages[pageIndex] = { ...newPages[pageIndex], slots: newSlots };
    setFlyerData({ ...flyerData, pages: newPages });
  };

  const handleRemoveFooter = () => {
    const newPages = [...flyerData.pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], footerPromoImage: null, footerPromoImageId: null };
    setFlyerData({ ...flyerData, pages: newPages });
  };

  const handleRemoveProduct = (slotIndex: number) => {
    const newPages = [...flyerData.pages];
    const newSlots = [...newPages[currentPageIndex].slots];
    newSlots[slotIndex] = { type: 'empty' };
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], slots: newSlots };
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

  const handleRemovePage = (index: number) => {
    if (flyerData.pages.length === 1) {
      alert('Nelze smazat poslední stránku');
      return;
    }
    const newPages = flyerData.pages.filter((_, i) => i !== index);
    setFlyerData({ ...flyerData, pages: newPages });
    if (currentPageIndex >= newPages.length) setCurrentPageIndex(newPages.length - 1);
  };

  const handleSubmit = async () => {
    if (!flyerData.validFrom || !flyerData.validTo) {
      alert('Nastavte období platnosti');
      return;
    }
    await submitMutation.mutateAsync();
  };

  // Get all product IDs that are already used in the flyer
  const usedProductIds = new Set(
    flyerData.pages.flatMap(page =>
      page.slots
        .filter(slot => slot?.type === 'product' && slot.product)
        .map(slot => slot.product!.id)
    )
  );

  const filteredProducts = allProducts;

  const filteredPromoImages = promoImages.filter(p =>
    p.name.toLowerCase().includes(promoSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/flyers')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět
              </Button>
              <Input
                value={flyerData.name}
                onChange={(e) => setFlyerData({ ...flyerData, name: e.target.value })}
                className="text-lg font-bold border-0 border-b-2 rounded-none focus:ring-0"
              />
              <span className="text-sm text-gray-500">
                {isSaving ? 'Ukládání...' : lastSaved ? `Uloženo ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleViewPdf} isLoading={isGeneratingPdf} disabled={isNew}>
                <FileText className="w-4 h-4 mr-2" />
                {flyer?.status === 'draft' ? 'Generuj PDF' : 'Zobrazit PDF'}
              </Button>
              <Button variant="outline" onClick={() => saveDraftMutation.mutate(flyerData)} isLoading={saveDraftMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Uložit
              </Button>
              <Button onClick={handleSubmit} isLoading={submitMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                Odeslat
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              type="date"
              label="Platnost od"
              value={flyerData.validFrom}
              onChange={(e) => setFlyerData({ ...flyerData, validFrom: e.target.value })}
            />
            <Input
              type="date"
              label="Platnost do"
              value={flyerData.validTo}
              onChange={(e) => setFlyerData({ ...flyerData, validTo: e.target.value })}
            />
          </div>
        </div>

        {/* Rejection History */}
        <RejectionHistory approvals={flyer?.approvals} rejectionReason={flyer?.rejectionReason} />

        {/* Page Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Stránka {currentPageIndex + 1} / {flyerData.pages.length}</h3>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {flyerData.pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`w-10 h-10 rounded ${
                      currentPageIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleRemovePage(currentPageIndex)} disabled={flyerData.pages.length === 1}>
                  <Minus className="w-4 h-4 mr-1" />
                  Odebrat
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddPage}>
                  <Plus className="w-4 h-4 mr-1" />
                  Přidat
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-5 gap-6">
          {/* Left: Products & Promos */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-4 flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Produkty
              </h3>
              <Input
                placeholder="Hledat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {isLoadingProducts && productPage === 1 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Žádné produkty
                  </p>
                ) : (
                  <>
                    {filteredProducts.map(product => (
                      <DraggableProduct
                        key={product.id}
                        product={product}
                        isUsed={usedProductIds.has(product.id)}
                      />
                    ))}
                    {productsData && productsData.total > allProducts.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductPage(prev => prev + 1)}
                        isLoading={isLoadingProducts}
                        className="w-full mt-2"
                      >
                        Načíst více ({allProducts.length} z {productsData.total})
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Promo obrázky
              </h3>
              <Input
                placeholder="Hledat promo..."
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredPromoImages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {promoImages.length === 0 ? (
                      <>Žádné promo obrázky.<br />Nahrajte je v sekci "Promo obrázky"</>
                    ) : (
                      'Nenalezeny žádné výsledky'
                    )}
                  </p>
                ) : (
                  filteredPromoImages.map(promo => <DraggablePromoImage key={promo.id} promoImage={promo} />)
                )}
              </div>
            </div>
          </div>

          {/* Right: Flyer Preview */}
          <div className="col-span-3">
            <FlyerPageView
              page={flyerData.pages[currentPageIndex]}
              pageIndex={currentPageIndex}
              onRemoveProduct={handleRemoveProduct}
              onRemoveFooter={handleRemoveFooter}
              isEditable
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeProduct && <DraggableProduct product={activeProduct} />}
      </DragOverlay>
    </DndContext>
  );
};
