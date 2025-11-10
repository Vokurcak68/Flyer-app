import React from 'react';
import { Product } from '../../types';

interface ProductFlyerLayoutProps {
  product: Product;
  className?: string;
  customImageUrl?: string; // For preview before saving
  brandColor?: string | null; // Brand color from product
}

/**
 * Product layout component for flyer display
 * Matches the design from product form - black header, image left, description right
 */
export const ProductFlyerLayout: React.FC<ProductFlyerLayoutProps> = ({
  product,
  className = '',
  customImageUrl,
  brandColor
}) => {
  const getProductImageUrl = (id: string) => {
    if (customImageUrl) return customImageUrl;
    const API_URL = process.env.REACT_APP_API_URL || '/api';
    return `${API_URL}/products/${id}/image`;
  };

  // Use brand color if provided, otherwise default to black
  const headerColor = brandColor || '#000000';

  return (
    <div className={`bg-white h-full flex flex-col overflow-hidden ${className}`}>
      {/* Header with brand color */}
      <div className="text-white px-2 py-1.5 flex-none flex items-center justify-center gap-2" style={{ backgroundColor: headerColor }}>
        {product.brandName && (
          <span className="font-bold text-[0.7rem] leading-tight" style={{ fontFamily: '"Vodafone Rg", "Arial Black", sans-serif' }}>
            {product.brandName}
          </span>
        )}
        <h4 className="text-[0.7rem] leading-tight line-clamp-2 text-center" style={{ fontFamily: '"Vodafone Rg", "Arial", sans-serif', fontWeight: 'normal' }}>
          {product.name}
        </h4>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left side: Image and prices (49%) */}
        <div className="flex flex-col" style={{ width: '49%' }}>
          {/* Product image with icons overlay */}
          <div className="flex-1 mb-1 min-h-0 relative" style={{ padding: '3px' }}>
            {/* Product image */}
            <img
              src={getProductImageUrl(product.id)}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12">No Img</text></svg>';
              }}
            />

            {/* Icons overlaid on left side - 4 fixed evenly distributed slots, icons fill from top */}
            {product.icons && product.icons.length > 0 && (
              <div
                className="absolute left-0 flex flex-col justify-between"
                style={{
                  top: '8px',
                  height: 'calc(100% - 16px)'
                }}
              >
                {/* Create 4 fixed slots, fill with icons from top */}
                {[0, 1, 2, 3].map((slotIndex) => {
                  const icon = product.icons[slotIndex];
                  return (
                    <div key={slotIndex} className="h-6 flex items-center">
                      {icon && (
                        <div
                          className={`h-6 flex items-center justify-center ${icon.isEnergyClass ? 'w-12' : 'w-6'}`}
                          style={icon.useBrandColor && brandColor ? { backgroundColor: brandColor } : undefined}
                        >
                          <img
                            src={icon.imageUrl}
                            alt={icon.name}
                            className={`h-6 object-contain ${icon.isEnergyClass ? 'w-12' : 'w-6'}`}
                            title={icon.name}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prices section - no horizontal padding to align with product edge */}
          <div className="space-y-px flex-none pb-2">
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="flex gap-0.5">
                {/* Black box with white price - 50% width (ends at middle of image) */}
                <div className="bg-black text-white px-0.5 py-1.5 flex items-center justify-center" style={{ width: '50%' }}>
                  <div className="text-[0.75rem] leading-none" style={{ fontFamily: '"Vodafone Rg", "Arial Narrow", "Arial", sans-serif', fontWeight: 600, transform: 'scaleX(1.2)' }}>
                    {Math.round(product.originalPrice).toLocaleString('cs-CZ')} Kč
                  </div>
                </div>
                {/* Gray box with label - fills remaining space */}
                <div className="bg-gray-200 text-gray-700 py-1 flex items-center justify-start flex-1" style={{ paddingLeft: '6px' }}>
                  <div className="text-[0.5rem] leading-none" style={{ fontFamily: '"Vodafone Rg", "Arial", sans-serif', transform: 'scaleX(1.1)', transformOrigin: 'left' }}>
                    Doporučená<br/>cena
                  </div>
                </div>
              </div>
            )}
            {/* Red box with white price + gray label */}
            <div className="flex gap-0.5">
              {/* Red box with white price - 50% width (ends at middle of image) */}
              <div className="bg-red-600 text-white px-0.5 py-1.5 flex items-center justify-center" style={{ width: '50%' }}>
                <div className="text-[0.75rem] leading-none" style={{ fontFamily: '"Vodafone Rg", "Arial Narrow", "Arial", sans-serif', fontWeight: 600, transform: 'scaleX(1.2)' }}>
                  {Math.round(product.price).toLocaleString('cs-CZ')} Kč
                </div>
              </div>
              {/* Gray box with label - fills remaining space */}
              <div className="bg-gray-200 text-gray-700 py-1 flex items-center justify-start flex-1" style={{ paddingLeft: '6px' }}>
                <div className="text-[0.5rem] leading-none" style={{ fontFamily: '"Vodafone Rg", "Arial", sans-serif', transform: 'scaleX(1.1)', transformOrigin: 'left' }}>
                  Akční cena<br/>{product.originalPrice && product.originalPrice > product.price ? 'Oresi' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Description - full height (51%), max 15 visual lines */}
        {product.description && (
          <div className="bg-white overflow-hidden" style={{ width: '51%', padding: '1.5px', paddingLeft: '8px', paddingTop: '6px' }}>
            <div
              className="text-[0.55rem] overflow-hidden"
              style={{
                maxHeight: 'calc(0.55rem * 1.35 * 16)', // 16 visual lines: font-size * line-height * lines
                lineHeight: '1.35',
                fontFamily: '"Vodafone Rg", "Arial", sans-serif'
              }}
            >
              {product.description.split('\n').map((line, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="flex-shrink-0">•</span>
                  <span className="flex-1 break-words">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
