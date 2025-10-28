import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { productsService } from '../../services/productsService';
import { brandsService } from '../../services/brandsService';
import iconsService from '../../services/iconsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductFlyerLayout } from '../../components/product/ProductFlyerLayout';
import { Product } from '../../types';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    ean: '',
    name: '',
    description: '',
    brandId: '',
    price: 0,
    originalPrice: 0,
    imageData: '',
    imageMimeType: '',
    iconIds: [] as string[],
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', 'my'],
    queryFn: () => brandsService.getMyBrands(),
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
        brandId: product.brandId,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        imageData: '',
        imageMimeType: '',
        iconIds: product.icons?.map(i => i.id) || [],
      });
      // Set preview from API endpoint if product has image
      if (id) {
        setImagePreview(`http://localhost:4000/api/products/${id}/image`);
      }
    } else if (brands.length > 0 && !formData.brandId) {
      setFormData(prev => ({ ...prev, brandId: brands[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, brands]);

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

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Saving product with payload:', {
        ean: data.ean,
        name: data.name,
        brandId: data.brandId,
        hasImageData: !!data.imageData,
        imageMimeType: data.imageMimeType,
        imageDataLength: data.imageData?.length
      });

      const payload: any = {
        name: data.name,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        iconIds: data.iconIds,
      };

      // Only include eanCode and brandId when creating (not when editing)
      if (!isEdit) {
        payload.eanCode = data.ean;  // Backend expects eanCode
        payload.brandId = data.brandId;
      }

      // Only include image data if a new file was uploaded
      if (data.imageData && data.imageMimeType) {
        payload.imageData = data.imageData;
        payload.imageMimeType = data.imageMimeType;
      }

      if (isEdit && id) {
        return productsService.updateProduct(id, payload);
      } else {
        return productsService.createProduct(payload);
      }
    },
    onSuccess: () => {
      console.log('Product saved successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: (error) => {
      console.error('Error saving product:', error);
      alert('Chyba při ukládání produktu: ' + (error as any).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/products')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na produkty
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Upravit produkt' : 'Nový produkt'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div className="space-y-6 bg-white rounded-lg shadow p-6">
            <Input
              label="EAN kód *"
              value={formData.ean}
              onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
              required
              pattern="[0-9]{8,13}"
              title="EAN kód musí mít 8-13 číslic"
            />

            <Input
              label="Název produktu *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Značka *</label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Vyberte značku</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Popis produktu (vpravo v letáku)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                placeholder="• Bullet point 1&#10;• Bullet point 2&#10;• Specifikace&#10;• Výhody produktu"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tento text se zobrazí vpravo vedle obrázku v letáku. Použijte bullet points (•) pro přehlednější formátování.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ikony produktu (max. 4)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {icons.map((icon) => {
                  const isSelected = formData.iconIds.includes(icon.id);
                  const canSelect = formData.iconIds.length < 4 || isSelected;

                  return (
                    <div
                      key={icon.id}
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            iconIds: formData.iconIds.filter(id => id !== icon.id),
                          });
                        } else if (canSelect) {
                          setFormData({
                            ...formData,
                            iconIds: [...formData.iconIds, icon.id],
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
                      <div className="aspect-square flex items-center justify-center">
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
              {icons.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Zatím nejsou k dispozici žádné ikony. Můžete je vytvořit v administraci.
                </p>
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
                <label className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span>Vybrat soubor</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cena *"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />

              <Input
                label="Původní cena"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Náhled v letáku (skutečná velikost)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Takto bude produkt vypadat v jednom slotu letáku - zobrazeno ve skutečné velikosti.
            </p>
            <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-4 flex justify-center items-center" style={{ minHeight: '500px' }}>
              {/* Show actual slot size: 346px width, 241px height (matches FlyerPageView calculations), zoomed to 150% */}
              <div className="bg-white rounded shadow overflow-hidden" style={{ width: '346px', height: '241px', zoom: '150%' }}>
                  <ProductFlyerLayout
                    product={{
                      id: id || 'preview',
                      name: formData.name || 'Název produktu',
                      description: formData.description || 'Zde se zobrazí popis produktu.\n\nPopis může obsahovat několik řádků s detaily o produktu, specifikacemi, výhodami a dalšími informacemi.',
                      price: formData.price,
                      originalPrice: formData.originalPrice,
                      eanCode: formData.ean,
                      brandId: formData.brandId,
                      supplierId: '',
                      icons: formData.iconIds.map((iconId, index) => {
                        const icon = icons.find(i => i.id === iconId);
                        return icon ? {
                          id: icon.id,
                          name: icon.name,
                          imageUrl: icon.imageUrl,
                          isEnergyClass: icon.isEnergyClass,
                          position: index,
                        } : null;
                      }).filter(Boolean) as any,
                      createdAt: '',
                      updatedAt: '',
                    } as Product}
                    customImageUrl={imagePreview}
                  />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Aktualizovat produkt' : 'Vytvořit produkt'}
          </Button>
        </div>
      </form>
    </div>
  );
};
