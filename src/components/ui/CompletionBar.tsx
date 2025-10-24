import React from 'react';

interface CompletionBarProps {
  percentage: number;
  showLabel?: boolean;
}

export const CompletionBar: React.FC<CompletionBarProps> = ({ percentage, showLabel = true }) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Dokončení</span>
          <span className="text-sm font-medium text-gray-700">{clampedPercentage}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            clampedPercentage === 100
              ? 'bg-green-600'
              : clampedPercentage >= 75
              ? 'bg-blue-600'
              : clampedPercentage >= 50
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};
