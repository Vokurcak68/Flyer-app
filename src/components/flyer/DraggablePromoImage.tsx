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

  // Aspect ratio based on actual slot dimensions
  const getImageContainerClass = (size: string) => {
    switch (size) {
      case 'single':
        // 1×1 slot: square aspect ratio
        return 'aspect-square';
      case 'horizontal':
        // 2×1 slots: wide rectangle (2:1 ratio)
        return 'aspect-[2/1]';
      case 'square':
        // 2×2 slots: square aspect ratio
        return 'aspect-square';
      case 'full_page':
        // 2×4 slots (full page): A4 aspect ratio (1:1.414)
        return 'aspect-[1/1.414]';
      case 'footer':
        // Footer: very wide (full width, 60px height) - roughly 12:1 ratio
        return 'aspect-[12/1]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`border rounded p-1.5 cursor-move hover:shadow-md transition-shadow bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail with fixed width */}
        <div className="relative flex-shrink-0 w-16">
          <div className={`relative w-full ${getImageContainerClass(promoImage.defaultSize)} overflow-hidden rounded`}>
            <img
              src={getPromoImageUrl(promoImage.id)}
              alt={promoImage.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="10">No Img</text></svg>';
              }}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs truncate mb-0.5">{promoImage.name}</div>
          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getSizeBadgeColor(promoImage.defaultSize)}`}>
            {getSizeLabel(promoImage.defaultSize)}
          </span>
        </div>
      </div>
    </div>
  );
};
