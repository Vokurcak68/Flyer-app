import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { FlyerSlot } from '../../types';
import { formatCurrency, getProductImageUrl, getIconImageUrl } from '../../utils/helpers';
import { X, Image as ImageIcon } from 'lucide-react';

interface DroppableSlotProps {
  id: string;
  slot: FlyerSlot;
  onRemove?: () => void;
  index: number;
}

export const DroppableSlot: React.FC<DroppableSlotProps> = ({ id, slot, onRemove, index }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { index },
  });

  const getPromoImageUrl = (promoId: string) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${API_URL}/promo-images/${promoId}/image`;
  };

  const isEmpty = !slot || slot.type === 'empty';
  const product = slot?.product;
  const promoImage = slot?.promoImage;

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 h-full transition-colors ${
        !isEmpty
          ? 'border-green-300 bg-white'
          : isOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      {slot?.type === 'product' && product ? (
        <div className="relative h-full flex flex-col">
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <div className="flex gap-1 mb-1">
            {product.icons?.map((icon, i) => (
              <img
                key={i}
                src={getIconImageUrl(icon.id)}
                alt={icon.name}
                className="w-4 h-4"
                title={icon.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ))}
          </div>

          <div className="flex-1 mb-1 min-h-0 overflow-hidden">
            <img
              src={getProductImageUrl(product.id)}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="text-xs font-semibold truncate mb-1">{product.name}</div>

          <div className="flex-none">
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </div>
            )}
            <div className="text-base font-bold text-red-600">{formatCurrency(product.price)}</div>
          </div>
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
