import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { brandsService } from '../../services/brandsService';
import { usersService } from '../../services/usersService';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { User, Brand } from '../../types';

interface AssignBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export const AssignBrandsModal: React.FC<AssignBrandsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const API_URL = process.env.REACT_APP_API_URL || '/api';

  // Načtení všech značek
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsService.getAllBrands(),
    enabled: isOpen,
  });

  // Inicializace vybraných značek z uživatele
  useEffect(() => {
    if (user.brands && isOpen) {
      const currentBrandIds = user.brands.map((b: any) => b.id || b.brandId);
      setSelectedBrandIds(currentBrandIds);
    }
  }, [user.brands, isOpen]);

  // Mutace pro přiřazení značek
  const assignMutation = useMutation({
    mutationFn: (brandIds: string[]) => usersService.assignBrands(user.id, brandIds),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleToggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) => {
      if (prev.includes(brandId)) {
        return prev.filter((id) => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignMutation.mutate(selectedBrandIds);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Přiřadit značky pro ${user.firstName} ${user.lastName}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {brandsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nejsou k dispozici žádné značky
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {brands.map((brand: Brand) => (
              <label
                key={brand.id}
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
              >
                <input
                  type="checkbox"
                  checked={selectedBrandIds.includes(brand.id)}
                  onChange={() => handleToggleBrand(brand.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex items-center flex-1">
                  {brand.logoData && brand.logoMimeType ? (
                    <img
                      src={`${API_URL}/brands/${brand.id}/logo`}
                      alt={brand.name}
                      className="w-8 h-8 object-contain mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400 mr-3">
                      Logo
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{brand.name}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={assignMutation.isPending}
          >
            Zrušit
          </Button>
          <Button
            type="submit"
            isLoading={assignMutation.isPending}
            disabled={brands.length === 0}
          >
            Uložit
          </Button>
        </div>

        {assignMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Nepodařilo se uložit změny. Zkuste to prosím znovu.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};
