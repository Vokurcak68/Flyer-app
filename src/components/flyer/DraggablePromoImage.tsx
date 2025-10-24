import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PromoImage } from '../../types';

interface DraggablePromoImageProps {
  promoImage: PromoImage;
}

export const DraggablePromoImage: React.FC<DraggablePromoImageProps> = ({ promoImage }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `promo-${promoImage.id}`,
    data: { ...promoImage, isPromo: true },
  });

  const getPromoImageUrl = (id: string) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    const url = `${API_URL}/promo-images/${id}/image`;
    console.log('Promo image URL:', url);
    return url;
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'single':
        return '1×1';
      case 'horizontal':
        return '2×1';
      case 'square':
        return '2×2';
      case 'full_page':
        return '8 slotů';
      case 'footer':
        return 'Patička';
      default:
        return size;
    }
  };

  const getSizeBadgeColor = (size: string) => {
    switch (size) {
      case 'single':
        return 'bg-blue-100 text-blue-800';
      case 'horizontal':
        return 'bg-green-100 text-green-800';
      case 'square':
        return 'bg-purple-100 text-purple-800';
      case 'full_page':
        return 'bg-orange-100 text-orange-800';
      case 'footer':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`border rounded-lg p-2 cursor-move hover:shadow-md transition-shadow bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="relative">
          <img
            src={getPromoImageUrl(promoImage.id)}
            alt={promoImage.name}
            className="w-full h-20 object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="10">No Img</text></svg>';
            }}
          />
          <span className={`absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-semibold ${getSizeBadgeColor(promoImage.defaultSize)}`}>
            {getSizeLabel(promoImage.defaultSize)}
          </span>
        </div>
        <div className="font-semibold text-xs truncate">{promoImage.name}</div>
      </div>
    </div>
  );
};
