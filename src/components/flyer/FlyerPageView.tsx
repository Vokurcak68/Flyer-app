import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import { FlyerPage } from '../../types';
import { DroppableSlot } from './DroppableSlot';

interface FlyerPageViewProps {
  page: FlyerPage;
  pageIndex: number;
  onRemoveProduct?: (slotIndex: number) => void;
  onRemoveFooter?: () => void;
  isEditable?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

export const FlyerPageView: React.FC<FlyerPageViewProps> = ({
  page,
  pageIndex,
  onRemoveProduct,
  onRemoveFooter,
  isEditable = true,
  validFrom,
  validTo,
}) => {
  const isFirstPage = page.pageNumber === 1;

  const { setNodeRef: setFooterRef, isOver: isFooterOver } = useDroppable({
    id: `page-${pageIndex}-footer`,
    disabled: !isEditable || !isFirstPage,
  });

  // Calculate grid placement for promo images
  const getGridPlacement = (index: number, slot: any) => {
    const col = (index % 2) + 1;
    const row = Math.floor(index / 2) + 1;

    if (slot?.type === 'promo' && slot.promoSize) {
      switch (slot.promoSize) {
        case 'horizontal':
        case 'header_2x1':
          return { gridColumn: `${col} / span 2`, gridRow: `${row} / span 1` };
        case 'square':
        case 'header_2x2':
          return { gridColumn: `${col} / span 2`, gridRow: `${row} / span 2` };
        case 'full_page':
          return { gridColumn: '1 / span 2', gridRow: '1 / span 4' };
        default:
          return { gridColumn: col, gridRow: row };
      }
    }

    return { gridColumn: col, gridRow: row };
  };

  // Check if slot is occupied by multi-slot promo
  const isOccupiedByPromo = (index: number) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    for (let i = 0; i < page.slots.length; i++) {
      const slot = page.slots[i];
      if (slot?.type === 'promo' && slot.promoSize && i !== index) {
        const promoCol = i % 2;
        const promoRow = Math.floor(i / 2);

        switch (slot.promoSize) {
          case 'horizontal':
          case 'header_2x1':
            if (row === promoRow && col > promoCol && col <= promoCol + 1) return true;
            break;
          case 'square':
          case 'header_2x2':
            if (row >= promoRow && row < promoRow + 2 && col >= promoCol && col < promoCol + 2) return true;
            break;
          case 'full_page':
            return true;
        }
      }
    }
    return false;
  };

  const getPromoImageUrl = (id: string) => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
    return `${API_URL}/promo-images/${id}/image`;
  };

  // KLÍČOVÉ: A4 rozměry a layout
  const containerWidth = 700; // A4 šířka
  const containerHeight = 1020;
  const footerHeight = 60;
  const padding = 32; // 2× p-4
  const gapSize = 8; // gap-2 = 8px

  // Na stránce 1: první řada menší (footer zabírá místo), ostatní 3 řady normální
  // Na ostatních stránkách: všechny 4 řady stejně vysoké
  let firstRowHeight: number;
  let normalRowHeight: number;

  if (isFirstPage) {
    // Normální výška řádku (stejná jako na stránce 2)
    normalRowHeight = Math.floor((containerHeight - padding - 3 * gapSize) / 4);
    // První řada = zbývající místo po odečtení footeru a 3 normálních řad
    firstRowHeight = containerHeight - padding - footerHeight - gapSize - (3 * normalRowHeight) - (3 * gapSize);
  } else {
    // Všechny řady stejně vysoké
    normalRowHeight = Math.floor((containerHeight - padding - 3 * gapSize) / 4);
    firstRowHeight = normalRowHeight;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white" style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}>
        <div className="flex flex-col gap-2 h-full">
          {/* Grid s FIXNÍ výškou řádků - první řada může být menší na stránce 1 */}
          <div
            className="grid grid-cols-2 gap-2"
            style={{
              gridTemplateRows: `${firstRowHeight}px ${normalRowHeight}px ${normalRowHeight}px ${normalRowHeight}px`,
            }}
          >
          {page.slots.map((slot, index) => {
            if (isOccupiedByPromo(index)) return null;

            const gridStyle = getGridPlacement(index, slot);

            return (
              <div key={`${pageIndex}-${index}`} style={gridStyle} className="h-full">
                <DroppableSlot
                  id={`page-${pageIndex}-slot-${index}`}
                  slot={slot || { type: 'empty' }}
                  onRemove={isEditable && onRemoveProduct ? () => onRemoveProduct(index) : undefined}
                  index={index}
                />
              </div>
            );
          })}
          </div>

          {/* Patička na stránce 1 */}
          {isFirstPage && (
            <div
              ref={setFooterRef}
              className={`border-2 rounded-lg overflow-hidden transition-colors relative ${
                isFooterOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
              style={{ height: '60px' }}
            >
              {page.footerPromoImage ? (
                <div className="relative h-full">
                  <img
                    src={getPromoImageUrl(page.footerPromoImage.id)}
                    alt={page.footerPromoImage.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Render date if fillDate is true */}
                  {page.footerPromoImage.fillDate && validTo && (
                    <div
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white font-bold text-sm"
                      style={{ fontFamily: 'Vodafone Rg, Arial, sans-serif' }}
                    >
                      {new Date(validTo).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\s/g, '')}
                    </div>
                  )}
                  {isEditable && onRemoveFooter && (
                    <button
                      onClick={onRemoveFooter}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Patička (2cm) - Přetáhněte sem promo obrázek
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
