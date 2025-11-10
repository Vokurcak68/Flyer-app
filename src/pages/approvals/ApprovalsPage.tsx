import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Eye } from 'lucide-react';
import { approvalsService } from '../../services/approvalsService';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import { AppFooter } from '../../components/layout/AppFooter';

export const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPreApprover = user?.role === 'pre_approver';

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalsService.getPendingApprovals(),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isPreApprover ? 'Předschvalování' : 'Schvalování'}
        </h1>
        <p className="mt-2 text-gray-600">
          {approvals.length} letáků čeká na vaše {isPreApprover ? 'předschválení' : 'schválení'}
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Check className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vše hotovo!</h3>
          <p className="text-gray-600">
            {isPreApprover ? 'Žádná čekající předschválení' : 'Žádná čekající schválení'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {approvals.map(approval => (
            <div key={approval.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{approval.flyer?.name}</h3>
                    {!isPreApprover && approval.preApprovalStatus === 'pre_approved' && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Předschváleno
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {approval.flyer?.actionName && (
                      <div className="font-medium text-blue-700">Akce: {approval.flyer.actionName}</div>
                    )}
                    <div>Platnost: {approval.flyer ? `${formatDate(approval.flyer.validFrom)} - ${formatDate(approval.flyer.validTo)}` : 'N/A'}</div>
                    <div>Stránek: {approval.flyer?.pages.length || 0}</div>
                    <div>Odesláno: {formatDate(approval.createdAt)}</div>
                    {!isPreApprover && approval.preApprovalStatus === 'pre_approved' && approval.preApprovedAt && (
                      <>
                        <div className="font-medium text-blue-700">Předschváleno: {formatDate(approval.preApprovedAt)}</div>
                        {approval.comment && (
                          <div className="text-blue-600 italic">Komentář předschvalovatele: "{approval.comment}"</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <Button onClick={() => navigate(`/approvals/${approval.id}`)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Kontrolovat
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppFooter />
    </div>
  );
};
