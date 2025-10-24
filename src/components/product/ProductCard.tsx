import React from 'react';
import { Product } from '../../types';
import { formatCurrency, getProductImageUrl, getIconImageUrl } from '../../utils/helpers';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
}) => {
  return (
    <div
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-1 mb-2">
        {product.icons?.map((icon, i) => (
          <img
            key={i}
            src={getIconImageUrl(icon.id)}
            alt={icon.name}
            className="w-5 h-5"
            title={icon.name}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ))}
      </div>

      <img
        src={getProductImageUrl(product.id)}
        alt={product.name}
        className="w-full h-32 object-contain mb-2"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className = 'w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-2';
          placeholder.innerHTML = '<span class="text-4xl text-gray-400">No Image</span>';
          e.currentTarget.parentNode?.insertBefore(placeholder, e.currentTarget.nextSibling);
        }}
      />

      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>

      {product.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
      )}

      <div className="mt-auto">
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="text-xs text-gray-400 line-through">
            {formatCurrency(product.originalPrice)}
          </div>
        )}
        <div className="text-lg font-bold text-red-600">
          {formatCurrency(product.price)}
        </div>
      </div>
    </div>
  );
};
