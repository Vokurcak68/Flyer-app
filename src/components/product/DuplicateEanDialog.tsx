import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface DuplicateEanDialogProps {
  ean: string;
  existingProduct: Product;
  productCount: number;
  onContinue: () => void;
  onCancel: () => void;
}

const DuplicateEanDialog: React.FC<DuplicateEanDialogProps> = ({
  ean,
  existingProduct,
  productCount,
  onContinue,
  onCancel,
}) => {
  const navigate = useNavigate();

  const handleOpenExistingProduct = () => {
    navigate(`/products/${existingProduct.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                Produkt se stejným EAN již existuje
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p className="mb-2">
                  V systému {productCount > 1 ? `existuje ${productCount} produktů` : 'existuje produkt'} se stejným EAN kódem: <strong>{ean}</strong>
                </p>

                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="font-medium text-gray-700">Poslední vytvořený produkt:</p>
                  <p className="mt-1"><strong>{existingProduct.name}</strong></p>
                  <p className="text-xs text-gray-600">
                    Značka: {existingProduct.brand?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Cena: {existingProduct.price} Kč
                    {existingProduct.originalPrice && ` (původní: ${existingProduct.originalPrice} Kč)`}
                  </p>
                  {existingProduct.isActive !== undefined && (
                    <p className="text-xs text-gray-600">
                      Status: {existingProduct.isActive ? 'Aktivní' : 'Neaktivní'}
                    </p>
                  )}
                </div>

                <p className="mt-3">
                  Chcete přesto pokračovat a vytvořit nový produkt se stejným EAN kódem?
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between space-x-3">
          <Button
            variant="secondary"
            onClick={handleOpenExistingProduct}
          >
            Otevřít existující produkt
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              Zrušit
            </Button>
            <Button
              variant="primary"
              onClick={onContinue}
            >
              Pokračovat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateEanDialog;
