import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { FlyerSlot } from '../../types';
import { X, Image as ImageIcon } from 'lucide-react';
import { ProductFlyerLayout } from '../product/ProductFlyerLayout';

interface DroppableSlotProps {
  id: string;
  slot: FlyerSlot;
  onRemove?: () => void;
  index: number;
}

export const DroppableSlot: React.FC<DroppableSlotProps> = ({ id, slot, onRemove, index }) => {
  const isEmpty = !slot || slot.type === 'empty';

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { index },
    disabled: !isEmpty, // Disable drop if slot is already occupied
  });

  const getPromoImageUrl = (promoId: string) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${API_URL}/promo-images/${promoId}/image`;
  };
  const product = slot?.product;
  const promoImage = slot?.promoImage;

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-1 h-full transition-colors ${
        !isEmpty
          ? 'border-green-300 bg-white'
          : isOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      {slot?.type === 'product' && product ? (
        <div className="relative h-full">
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ProductFlyerLayout product={product} />
        </div>
      ) : slot?.type === 'promo' && promoImage ? (
        <div className="relative h-full">
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <img
            src={getPromoImageUrl(promoImage.id)}
            alt={promoImage.name}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="180"><rect width="100" height="180" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12">No Image</text></svg>';
            }}
          />
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-sm text-center">Přetáhněte sem produkt</span>
        </div>
      )}
    </div>
  );
};
