import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { brandsService } from '../../services/brandsService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const BrandFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    logoData: '',
    logoMimeType: '',
    color: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');

  const { data: brand } = useQuery({
    queryKey: ['brands', id],
    queryFn: () => brandsService.getBrand(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        logoData: '',
        logoMimeType: '',
        color: brand.color || '',
      });
      // Set preview from API endpoint if brand has logo
      if (id) {
        setLogoPreview(`http://localhost:4000/api/brands/${id}/logo`);
      }
    }
  }, [brand, id]);

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
        logoData: base64Data,
        logoMimeType: file.type,
      });
      setLogoPreview(base64String); // Use full data URL for preview
    };
    reader.readAsDataURL(file);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: any = {
        name: data.name,
      };

      // Only include logo data if a new file was uploaded
      if (data.logoData && data.logoMimeType) {
        payload.logoData = data.logoData;
        payload.logoMimeType = data.logoMimeType;
      }

      // Include color if provided
      if (data.color) {
        payload.color = data.color;
      }

      console.log('Saving brand with payload:', {
        name: payload.name,
        hasLogoData: !!payload.logoData,
        logoMimeType: payload.logoMimeType,
        logoDataLength: payload.logoData?.length,
        color: payload.color
      });

      if (isEdit && id) {
        return brandsService.updateBrand(id, payload);
      } else {
        return brandsService.createBrand(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      navigate('/brands');
    },
    onError: (error) => {
      console.error('Error saving brand:', error);
      alert('Chyba při ukládání značky: ' + (error as any).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/brands')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na značky
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Upravit značku' : 'Nová značka'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6 bg-white rounded-lg shadow p-6">
            <Input
              label="Název značky *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barva značky
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color || '#000000'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setFormData({ ...formData, color: value });
                    }
                  }}
                  placeholder="#FF5733"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Tato barva se použije pro barevný pruh v hlavičce produktu
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo značky
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
                {formData.logoData && (
                  <span className="text-sm text-green-600">✓ Soubor vybrán</span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Maximální velikost: 5MB. Podporované formáty: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Náhled loga</h3>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="bg-white rounded-lg p-4 shadow">
                {logoPreview ? (
                  <img src={logoPreview} alt="Náhled loga" className="w-full h-40 object-contain" />
                ) : (
                  <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400">Bez loga</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/brands')}>
            Zrušit
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Aktualizovat značku' : 'Vytvořit značku'}
          </Button>
        </div>
      </form>
    </div>
  );
};
