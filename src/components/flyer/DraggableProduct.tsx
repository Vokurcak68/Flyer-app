import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Product } from '../../types';
import { formatCurrency, getProductImageUrl } from '../../utils/helpers';

interface DraggableProductProps {
  product: Product;
  isUsed?: boolean;
}

export const DraggableProduct: React.FC<DraggableProductProps> = ({ product, isUsed = false }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: product.id,
    data: product,
    disabled: isUsed,
  });

  return (
    <div
      ref={setNodeRef}
      {...(!isUsed ? listeners : {})}
      {...(!isUsed ? attributes : {})}
      className={`border rounded-lg p-2 transition-shadow relative ${
        isUsed
          ? 'opacity-50 bg-gray-100 cursor-not-allowed'
          : 'cursor-move hover:shadow-md bg-white'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        <img
          src={getProductImageUrl(product.id)}
          alt={product.name}
          className="w-12 h-12 object-contain flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="10">No Img</text></svg>';
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs truncate">{product.name}</div>
          <div className="text-blue-600 font-bold text-sm">{formatCurrency(product.price)}</div>

          {/* Additional info */}
          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
            {product.eanCode && (
              <div className="truncate">
                <span className="font-medium">EAN:</span> {product.eanCode}
              </div>
            )}
            {product.brandName && (
              <div className="truncate">
                <span className="font-medium">Značka:</span> {product.brandName}
              </div>
            )}
            {product.categoryName && (
              <div className="truncate">
                <span className="font-medium">Kategorie:</span> {product.categoryName}
                {product.subcategoryName && ` / ${product.subcategoryName}`}
              </div>
            )}
          </div>

          {isUsed && (
            <div className="text-xs text-red-600 font-medium mt-1">Již použito v letáku</div>
          )}
        </div>
      </div>
    </div>
  );
};
