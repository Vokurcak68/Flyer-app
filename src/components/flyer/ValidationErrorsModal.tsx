import React from 'react';
import { X, AlertTriangle, Download, FileText, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface ValidationError {
  productId: string;
  productName: string;
  eanCode: string;
  errors: string[];
  erpPrice?: number;
  erpOriginalPrice?: number;
  currentPrice?: number;
  currentOriginalPrice?: number;
}

interface ValidationErrorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  flyerName: string;
}

export const ValidationErrorsModal: React.FC<ValidationErrorsModalProps> = ({
  isOpen,
  onClose,
  errors,
  flyerName,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleEditProduct = (productId: string) => {
    // Close modal and navigate to product edit page
    onClose();
    navigate(`/products/${productId}/edit`);
  };

  const exportToTxt = () => {
    let content = `VALIDAČNÍ CHYBY LETÁKU: ${flyerName}\n`;
    content += `Datum: ${new Date().toLocaleString('cs-CZ')}\n`;
    content += `Počet chyb: ${errors.length}\n`;
    content += `${'='.repeat(80)}\n\n`;

    errors.forEach((error, index) => {
      content += `${index + 1}. PRODUKT: ${error.productName}\n`;
      content += `   EAN: ${error.eanCode}\n`;
      content += `   CHYBY:\n`;
      error.errors.forEach((err) => {
        content += `   - ${err}\n`;
      });
      if (error.currentPrice !== undefined && error.erpPrice !== undefined) {
        content += `   Akční cena v letáku: ${error.currentPrice} Kč\n`;
        content += `   Akční cena v ERP: ${error.erpPrice} Kč\n`;
      }
      if (error.currentOriginalPrice !== undefined && error.erpOriginalPrice !== undefined) {
        content += `   Původní cena v letáku: ${error.currentOriginalPrice} Kč\n`;
        content += `   Původní cena v ERP: ${error.erpOriginalPrice} Kč\n`;
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validacni-chyby-${flyerName.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPdf = async () => {
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #dc2626;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 10px;
          }
          .metadata {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .metadata p {
            margin: 5px 0;
          }
          .error-item {
            border: 1px solid #e5e7eb;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #fef2f2;
            page-break-inside: avoid;
          }
          .product-name {
            font-weight: bold;
            font-size: 16px;
            color: #1f2937;
            margin-bottom: 5px;
          }
          .ean {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .error-list {
            list-style-type: none;
            padding-left: 0;
          }
          .error-list li {
            padding: 5px 0;
            border-bottom: 1px dashed #e5e7eb;
          }
          .error-list li:before {
            content: "✖ ";
            color: #dc2626;
            font-weight: bold;
            margin-right: 5px;
          }
          .price-info {
            background-color: #fff;
            padding: 10px;
            margin-top: 10px;
            border-radius: 3px;
            font-size: 13px;
          }
          .price-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
        </style>
      </head>
      <body>
        <h1>Validační chyby letáku</h1>
        <div class="metadata">
          <p><strong>Název letáku:</strong> ${flyerName}</p>
          <p><strong>Datum validace:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p><strong>Počet chyb:</strong> ${errors.length}</p>
        </div>

        ${errors.map((error, index) => `
          <div class="error-item">
            <div class="product-name">${index + 1}. ${error.productName}</div>
            <div class="ean">EAN: ${error.eanCode}</div>
            <ul class="error-list">
              ${error.errors.map(err => `<li>${err}</li>`).join('')}
            </ul>
            ${error.currentPrice !== undefined || error.currentOriginalPrice !== undefined ? `
              <div class="price-info">
                ${error.currentPrice !== undefined && error.erpPrice !== undefined ? `
                  <div class="price-row">
                    <span>Akční cena v letáku:</span>
                    <strong>${error.currentPrice} Kč</strong>
                  </div>
                  <div class="price-row">
                    <span>Akční cena v ERP:</span>
                    <strong>${error.erpPrice} Kč</strong>
                  </div>
                ` : ''}
                ${error.currentOriginalPrice !== undefined && error.erpOriginalPrice !== undefined ? `
                  <div class="price-row">
                    <span>Původní cena v letáku:</span>
                    <strong>${error.currentOriginalPrice} Kč</strong>
                  </div>
                  <div class="price-row">
                    <span>Původní cena v ERP:</span>
                    <strong>${error.erpOriginalPrice} Kč</strong>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validacni-chyby-${flyerName.replace(/\s+/g, '-')}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Note: For true PDF export, you would need a library like jsPDF or html2pdf
    // This exports as HTML which can be printed to PDF from browser
    alert('HTML soubor byl stažen. Pro vytvoření PDF ho otevřete v prohlížeči a použijte Tisknout -> Uložit jako PDF');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Validační chyby letáku</h2>
              <p className="text-sm text-gray-600">Nalezeno {errors.length} {errors.length === 1 ? 'chyba' : errors.length < 5 ? 'chyby' : 'chyb'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {errors.map((error, index) => (
              <div
                key={error.productId}
                className="border border-red-200 bg-red-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">
                      {index + 1}. {error.productName}
                    </h3>
                    <p className="text-sm text-gray-600">EAN: {error.eanCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProduct(error.productId)}
                    className="ml-3"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editovat produkt
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-sm text-red-900">Chyby:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {error.errors.map((err, idx) => (
                      <li key={idx} className="text-sm text-red-800">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>

                {(error.currentPrice !== undefined || error.currentOriginalPrice !== undefined) && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="font-semibold text-sm text-gray-900 mb-2">Detail cen:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {error.currentPrice !== undefined && error.erpPrice !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-600">Akční cena v letáku:</span>
                            <p className="font-semibold">{error.currentPrice} Kč</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Akční cena v ERP:</span>
                            <p className="font-semibold text-green-700">{error.erpPrice} Kč</p>
                          </div>
                        </>
                      )}
                      {error.currentOriginalPrice !== undefined && error.erpOriginalPrice !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-600">Původní cena v letáku:</span>
                            <p className="font-semibold">{error.currentOriginalPrice} Kč</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Původní cena v ERP:</span>
                            <p className="font-semibold text-green-700">{error.erpOriginalPrice} Kč</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToTxt}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportovat TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPdf}
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportovat HTML/PDF
            </Button>
          </div>
          <Button
            variant="danger"
            onClick={onClose}
          >
            Zavřít
          </Button>
        </div>
      </div>
    </div>
  );
};
