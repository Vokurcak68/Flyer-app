import React from 'react';
import { Product } from '../../types';

interface ProductFlyerLayoutProps {
  product: Product;
  className?: string;
  customImageUrl?: string; // For preview before saving
}

/**
 * Product layout component for flyer display
 * Matches the design from product form - black header, image left, description right
 */
export const ProductFlyerLayout: React.FC<ProductFlyerLayoutProps> = ({
  product,
  className = '',
  customImageUrl
}) => {
  const getProductImageUrl = (id: string) => {
    if (customImageUrl) return customImageUrl;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${API_URL}/products/${id}/image`;
  };

  return (
    <div className={`bg-white h-full flex flex-col overflow-hidden ${className}`}>
      {/* Black header with product name */}
      <div className="bg-black text-white px-2 py-1.5 flex-none flex items-center justify-center">
        <h4 className="font-bold text-xs leading-tight line-clamp-2 text-center">
          {product.name}
        </h4>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left side: Image and prices (45%) */}
        <div className="flex flex-col" style={{ width: '45%' }}>
          {/* Product image with icons overlay */}
          <div className="flex-1 mb-1 min-h-0 relative p-2">
            {/* Product image */}
            <img
              src={getProductImageUrl(product.id)}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12">No Img</text></svg>';
              }}
            />

            {/* Icons overlaid on left side - vertically aligned */}
            {product.icons && product.icons.length > 0 && (
              <div className="absolute left-2 top-2 flex flex-col gap-0">
                {product.icons.slice(0, 4).map((icon) => (
                  <img
                    key={icon.id}
                    src={icon.imageUrl}
                    alt={icon.name}
                    className="w-6 h-6 object-contain"
                    title={icon.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Prices section - no horizontal padding to align with product edge */}
          <div className="space-y-px flex-none pb-2">
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="flex gap-0.5">
                {/* Black box with white price - 60% width */}
                <div className="bg-black text-white px-0.5 py-1.5 flex items-center justify-center" style={{ width: '60%' }}>
                  <div className="text-[0.75rem] font-bold leading-none">
                    {Math.round(product.originalPrice).toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
                {/* Gray box with label - 40% width */}
                <div className="bg-gray-200 text-gray-700 px-0.5 py-1 flex items-center justify-start" style={{ width: '40%' }}>
                  <div className="text-[0.5rem] leading-none">
                    Doporučená<br/>cena
                  </div>
                </div>
              </div>
            )}
            {/* Red box with white price + gray label */}
            <div className="flex gap-0.5">
              {/* Red box with white price - 60% width */}
              <div className="bg-red-600 text-white px-0.5 py-1.5 flex items-center justify-center" style={{ width: '60%' }}>
                <div className="text-[0.75rem] font-bold leading-none">
                  {Math.round(product.price).toLocaleString('cs-CZ')} Kč
                </div>
              </div>
              {/* Gray box with label - 40% width */}
              <div className="bg-gray-200 text-gray-700 px-0.5 py-1 flex items-center justify-start" style={{ width: '40%' }}>
                <div className="text-[0.5rem] leading-none">
                  Akční cena<br/>{product.originalPrice && product.originalPrice > product.price ? 'Oresi' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Description - full height (55%) */}
        {product.description && (
          <div className="bg-white overflow-hidden p-1.5" style={{ width: '55%' }}>
            <div className="text-[0.55rem] leading-tight whitespace-pre-wrap overflow-y-auto h-full">
              {product.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
