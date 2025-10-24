import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { productsService } from '../../services/productsService';
import { brandsService } from '../../services/brandsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/helpers';

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
        eanCode: data.ean,  // Backend expects eanCode
        name: data.name,
        description: data.description,
        brandId: data.brandId,
        price: data.price,
        originalPrice: data.originalPrice,
      };

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
        <div className="grid grid-cols-2 gap-8">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
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
            <h3 className="text-lg font-semibold mb-4">Náhled v letáku</h3>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="bg-white rounded-lg p-4 shadow">
                {imagePreview ? (
                  <img src={imagePreview} alt="Náhled" className="w-full h-40 object-contain mb-3" />
                ) : (
                  <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center mb-3">
                    <span className="text-gray-400">Bez obrázku</span>
                  </div>
                )}
                <h4 className="font-semibold text-base mb-1">{formData.name || 'Název produktu'}</h4>
                {formData.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{formData.description}</p>
                )}
                <div>
                  {formData.originalPrice > 0 && formData.originalPrice > formData.price && (
                    <div className="text-sm text-gray-400 line-through">
                      {formatCurrency(formData.originalPrice)}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(formData.price)}
                  </div>
                </div>
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
