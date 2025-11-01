import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { ArrowLeft, Save, Send, Plus, Minus, Search, FileText, AlertCircle, Copy, XCircle } from 'lucide-react';
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
import { useAuthStore } from '../../store/authStore';

export const FlyerEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isNew = id === 'new';

  // Determine base path based on current location
  const isMyFlyers = location.pathname.startsWith('/my-flyers');
  const basePath = isMyFlyers ? '/my-flyers' : '/flyers';

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [promoSearch, setPromoSearch] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const previousSearchRef = useRef(search);
  const [activeTab, setActiveTab] = useState<'products' | 'promos'>('products');

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

  // Check if flyer is locked for editing (active, pending_approval, or expired status)
  const isLocked = flyer?.status === 'active' || flyer?.status === 'pending_approval' || flyer?.status === 'expired';

  // For end users, get products from active flyers instead of all products
  const { data: activeFlyers = [] } = useQuery({
    queryKey: ['flyers', 'active'],
    queryFn: () => flyersService.getActiveFlyers(),
    enabled: isMyFlyers, // Only fetch for end users
  });

  // For suppliers, fetch products normally
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'flyer-editor', search, productPage],
    queryFn: () => productsService.getProducts({
      search: search || undefined,
      page: productPage,
      limit: 20,
      isActive: true,
    }),
    enabled: !isMyFlyers, // Only fetch for suppliers
  });

  // Při změně stránky nebo při prvním načtení přidáme produkty do seznamu
  useEffect(() => {
    if (isMyFlyers) {
      // For end users: extract products from active flyers
      if (activeFlyers.length > 0) {
        const productsFromActiveFlyers = activeFlyers.flatMap(flyer =>
          flyer.pages.flatMap(page =>
            page.slots
              .filter(slot => slot && slot.type === 'product' && slot.product)
              .map(slot => slot.product!)
          )
        );

        // Remove duplicates by product ID
        const uniqueProducts = Array.from(
          new Map(productsFromActiveFlyers.map(p => [p.id, p])).values()
        );

        // Apply search filter
        const filtered = search
          ? uniqueProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
          : uniqueProducts;

        setAllProducts(filtered);
      } else {
        setAllProducts([]);
      }
    } else {
      // For suppliers: use normal product pagination
      if (productsData?.data) {
        // Pokud se změnil search, resetuj seznam
        if (previousSearchRef.current !== search) {
          previousSearchRef.current = search;
          setProductPage(1);
          setAllProducts(productsData.data);
        } else {
          // Normální paginace - přidej nebo nahraď
          if (productPage === 1) {
            setAllProducts(productsData.data);
          } else {
            setAllProducts(prev => [...prev, ...productsData.data]);
          }
        }
      }
    }
  }, [productsData, productPage, search, isMyFlyers, activeFlyers]);

  const { data: promoImages = [] } = useQuery({
    queryKey: ['promo-images', user?.role],
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
      if (isNew) navigate(`${basePath}/${data.id}`, { replace: true });
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
      // Invalidate both detail and list queries to refresh rejection status
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      queryClient.invalidateQueries({ queryKey: ['flyers', 'my'] });
      navigate(basePath);
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
    if (!over || isLocked) return; // Prevent drag & drop when locked

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

  const handleCreateCopy = async () => {
    if (!flyer) return;

    // Create new flyer with copied data
    try {
      const newFlyer = await flyersService.createFlyer({
        name: `${flyer.name} (kopie)`,
        validFrom: flyer.validFrom || '',
        validTo: flyer.validTo || '',
      });

      // Copy pages structure
      if (flyer.pages && flyer.pages.length > 0) {
        await flyersService.updateFlyer(newFlyer.id, {
          pages: preparePagesForAPI(flyer.pages),
        });
      }

      // Navigate to the new flyer
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      navigate(`${basePath}/${newFlyer.id}`);
    } catch (error) {
      console.error('Error creating flyer copy:', error);
      alert('Chyba při vytváření kopie letáku');
    }
  };

  const expireMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No flyer ID');
      return flyersService.expireFlyer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      queryClient.invalidateQueries({ queryKey: ['flyers', id] });
      alert('Leták byl ukončen a produkty jsou nyní volné k editaci');
    },
    onError: (error: any) => {
      console.error('Error expiring flyer:', error);
      alert('Chyba při ukončování letáku: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleExpireFlyer = async () => {
    if (!window.confirm('Opravdu chcete ukončit platnost tohoto letáku? Datum platnosti bude nastaveno na včerejší den a produkty budou uvolněny k editaci.')) {
      return;
    }
    await expireMutation.mutateAsync();
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
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Rejection History - Full Width Top */}
        <RejectionHistory approvals={flyer?.approvals} rejectionReason={flyer?.rejectionReason} />

        {/* Locked Flyer Warning */}
        {isLocked && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Leták je ve stavu "{
                    flyer?.status === 'active' ? 'aktivní' :
                    flyer?.status === 'expired' ? 'vypršelý' :
                    'ke schválení'
                  }".</strong> Editace letáku je zakázána.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - 2 column layout */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          {/* Left Column: Controls & Products/Promos */}
          <div className="col-span-2 flex flex-col gap-6">
            {/* Header Panel */}
            <div className="bg-white rounded-lg shadow p-4 flex-shrink-0">
              <div className="mb-4">
                <Button variant="outline" onClick={() => navigate(basePath)} size="sm" className="mb-3">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zpět
                </Button>
                <Input
                  value={flyerData.name}
                  onChange={(e) => setFlyerData({ ...flyerData, name: e.target.value })}
                  className="text-lg font-bold border-0 border-b-2 rounded-none focus:ring-0 mb-2"
                  placeholder="Název letáku"
                  disabled={isLocked}
                />
                <span className="text-xs text-gray-500">
                  {isSaving ? 'Ukládání...' : lastSaved ? `Uloženo ${lastSaved.toLocaleTimeString()}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Input
                  type="date"
                  label="Platnost od"
                  value={flyerData.validFrom}
                  onChange={(e) => setFlyerData({ ...flyerData, validFrom: e.target.value })}
                  disabled={isLocked}
                />
                <Input
                  type="date"
                  label="Platnost do"
                  value={flyerData.validTo}
                  onChange={(e) => setFlyerData({ ...flyerData, validTo: e.target.value })}
                  disabled={isLocked}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Button variant="outline" onClick={handleViewPdf} isLoading={isGeneratingPdf} disabled={isNew} size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  {flyer?.status === 'draft' ? 'Generuj PDF' : 'Zobrazit PDF'}
                </Button>
                {!isNew && (
                  <Button variant="outline" onClick={handleCreateCopy} size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Vytvořit kopii
                  </Button>
                )}
                {flyer?.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={handleExpireFlyer}
                    isLoading={expireMutation.isPending}
                    size="sm"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Ukončit platnost
                  </Button>
                )}
                <Button variant="outline" onClick={() => saveDraftMutation.mutate(flyerData)} isLoading={saveDraftMutation.isPending} disabled={isLocked} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Uložit
                </Button>
                <Button onClick={handleSubmit} isLoading={submitMutation.isPending} disabled={isLocked} size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Odeslat k autorizaci
                </Button>
              </div>
            </div>

            {/* Products & Promos with Tabs */}
            <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden max-h-[680px]">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'products'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Produkty
                </button>
                <button
                  onClick={() => setActiveTab('promos')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    activeTab === 'promos'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Promo obrázky
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 flex-1 flex flex-col overflow-hidden">
                {activeTab === 'products' ? (
                  <>
                    <Input
                      placeholder="Hledat produkty..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="mb-4 flex-shrink-0"
                    />
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {(!isMyFlyers && isLoadingProducts && productPage === 1) ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          {isMyFlyers ? 'Žádné produkty v aktivních letácích' : 'Žádné produkty'}
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
                          {!isMyFlyers && productsData && productsData.meta.total > allProducts.length && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProductPage(prev => prev + 1)}
                              isLoading={isLoadingProducts}
                              className="w-full mt-2"
                            >
                              Načíst více ({allProducts.length} z {productsData.meta.total})
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder="Hledat promo obrázky..."
                      value={promoSearch}
                      onChange={(e) => setPromoSearch(e.target.value)}
                      className="mb-4 flex-shrink-0"
                    />
                    <div className="space-y-2 flex-1 overflow-y-auto">
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Flyer Preview */}
          <div className="col-span-3">
            {/* Flyer Preview */}
            <FlyerPageView
              page={flyerData.pages[currentPageIndex]}
              pageIndex={currentPageIndex}
              onRemoveProduct={handleRemoveProduct}
              onRemoveFooter={handleRemoveFooter}
              isEditable={!isLocked}
            />
          </div>
        </div>

        {/* Page Navigation - Full Width Bottom */}
        <div className="bg-white rounded-lg shadow p-4">
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
                <Button variant="outline" size="sm" onClick={() => handleRemovePage(currentPageIndex)} disabled={flyerData.pages.length === 1 || isLocked}>
                  <Minus className="w-4 h-4 mr-1" />
                  Odebrat
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddPage} disabled={isLocked}>
                  <Plus className="w-4 h-4 mr-1" />
                  Přidat
                </Button>
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
