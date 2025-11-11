import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload, Image as ImageIcon, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { productsService } from '../../services/productsService';
import { brandsService } from '../../services/brandsService';
import { categoriesService } from '../../services/categoriesService';
import iconsService from '../../services/iconsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ProductFlyerLayout } from '../../components/product/ProductFlyerLayout';
import { Product } from '../../types';
import DuplicateEanDialog from '../../components/product/DuplicateEanDialog';
import { AppFooter } from '../../components/layout/AppFooter';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const API_URL = process.env.REACT_APP_API_URL || '/api';

  const [formData, setFormData] = useState({
    ean: '',
    name: '',
    description: '',
    supplierNote: '',
    brandId: '',
    categoryId: '',
    subcategoryId: '',
    price: 0,
    originalPrice: 0,
    imageData: '',
    imageMimeType: '',
    iconIds: [] as string[],
    installationType: '' as 'BUILT_IN' | 'FREESTANDING' | '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [activeIconTab, setActiveIconTab] = useState<'energy' | 'other'>('other');
  const [isInActiveFlyer, setIsInActiveFlyer] = useState(false);
  const [eanValidation, setEanValidation] = useState<{
    eanFound: boolean | null;
    priceMatch: boolean | null;
    originalPriceMatch: boolean | null;
    isLoading: boolean;
  }>({
    eanFound: null,
    priceMatch: null,
    originalPriceMatch: null,
    isLoading: false,
  });
  const [duplicateEanDialog, setDuplicateEanDialog] = useState<{
    isOpen: boolean;
    existingProduct: Product | null;
    count: number;
    mode: 'blocking' | 'informational';
  }>({
    isOpen: false,
    existingProduct: null,
    count: 0,
    mode: 'blocking',
  });
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', 'my'],
    queryFn: () => brandsService.getMyBrands(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAllCategories(),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', formData.categoryId],
    queryFn: () => categoriesService.getSubcategories(formData.categoryId),
    enabled: !!formData.categoryId,
  });

  const { data: icons = [] } = useQuery({
    queryKey: ['icons'],
    queryFn: () => iconsService.getAllIcons(),
  });

  const { data: product } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsService.getProduct(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ean: product.eanCode,
        name: product.name,
        description: product.description || '',
        supplierNote: (product as any).supplierNote || '',
        brandId: product.brandId,
        categoryId: (product as any).categoryId || '',
        subcategoryId: (product as any).subcategoryId || '',
        price: product.price,
        originalPrice: product.originalPrice || 0,
        imageData: '',
        imageMimeType: '',
        iconIds: product.icons?.map(i => i.id) || [],
        installationType: (product as any).installationType || '',
      });
      // Set preview from API endpoint if product has image
      if (id) {
        setImagePreview(`${API_URL}/products/${id}/image`);
      }

      // Check if product is in active approved flyer
      setIsInActiveFlyer((product as any).isInActiveFlyer || false);

      // Validate EAN when loading existing product
      const validateProductEAN = async () => {
        if (product.eanCode) {
          setEanValidation({
            eanFound: null,
            priceMatch: null,
            originalPriceMatch: null,
            isLoading: true,
          });
          try {
            const result = await productsService.validateEAN(
              product.eanCode,
              product.price,
              product.originalPrice || 0,
            );

            // Check individual price matches
            const priceMatch = result.found && result.erpPrice === product.price;
            const originalPriceMatch = result.found && result.erpOriginalPrice === (product.originalPrice || 0);

            setEanValidation({
              eanFound: result.found,
              priceMatch,
              originalPriceMatch,
              isLoading: false,
            });
          } catch (error) {
            console.error('Error validating EAN:', error);
            setEanValidation({
              eanFound: false,
              priceMatch: false,
              originalPriceMatch: false,
              isLoading: false,
            });
          }
        }
      };

      validateProductEAN();
    } else if (!isEdit && searchParams.get('copyFrom')) {
      // Načítáme kopii produktu - data ze sessionStorage
      const copyFromId = searchParams.get('copyFrom');

      console.log('=== NAČÍTÁNÍ KOPIE PRODUKTU V useEffect ===');
      console.log('copyFromId:', copyFromId);

      // Načteme data ze sessionStorage
      const imageData = sessionStorage.getItem('copyProductImage');
      const imageMimeType = sessionStorage.getItem('copyProductImageMimeType');

      console.log('Data ze sessionStorage:');
      console.log('- imageData existuje:', !!imageData);
      console.log('- imageData délka:', imageData?.length);
      console.log('- imageData náhled:', imageData?.substring(0, 50));
      console.log('- imageMimeType:', imageMimeType);

      // Nastavíme formData s daty ze sessionStorage
      setFormData({
        ean: searchParams.get('ean') || '',
        name: searchParams.get('name') || '',
        description: searchParams.get('description') || '',
        supplierNote: searchParams.get('supplierNote') || '',
        brandId: searchParams.get('brandId') || '',
        categoryId: searchParams.get('categoryId') || '',
        subcategoryId: searchParams.get('subcategoryId') || '',
        price: parseFloat(searchParams.get('price') || '0'),
        originalPrice: parseFloat(searchParams.get('originalPrice') || '0'),
        imageData: imageData || '',
        imageMimeType: imageMimeType || '',
        iconIds: searchParams.get('iconIds') ? JSON.parse(searchParams.get('iconIds')!) : [],
        installationType: (searchParams.get('installationType') as 'BUILT_IN' | 'FREESTANDING' | '') || '',
      });

      console.log('FormData nastavena s imageData délkou:', imageData?.length || 0);

      // Nastavíme preview
      if (imageData && imageMimeType) {
        const imageUrl = `${API_URL}/products/${copyFromId}/image`;
        setImagePreview(imageUrl);
        console.log('Preview nastaven na:', imageUrl);
      }

      // DŮLEŽITÉ: Resetujeme isInActiveFlyer na false, protože kopie je nový produkt
      setIsInActiveFlyer(false);

      // Vymažeme data ze sessionStorage po použití
      sessionStorage.removeItem('copyProductImage');
      sessionStorage.removeItem('copyProductImageMimeType');
      console.log('SessionStorage vyčištěn');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, brands, searchParams.get('copyFrom')]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Prosím vyberte obrázek');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Obrázek je příliš velký. Maximální velikost je 5MB.');
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data:image/...;base64, prefix
      const base64Data = base64String.split(',')[1];

      setFormData({
        ...formData,
        imageData: base64Data,
        imageMimeType: file.type,
      });
      setImagePreview(base64String); // Use full data URL for preview
    };
    reader.readAsDataURL(file);
  };

  const handleErpValidation = async () => {
    if (!formData.ean || formData.ean.length < 8) {
      return;
    }

    setEanValidation({
      eanFound: null,
      priceMatch: null,
      originalPriceMatch: null,
      isLoading: true,
    });

    try {
      const result = await productsService.validateEAN(
        formData.ean,
        formData.price,
        formData.originalPrice || 0,
      );

      // Check individual price matches
      const priceMatch = result.found && result.erpPrice === formData.price;
      const originalPriceMatch = result.found && result.erpOriginalPrice === (formData.originalPrice || 0);

      setEanValidation({
        eanFound: result.found,
        priceMatch,
        originalPriceMatch,
        isLoading: false,
      });

      // Auto-fill fields ONLY when creating new product and ERP found data
      if (!isEdit && result.found) {
        const newFormData = { ...formData };

        // Auto-fill product name if empty
        if (!newFormData.name && result.erpProductName) {
          newFormData.name = result.erpProductName;
        }

        // Auto-fill brand if empty - find brand by name match (case-insensitive)
        if (!newFormData.brandId && result.erpBrand) {
          const matchingBrand = brands.find(b => b.name.toLowerCase() === result.erpBrand.toLowerCase());
          if (matchingBrand) {
            newFormData.brandId = matchingBrand.id;
          }
        }

        // Auto-fill installation type if empty and ERP has value
        if (!newFormData.installationType && result.erpInstallationType) {
          newFormData.installationType = result.erpInstallationType;
        }

        // Auto-fill price if zero
        if (newFormData.price === 0 && result.erpPrice !== undefined) {
          newFormData.price = result.erpPrice;
        }

        // Auto-fill original price if zero
        if (newFormData.originalPrice === 0 && result.erpOriginalPrice !== undefined) {
          newFormData.originalPrice = result.erpOriginalPrice;
        }

        // Auto-fill category if empty - find category by mssqlCode match
        if (!newFormData.categoryId && result.erpCategoryCode) {
          const matchingCategory = categories.find(c => (c as any).mssqlCode === result.erpCategoryCode);
          if (matchingCategory) {
            newFormData.categoryId = matchingCategory.id;
          }
        }

        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error validating EAN:', error);
      setEanValidation({
        eanFound: false,
        priceMatch: false,
        originalPriceMatch: false,
        isLoading: false,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('=== ZAČÁTEK UKLÁDÁNÍ PRODUKTU ===');
      console.log('FormData:', {
        ean: data.ean,
        name: data.name,
        brandId: data.brandId,
        hasImageData: !!data.imageData,
        imageMimeType: data.imageMimeType,
        imageDataLength: data.imageData?.length,
        imageDataPreview: data.imageData?.substring(0, 50)
      });

      const payload: any = {
        name: data.name,
        description: data.description,
        supplierNote: data.supplierNote || undefined,
        price: data.price,
        originalPrice: data.originalPrice,
        iconIds: data.iconIds,
        categoryId: data.categoryId || undefined,
        subcategoryId: data.subcategoryId || undefined,
      };

      // Only include eanCode and brandId when creating (not when editing)
      if (!isEdit) {
        payload.eanCode = data.ean;  // Backend expects eanCode
        payload.brandId = data.brandId;
      }

      // Only include image data if a new file was uploaded
      if (data.imageData && data.imageMimeType) {
        console.log('Přidávám imageData do payload');
        payload.imageData = data.imageData;
        payload.imageMimeType = data.imageMimeType;
      } else {
        console.log('NEPŘIDÁVÁM imageData - data.imageData:', !!data.imageData, 'data.imageMimeType:', data.imageMimeType);
      }

      console.log('Finální payload:', {
        ...payload,
        imageData: payload.imageData ? `${payload.imageData.substring(0, 50)}... (${payload.imageData.length} znaků)` : 'ŽÁDNÁ DATA',
        imageMimeType: payload.imageMimeType || 'ŽÁDNÝ MIME TYPE'
      });

      if (isEdit && id) {
        return productsService.updateProduct(id, payload);
      } else {
        return productsService.createProduct(payload);
      }
    },
    onSuccess: async (savedProduct) => {
      console.log('=== ONSUCCESS CALLBACK ===');
      console.log('Product saved successfully:', savedProduct);
      console.log('savedProduct má id:', savedProduct?.id);
      console.log('isEdit:', isEdit);
      console.log('Podmínka pro navigaci (!isEdit && savedProduct && savedProduct.id):', !isEdit && savedProduct && savedProduct.id);

      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Navigate to edit page after creating new product
      if (!isEdit && savedProduct && savedProduct.id) {
        console.log('NAVIGACE - Přecházím na editační stránku produktu:', savedProduct.id);
        console.log('URL:', `/products/${savedProduct.id}/edit`);
        // Use replace to avoid adding to history, making the flow smoother
        navigate(`/products/${savedProduct.id}/edit`, { replace: true });
        console.log('NAVIGACE - navigate() byla zavolána');
        return; // Exit early, don't validate EAN yet
      }

      // Validate EAN after saving (only for edits)
      if (formData.ean) {
        setEanValidation({
          eanFound: null,
          priceMatch: null,
          originalPriceMatch: null,
          isLoading: true,
        });
        try {
          const result = await productsService.validateEAN(
            formData.ean,
            formData.price,
            formData.originalPrice,
          );

          // Check individual price matches
          const priceMatch = result.found && result.erpPrice === formData.price;
          const originalPriceMatch = result.found && result.erpOriginalPrice === formData.originalPrice;

          setEanValidation({
            eanFound: result.found,
            priceMatch,
            originalPriceMatch,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error validating EAN:', error);
          setEanValidation({
            eanFound: false,
            priceMatch: false,
            originalPriceMatch: false,
            isLoading: false,
          });
        }
      }
    },
    onError: (error) => {
      console.error('Error saving product:', error);
      alert('Chyba při ukládání produktu: ' + (error as any).message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', formData);

    // If editing, skip duplicate check
    if (isEdit) {
      saveMutation.mutate(formData);
      return;
    }

    // Check for duplicate EAN only when creating new product
    if (formData.ean && formData.ean.trim() !== '') {
      try {
        const duplicateCheck = await productsService.checkDuplicateEan(formData.ean);

        if (duplicateCheck.exists && duplicateCheck.latestProduct) {
          // Show confirmation dialog (blocking mode)
          setDuplicateEanDialog({
            isOpen: true,
            existingProduct: duplicateCheck.latestProduct,
            count: duplicateCheck.count,
            mode: 'blocking',
          });
          setPendingFormData(formData);
          return; // Don't submit yet
        }
      } catch (error) {
        console.error('Error checking duplicate EAN:', error);
        // Continue with submission even if check fails
      }
    }

    // No duplicates found or EAN is empty, proceed with submission
    saveMutation.mutate(formData);
  };

  const handleDuplicateEanContinue = () => {
    // User confirmed to continue despite duplicate
    setDuplicateEanDialog({ isOpen: false, existingProduct: null, count: 0, mode: 'blocking' });
    if (pendingFormData) {
      saveMutation.mutate(pendingFormData);
      setPendingFormData(null);
    }
  };

  const handleDuplicateEanCancel = () => {
    // User cancelled, close dialog
    setDuplicateEanDialog({ isOpen: false, existingProduct: null, count: 0, mode: 'blocking' });
    setPendingFormData(null);
  };

  const handleEanBlur = async () => {
    // Skip check if editing existing product or EAN is empty
    if (isEdit || !formData.ean || formData.ean.trim() === '') {
      return;
    }

    // Check for duplicate EAN on blur
    try {
      const duplicateCheck = await productsService.checkDuplicateEan(formData.ean);

      if (duplicateCheck.exists && duplicateCheck.latestProduct) {
        // Show info dialog (informational mode)
        setDuplicateEanDialog({
          isOpen: true,
          existingProduct: duplicateCheck.latestProduct,
          count: duplicateCheck.count,
          mode: 'informational',
        });
        // Don't set pendingFormData - this is just informational, not blocking submit
      }
    } catch (error) {
      console.error('Error checking duplicate EAN on blur:', error);
      // Silently fail - don't block user
    }
  };

  const handleCreateCopy = async () => {
    console.log('=== VYTVÁŘENÍ KOPIE PRODUKTU ===');
    console.log('ID produktu:', id);

    // Načteme obrázek před navigací
    const imageUrl = `${API_URL}/products/${id}/image`;
    console.log('URL obrázku:', imageUrl);

    try {
      const axios = (await import('axios')).default;
      console.log('Stahování obrázku...');
      const response = await axios.get(imageUrl, { responseType: 'blob' });
      const blob = response.data;
      console.log('Obrázek stažen, velikost blob:', blob.size, 'bytes, typ:', blob.type);

      // Konvertujeme blob na base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];

        console.log('Base64 konverze dokončena:');
        console.log('- Délka base64:', base64Data.length);
        console.log('- Náhled:', base64Data.substring(0, 50));
        console.log('- MIME type:', blob.type);

        // Uložíme data obrázku do sessionStorage
        sessionStorage.setItem('copyProductImage', base64Data);
        sessionStorage.setItem('copyProductImageMimeType', blob.type);
        console.log('Data uložena do sessionStorage');

        // Ověříme, že se data opravdu uložila
        const verify = sessionStorage.getItem('copyProductImage');
        console.log('Ověření uložení - délka dat v sessionStorage:', verify?.length);

        // Navigujeme s ostatními daty
        const queryParams = new URLSearchParams({
          copyFrom: id!,
          ean: formData.ean,
          name: formData.name,
          description: formData.description,
          supplierNote: formData.supplierNote,
          brandId: formData.brandId,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId,
          price: formData.price.toString(),
          originalPrice: formData.originalPrice.toString(),
          iconIds: JSON.stringify(formData.iconIds),
        });

        console.log('Navigace na novou stránku...');
        navigate(`/products/new?${queryParams.toString()}`);
      };

      reader.onerror = (error) => {
        console.error('Chyba při čtení FileReader:', error);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Chyba při načítání obrázku:', error);
      // I když se obrázek nepodaří načíst, můžeme pokračovat bez něj
      const queryParams = new URLSearchParams({
        copyFrom: id!,
        ean: formData.ean,
        name: formData.name,
        description: formData.description,
        supplierNote: formData.supplierNote,
        brandId: formData.brandId,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        price: formData.price.toString(),
        originalPrice: formData.originalPrice.toString(),
        iconIds: JSON.stringify(formData.iconIds),
      });

      navigate(`/products/new?${queryParams.toString()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={() => navigate('/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na produkty
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 flex-1 text-center">
          {isEdit ? 'Upravit produkt' : 'Nový produkt'}
        </h1>
      </div>

      {isInActiveFlyer && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Produkt je součástí aktivního schváleného letáku.</strong> Editace produktu je zakázána, dokud platnost letáku nevyprší.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="space-y-4 bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EAN kód *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={formData.ean}
                      onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                      onBlur={handleEanBlur}
                      required
                      pattern="[0-9]{8,13}"
                      title="EAN kód musí mít 8-13 číslic"
                      disabled={isEdit}
                    />
                    {eanValidation.isLoading && (
                      <div className="absolute right-3 top-2 text-gray-400">
                        <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {!eanValidation.isLoading && eanValidation.eanFound === true && (
                      <div className="absolute right-3 top-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    )}
                    {!eanValidation.isLoading && eanValidation.eanFound === false && (
                      <div className="absolute right-3 top-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleErpValidation}
                    disabled={!formData.ean || formData.ean.length < 8 || eanValidation.isLoading}
                    className="mt-0"
                  >
                    ERP
                  </Button>
                </div>
              </div>

              <Input
                label="Název produktu *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isInActiveFlyer}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Značka *</label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={isInActiveFlyer}
                >
                  <option value="">Vyberte značku</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Poznámka dodavatele"
                value={formData.supplierNote}
                onChange={(e) => setFormData({ ...formData, supplierNote: e.target.value })}
                maxLength={100}
                placeholder="Interní poznámka (max. 100 znaků)"
                disabled={isInActiveFlyer}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '', installationType: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isInActiveFlyer}
                >
                  <option value="">Vyberte kategorii</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Podkategorie</label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.categoryId || subcategories.length === 0 || isInActiveFlyer}
                >
                  <option value="">Vyberte podkategorii</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ spotřebiče</label>
                <select
                  value={formData.installationType}
                  onChange={(e) => setFormData({ ...formData, installationType: e.target.value as 'BUILT_IN' | 'FREESTANDING' | '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={(() => {
                    // Allow field to be enabled if:
                    // 1. Category is selected AND category requires installation type, OR
                    // 2. Value was auto-filled from ERP (even without category)
                    if (isInActiveFlyer) return true;
                    if (formData.installationType && !formData.categoryId) return false; // ERP filled, no category yet
                    if (!formData.categoryId) return true;
                    const selectedCategory = categories.find(c => c.id === formData.categoryId);
                    return !selectedCategory || !selectedCategory.requiresInstallationType;
                  })()}
                >
                  <option value="">Vyberte typ</option>
                  <option value="BUILT_IN">Vestavné spotřebiče</option>
                  <option value="FREESTANDING">Volně stojící spotřebiče</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Cena *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                  disabled={isInActiveFlyer}
                />
                {eanValidation.isLoading && (
                  <div className="absolute right-3 top-9 text-gray-400">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {!eanValidation.isLoading && eanValidation.priceMatch === true && (
                  <div className="absolute right-3 top-9 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
                {!eanValidation.isLoading && eanValidation.priceMatch === false && (
                  <div className="absolute right-3 top-9 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  label="Původní cena"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                  disabled={isInActiveFlyer}
                />
                {eanValidation.isLoading && (
                  <div className="absolute right-3 top-9 text-gray-400">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {!eanValidation.isLoading && eanValidation.originalPriceMatch === true && (
                  <div className="absolute right-3 top-9 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}
                {!eanValidation.isLoading && eanValidation.originalPriceMatch === false && (
                  <div className="absolute right-3 top-9 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Popis produktu (max. 16 vizuálních řádků)
              </label>
              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200" style={{ width: '350px', maxWidth: '100%' }}>
                <div
                  className="relative"
                  style={{
                    height: 'calc(1rem * 1.5 * 16 + 16px)', // 16 lines with normal readable font + padding
                  }}
                >
                  {/* Bullets layer with invisible text for proper line wrapping */}
                  <div
                    className="absolute inset-0 pointer-events-none overflow-hidden text-base"
                    style={{
                      zIndex: 1,
                      padding: '8px',
                      lineHeight: '1.5rem'
                    }}
                  >
                    {(formData.description ? formData.description.split('\n') : ['']).map((line, index) => (
                      <div key={index} className="flex items-start" style={{ gap: '8px' }}>
                        <span className="text-black font-bold" style={{ width: '16px', flexShrink: 0 }}>•</span>
                        <span className="flex-1 invisible" style={{ wordBreak: 'break-word' }}>{line || ' '}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actual textarea - with padding to align with bullets */}
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      // Temporarily set value to check if it would overflow
                      const textarea = e.target;
                      const newValue = e.target.value;
                      const oldValue = formData.description;

                      textarea.value = newValue;

                      // Check if scrollHeight exceeds clientHeight (means overflow)
                      if (textarea.scrollHeight > textarea.clientHeight) {
                        // Revert - text doesn't fit
                        textarea.value = oldValue;
                        e.preventDefault();
                        return;
                      }

                      // Accept new value
                      setFormData({ ...formData, description: newValue });
                    }}
                    className="absolute inset-0 w-full h-full resize-none bg-transparent focus:outline-none text-base overflow-hidden disabled:cursor-not-allowed disabled:bg-gray-100"
                    style={{
                      padding: '8px 8px 8px calc(8px + 16px + 8px)',
                      zIndex: 2,
                      caretColor: 'black',
                      lineHeight: '1.5rem',
                      wordBreak: 'break-word'
                    }}
                    placeholder="Píšete zde... každý řádek začne bulletem"
                    disabled={isInActiveFlyer}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Každý řádek automaticky začíná bullet pointem (•). Stiskněte Enter pro nový řádek. Zobrazí se max. 16 vizuálních řádků.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ikony produktu (max. 4)
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsIconModalOpen(true)}
                className="w-full"
                disabled={isInActiveFlyer}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Vybrat ikony ({formData.iconIds.length}/4)
              </Button>
              {formData.iconIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.iconIds.map((iconId) => {
                    const icon = icons.find(i => i.id === iconId);
                    if (!icon) return null;
                    return (
                      <div
                        key={iconId}
                        className="relative w-16 h-16 border-2 border-blue-500 rounded-lg p-1 bg-gray-100"
                      >
                        <img
                          src={icon.imageUrl}
                          alt={icon.name}
                          className="w-full h-full object-contain"
                          title={icon.name}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              iconIds: formData.iconIds.filter(id => id !== iconId),
                            });
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Ikony se zobrazí v levé části obrázku produktu, zarovnané vertikálně.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obrázek produktu
              </label>
              <div className="flex items-center space-x-4">
                <label className={isInActiveFlyer ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  <div className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md ${isInActiveFlyer ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <Upload className="w-4 h-4" />
                    <span>Vybrat soubor</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isInActiveFlyer}
                  />
                </label>
                {formData.imageData && (
                  <span className="text-sm text-green-600">✓ Soubor vybrán</span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Maximální velikost: 5MB. Podporované formáty: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Náhled v letáku (skutečná velikost)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Takto bude produkt vypadat v jednom slotu letáku - zobrazeno ve skutečné velikosti.
            </p>
            <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-4 flex justify-center items-center" style={{ minHeight: '500px' }}>
              {/* Show actual slot size: 322px width, 233px height (calculated from FlyerPageView: (700-32-8)/2 - 8px padding = 322x233), zoomed to 150% */}
              <div className="bg-white rounded shadow overflow-hidden" style={{ width: '322px', height: '233px', zoom: '150%' }}>
                  <ProductFlyerLayout
                    product={{
                      id: id || 'preview',
                      name: formData.name || 'Název produktu',
                      description: formData.description || 'Zde se zobrazí popis produktu.\n\nPopis může obsahovat několik řádků s detaily o produktu, specifikacemi, výhodami a dalšími informacemi.',
                      price: formData.price,
                      originalPrice: formData.originalPrice,
                      eanCode: formData.ean,
                      brandId: formData.brandId,
                      brandName: brands.find(b => b.id === formData.brandId)?.name,
                      supplierId: '',
                      icons: formData.iconIds.map((iconId, index) => {
                        const icon = icons.find(i => i.id === iconId);
                        return icon ? {
                          id: icon.id,
                          name: icon.name,
                          imageUrl: icon.imageUrl,
                          isEnergyClass: icon.isEnergyClass,
                          useBrandColor: icon.useBrandColor,
                          position: index,
                        } : null;
                      }).filter(Boolean) as any,
                      createdAt: '',
                      updatedAt: '',
                    } as Product}
                    customImageUrl={imagePreview}
                    brandColor={brands.find(b => b.id === formData.brandId)?.color}
                  />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div>
            {isEdit && (
              <Button type="button" variant="outline" onClick={handleCreateCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Vytvořit kopii
              </Button>
            )}
          </div>
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Zrušit
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending} disabled={isInActiveFlyer}>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Aktualizovat produkt' : 'Vytvořit produkt'}
            </Button>
          </div>
        </div>
      </form>

      {/* Icons Selection Modal */}
      <Modal
        isOpen={isIconModalOpen}
        onClose={() => {
          setIsIconModalOpen(false);
          setIconSearch('');
          setActiveIconTab('other');
        }}
        title="Vybrat ikony produktu"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveIconTab('other')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeIconTab === 'other'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Ostatní ikony
              </button>
              <button
                onClick={() => setActiveIconTab('energy')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeIconTab === 'energy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Energetické štítky
              </button>
            </nav>
          </div>

          <Input
            label="Vyhledat ikony"
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            placeholder="Zadejte název ikony..."
          />

          {icons.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-8">
              Zatím nejsou k dispozici žádné ikony. Můžete je vytvořit v administraci.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {icons
                .filter(icon => {
                  // Text search filter
                  const matchesSearch = iconSearch === '' ||
                    icon.name.toLowerCase().includes(iconSearch.toLowerCase());

                  if (!matchesSearch) return false;

                  // Filter by active tab
                  if (activeIconTab === 'energy') {
                    // Energy tab: show only energy class icons
                    return icon.isEnergyClass === true;
                  } else {
                    // Other tab: show non-energy icons that match brand/category
                    if (icon.isEnergyClass) return false;

                    // Check if selected brand has a color
                    const selectedBrand = brands.find(b => b.id === formData.brandId);
                    const brandHasNoColor = selectedBrand && !selectedBrand.color;

                    // If brand has no color, filter out icons with "(brand)" in name
                    if (brandHasNoColor && icon.name.toLowerCase().includes('(brand)')) {
                      return false;
                    }

                    // Check if icon matches product's brand
                    const matchesBrand = formData.brandId && icon.brands?.some(
                      ib => ib.brand.id === formData.brandId
                    );

                    // Check if icon matches product's category
                    const matchesCategory = formData.categoryId && icon.categories?.some(
                      ic => ic.category.id === formData.categoryId
                    );

                    // Show icon ONLY if it matches BOTH brand AND category
                    // If product has both brandId and categoryId, icon must have both
                    // If product has only brandId, icon must have that brand
                    // If product has only categoryId, icon must have that category
                    if (formData.brandId && formData.categoryId) {
                      return matchesBrand && matchesCategory;
                    } else if (formData.brandId) {
                      return matchesBrand;
                    } else if (formData.categoryId) {
                      return matchesCategory;
                    }

                    // If product has neither brand nor category, don't show regular icons
                    return false;
                  }
                })
                .map((icon) => {
                  const isSelected = formData.iconIds.includes(icon.id);
                  const canSelect = formData.iconIds.length < 4 || isSelected;

                  return (
                    <div
                      key={icon.id}
                      onClick={() => {
                        if (isSelected) {
                          // When removing, just filter out the icon - array stays compact
                          const newIconIds = formData.iconIds.filter(id => id !== icon.id);
                          console.log('Odebírám ikonu:', icon.id);
                          console.log('Před:', formData.iconIds);
                          console.log('Po:', newIconIds);
                          setFormData({
                            ...formData,
                            iconIds: newIconIds,
                          });
                        } else if (canSelect) {
                          // When adding, just append - array is always compact without gaps
                          const newIconIds = [...formData.iconIds, icon.id];
                          console.log('Přidávám ikonu:', icon.id);
                          console.log('Před:', formData.iconIds);
                          console.log('Po:', newIconIds);
                          setFormData({
                            ...formData,
                            iconIds: newIconIds,
                          });
                        }
                      }}
                      className={`
                        relative cursor-pointer rounded-lg border-2 p-3 transition-all
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : canSelect
                            ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="aspect-square flex items-center justify-center bg-gray-100 rounded">
                        <img
                          src={icon.imageUrl}
                          alt={icon.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <p className="mt-2 text-xs text-center text-gray-700 truncate" title={icon.name}>
                        {icon.name}
                      </p>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-gray-600">
              Vybráno: {formData.iconIds.length}/4
            </span>
            <Button onClick={() => setIsIconModalOpen(false)}>
              Hotovo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate EAN Dialog */}
      {duplicateEanDialog.isOpen && duplicateEanDialog.existingProduct && (
        <DuplicateEanDialog
          ean={formData.ean}
          existingProduct={duplicateEanDialog.existingProduct}
          productCount={duplicateEanDialog.count}
          mode={duplicateEanDialog.mode}
          onContinue={handleDuplicateEanContinue}
          onCancel={handleDuplicateEanCancel}
        />
      )}

      <AppFooter />
    </div>
  );
};
