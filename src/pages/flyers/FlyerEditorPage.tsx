import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Save, Send, Plus, Minus, Search, FileText, AlertCircle, Copy, XCircle, GripVertical } from 'lucide-react';
import { flyersService } from '../../services/flyersService';
import { productsService } from '../../services/productsService';
import { promoImagesService } from '../../services/promoImagesService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FlyerPageView } from '../../components/flyer/FlyerPageView';
import { DraggableProduct } from '../../components/flyer/DraggableProduct';
import { DraggablePromoImage } from '../../components/flyer/DraggablePromoImage';
import { RejectionHistory } from '../../components/flyer/RejectionHistory';
import { ValidationErrorsModal } from '../../components/flyer/ValidationErrorsModal';
import { Product, FlyerPage, FlyerSlot } from '../../types';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useAuthStore } from '../../store/authStore';

// Sortable Page Button Component
const SortablePageButton: React.FC<{
  id: string;
  index: number;
  isActive: boolean;
  isFirst: boolean;
  isLocked: boolean;
  onClick: () => void;
}> = ({ id, index, isActive, isFirst, isLocked, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isFirst || isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {!isFirst && !isLocked && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-1">
          <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </div>
      )}
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded ${
          isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
        } ${isFirst ? 'ml-5' : ''}`}
      >
        {index + 1}
      </button>
    </div>
  );
};

export const FlyerEditorPage: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Determine if this is a new flyer based on URL
  const isNewFromUrl = location.pathname.endsWith('/new');
  const id = isNewFromUrl ? 'new' : params.id;
  const isNew = id === 'new';

  // Debug: Log component mount and URL changes
  console.log('🔍 FlyerEditorPage render - params:', params, 'id:', id, 'location:', location.pathname, 'isNewFromUrl:', isNewFromUrl);

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
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Sensors for drag and drop - use PointerSensor with distance to prevent conflicts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

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
    actionId: undefined as number | undefined,
    actionName: undefined as string | undefined,
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

  // Load actions from ERP
  const { data: actions = [] } = useQuery({
    queryKey: ['flyers', 'actions'],
    queryFn: () => flyersService.getActions(),
  });

  // Check if flyer is locked for editing
  // For end users on /my-flyers: only lock if expired
  // For suppliers: lock if active, pending_approval, or expired
  const isLocked = isMyFlyers && user?.role === 'end_user'
    ? flyer?.status === 'expired'
    : (flyer?.status === 'active' || flyer?.status === 'pending_approval' || flyer?.status === 'expired');

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

        // Only update if different
        setAllProducts(prev => {
          if (JSON.stringify(prev.map(p => p.id)) === JSON.stringify(filtered.map(p => p.id))) {
            return prev;
          }
          return filtered;
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsData, productPage, search, isMyFlyers, activeFlyers.length]);

  const { data: promoImages = [] } = useQuery({
    queryKey: ['promo-images', user?.role],
    queryFn: () => promoImagesService.getPromoImages(),
  });

  useEffect(() => {
    if (flyer) {
      setFlyerData({
        name: flyer.name,
        actionId: flyer.actionId,
        actionName: flyer.actionName,
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
      const wasNew = id === 'new';
      console.log('🔍 saveDraftMutation - id:', id, 'wasNew:', wasNew);

      if (wasNew) {
        console.log('🔍 Creating new flyer...');
        const created = await flyersService.createFlyer({
          name: data.name,
          actionId: data.actionId,
          actionName: data.actionName,
          validFrom: data.validFrom || undefined,
          validTo: data.validTo || undefined,
        });
        console.log('🔍 Flyer created with ID:', created.id);

        const updated = await flyersService.updateFlyer(created.id, {
          name: data.name,
          actionId: data.actionId,
          actionName: data.actionName,
          validFrom: data.validFrom || undefined,
          validTo: data.validTo || undefined,
          pages: preparePagesForAPI(data.pages)
        });
        console.log('🔍 Flyer updated, returning with wasNew flag');
        return { ...updated, wasNew: true };
      }

      if (!id) {
        throw new Error('Flyer ID is missing');
      }

      console.log('🔍 Updating existing flyer with ID:', id);
      return flyersService.updateFlyer(id, {
        name: data.name,
        actionId: data.actionId,
        actionName: data.actionName,
        validFrom: data.validFrom || undefined,
        validTo: data.validTo || undefined,
        pages: preparePagesForAPI(data.pages),
      });
    },
    onSuccess: (data) => {
      console.log('🔍 saveDraftMutation success, data:', data);
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      if ((data as any).wasNew) {
        console.log('🔍 Navigating to:', `${basePath}/${data.id}`);
        navigate(`${basePath}/${data.id}`, { replace: true });
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const created = await flyersService.createFlyer({
          name: flyerData.name,
          actionId: flyerData.actionId,
          actionName: flyerData.actionName,
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
        actionId: flyerData.actionId,
        actionName: flyerData.actionName,
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

      // For end users on /my-flyers, always generate new PDF
      if (isMyFlyers && user?.role === 'end_user') {
        await flyersService.generatePdf(id);
        pdfBlob = await flyersService.getPdfBlob(id, true);
      } else if (flyer?.status === 'draft') {
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

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if this is a page reordering event
    if (activeId.startsWith('page-button-') && overId.startsWith('page-button-')) {
      const oldIndex = parseInt(activeId.replace('page-button-', ''));
      const newIndex = parseInt(overId.replace('page-button-', ''));

      // Don't allow moving to/from first position (page 0)
      if (oldIndex === 0 || newIndex === 0 || oldIndex === newIndex) return;

      const newPages = arrayMove(flyerData.pages, oldIndex, newIndex);
      // Update page numbers to match new order
      const updatedPages = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      setFlyerData({ ...flyerData, pages: updatedPages });

      // Update current page index if needed
      if (currentPageIndex === oldIndex) {
        setCurrentPageIndex(newIndex);
      } else if (currentPageIndex === newIndex) {
        setCurrentPageIndex(oldIndex < newIndex ? currentPageIndex - 1 : currentPageIndex + 1);
      } else if (oldIndex < currentPageIndex && newIndex >= currentPageIndex) {
        setCurrentPageIndex(currentPageIndex - 1);
      } else if (oldIndex > currentPageIndex && newIndex <= currentPageIndex) {
        setCurrentPageIndex(currentPageIndex + 1);
      }

      return;
    }

    const dropId = overId;

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
      // Validate header promos - only on first page and top row
      if (promo.defaultSize === 'header_2x1' || promo.defaultSize === 'header_2x2') {
        if (pageIndex !== 0) {
          alert('Hlavičky lze vložit pouze na první stránku');
          return;
        }
        if (slotIndex !== 0 && slotIndex !== 1) {
          alert('Hlavičky lze vložit pouze do horního řádku (první dva sloty)');
          return;
        }
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
    // Zakázat smazání první stránky (pageNumber === 1), protože je jiná (má footer)
    if (flyerData.pages[index].pageNumber === 1) {
      alert('Nelze smazat první stránku, protože má specifický layout s paticí');
      return;
    }
    const newPages = flyerData.pages.filter((_, i) => i !== index);
    setFlyerData({ ...flyerData, pages: newPages });
    if (currentPageIndex >= newPages.length) setCurrentPageIndex(newPages.length - 1);
  };

  const handleSubmit = async () => {
    // Check if action is selected
    if (!flyerData.actionId || !flyerData.actionName) {
      alert('Není vybrána žádná akce');
      return;
    }

    if (!flyerData.validFrom || !flyerData.validTo) {
      alert('Nastavte období platnosti');
      return;
    }

    // Validate flyer before submitting
    if (!id || id === 'new') {
      alert('Nejprve uložte leták');
      return;
    }

    try {
      // Submit directly - backend will perform all validations
      await submitMutation.mutateAsync();
    } catch (error: any) {
      console.error('Chyba při odesílání letáku:', error);

      // Check if error response contains validation errors
      if (error?.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setShowValidationModal(true);
      } else {
        const errorMessage = error?.response?.data?.message || 'Chyba při odesílání letáku. Zkuste to znovu.';
        alert(errorMessage);
      }
    }
  };

  const createCopyMutation = useMutation({
    mutationFn: async () => {
      if (!flyer) throw new Error('No flyer data');

      // Create new flyer with copied data
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

      return newFlyer;
    },
    onSuccess: (newFlyer) => {
      // Navigate to the new flyer
      queryClient.invalidateQueries({ queryKey: ['flyers'] });
      navigate(`${basePath}/${newFlyer.id}`);
    },
    onError: (error) => {
      console.error('Error creating flyer copy:', error);
      alert('Chyba při vytváření kopie letáku');
    },
  });

  const handleCreateCopy = () => {
    createCopyMutation.mutate();
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                <div className="flex gap-2 items-end mb-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Add highlight parameter to scroll back to this flyer
                      const flyerId = params.id;
                      if (flyerId && flyerId !== 'new') {
                        navigate(`${basePath}?highlight=${flyerId}`);
                      } else {
                        navigate(basePath);
                      }
                    }}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět
                  </Button>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Název akce
                    </label>
                    <select
                      value={flyerData.actionId || ''}
                      onChange={(e) => {
                        const selectedActionId = e.target.value ? parseInt(e.target.value) : undefined;
                        const selectedAction = actions.find(a => a.id === selectedActionId);
                        setFlyerData({
                          ...flyerData,
                          actionId: selectedActionId,
                          actionName: selectedAction?.name,
                          // Auto-fill validity dates from selected action
                          validFrom: selectedAction?.validFrom || flyerData.validFrom,
                          validTo: selectedAction?.validTo || flyerData.validTo,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={isLocked}
                    >
                      <option value="">Vyberte akci</option>
                      {actions.map((action) => (
                        <option key={action.id} value={action.id}>
                          {action.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
                  disabled={true}
                />
                <Input
                  type="date"
                  label="Platnost do"
                  value={flyerData.validTo}
                  onChange={(e) => setFlyerData({ ...flyerData, validTo: e.target.value })}
                  disabled={true}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Button variant="outline" onClick={handleViewPdf} isLoading={isGeneratingPdf} disabled={isNew} size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  {(isMyFlyers && user?.role === 'end_user') ? 'Generuj PDF' : (flyer?.status === 'draft' ? 'Generuj PDF' : 'Zobrazit PDF')}
                </Button>
                {!isNew && (
                  <Button
                    variant="outline"
                    onClick={handleCreateCopy}
                    isLoading={createCopyMutation.isPending}
                    disabled={createCopyMutation.isPending}
                    size="sm"
                  >
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
                {/* Hide submit button for end users on /my-flyers */}
                {!(isMyFlyers && user?.role === 'end_user') && (
                  <Button onClick={handleSubmit} isLoading={submitMutation.isPending || isValidating} disabled={isLocked} size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    {isValidating ? 'Validuji...' : 'Odeslat k autorizaci'}
                  </Button>
                )}
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
              validFrom={flyerData.validFrom}
              validTo={flyerData.validTo}
            />
          </div>
        </div>

        {/* Page Navigation - Full Width Bottom */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="font-bold flex-shrink-0">Stránka {currentPageIndex + 1} / {flyerData.pages.length}</h3>
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <SortableContext
                items={flyerData.pages.map((_, index) => `page-button-${index}`)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex space-x-2 overflow-x-auto flex-1 min-w-0 pb-1">
                  {flyerData.pages.map((_, index) => (
                    <SortablePageButton
                      key={`page-button-${index}`}
                      id={`page-button-${index}`}
                      index={index}
                      isActive={currentPageIndex === index}
                      isFirst={index === 0}
                      isLocked={isLocked}
                      onClick={() => setCurrentPageIndex(index)}
                    />
                  ))}
                </div>
              </SortableContext>
              <div className="flex space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePage(currentPageIndex)}
                  disabled={flyerData.pages.length === 1 || flyerData.pages[currentPageIndex]?.pageNumber === 1 || isLocked}
                >
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

      {/* Validation Errors Modal */}
      <ValidationErrorsModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={validationErrors}
        flyerName={flyerData.name}
      />
    </DndContext>
  );
};
