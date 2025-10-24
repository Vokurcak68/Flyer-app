import React from 'react';
import { FlyerStatus, ApprovalStatus } from '../../types';
import { cn } from '../../utils/helpers';

interface StatusBadgeProps {
  status: FlyerStatus | ApprovalStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Koncept', className: 'bg-gray-100 text-gray-800' },
    pending_approval: { label: 'Čeká na schválení', className: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Schváleno', className: 'bg-green-100 text-green-800' },
    rejected: { label: 'Zamítnuto', className: 'bg-red-100 text-red-800' },
    active: { label: 'Aktivní', className: 'bg-blue-100 text-blue-800' },
    expired: { label: 'Vypršel', className: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Čeká', className: 'bg-yellow-100 text-yellow-800' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
};
