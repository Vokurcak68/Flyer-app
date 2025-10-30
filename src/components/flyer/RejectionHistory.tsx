import React, { useState } from 'react';
import { AlertCircle, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Approval } from '../../types';

interface RejectionHistoryProps {
  approvals?: Approval[];
  rejectionReason?: string;
}

export const RejectionHistory: React.FC<RejectionHistoryProps> = ({ approvals, rejectionReason }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!approvals || approvals.length === 0) {
    return null;
  }

  // Filter only rejected approvals and sort by most recent first
  const rejections = approvals
    .filter(approval => approval.status === 'rejected')
    .sort((a, b) => new Date(b.decidedAt || b.createdAt).getTime() - new Date(a.decidedAt || a.createdAt).getTime());

  if (rejections.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const latestRejection = rejections[0];

  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg mb-6">
      {/* Header - always visible, clickable */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center flex-1">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-semibold">
              {rejections.length === 1 ? 'Leták byl zamítnut' : `Leták byl zamítnut ${rejections.length}×`}
            </h3>
            {!isExpanded && (
              <p className="text-sm text-red-700 truncate max-w-3xl">
                {latestRejection.comment || 'Bez komentáře'}
              </p>
            )}
          </div>
        </div>
        <button className="text-red-600 hover:text-red-800 p-1">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {rejections.map((rejection, index) => (
              <div
                key={rejection.id}
                className={`bg-white rounded-md p-3 ${index > 0 ? 'border-t-2 border-red-200' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-1" />
                    <span className="font-medium">
                      {rejection.approver?.firstName} {rejection.approver?.lastName}
                    </span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatDate(rejection.decidedAt || rejection.createdAt)}</span>
                  </div>
                  {index === 0 && rejections.length > 1 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Poslední
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-2">
                  <p className="font-medium text-gray-600 mb-1">Důvod zamítnutí:</p>
                  <p className="whitespace-pre-wrap">{rejection.comment || 'Bez komentáře'}</p>
                </div>
              </div>
            ))}
          </div>

          {rejections.length > 1 && (
            <div className="mt-3 text-sm text-red-700 bg-red-100 rounded p-2">
              💡 <strong>Tip:</strong> Tento leták byl zamítnut vícekrát. Před odesláním ke schválení se ujistěte, že jste zapracovali všechny připomínky.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
