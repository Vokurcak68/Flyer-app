import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, XCircle, Eye, FileText } from 'lucide-react';
import { approvalsService } from '../../services/approvalsService';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FlyerPageView } from '../../components/flyer/FlyerPageView';
import { Approval } from '../../types';
import { formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

export const ApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isPreApprover = user?.role === 'pre_approver';

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalsService.getPendingApprovals(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => {
      if (isPreApprover) {
        return approvalsService.preApprove(id, { comment });
      }
      return approvalsService.approve(id, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedApproval(null);
      setComment('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => {
      if (isPreApprover) {
        return approvalsService.preReject(id, { comment });
      }
      return approvalsService.reject(id, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedApproval(null);
      setComment('');
    },
  });

  const handleApprove = async () => {
    if (selectedApproval) {
      // Backend expects approval ID in format: flyerId_approverId
      const approvalId = `${selectedApproval.flyerId}_${selectedApproval.approverId}`;
      await approveMutation.mutateAsync(approvalId);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    if (!comment.trim()) {
      alert('Prosím uveďte důvod zamítnutí');
      return;
    }
    // Backend expects approval ID in format: flyerId_approverId
    const approvalId = `${selectedApproval.flyerId}_${selectedApproval.approverId}`;
    await rejectMutation.mutateAsync(approvalId);
  };

  const handleViewPdf = async (flyerId: string) => {
    try {
      setIsGeneratingPdf(true);

      // For approval stage, only show the saved PDF (generated during submission)
      const pdfBlob = await flyersService.getPdfBlob(flyerId);

      // Create blob URL and open in new window
      const blobUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(blobUrl, '_blank');

      if (!newWindow) {
        alert('Prosím povolte vyskakovací okna pro zobrazení PDF');
        URL.revokeObjectURL(blobUrl);
      } else {
        // Clean up blob URL after window loads
        newWindow.addEventListener('load', () => {
          URL.revokeObjectURL(blobUrl);
        });
      }
    } catch (error: any) {
      console.error('Chyba při zobrazení PDF:', error);
      alert('Nepodařilo se zobrazit PDF náhled.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    <div>Platnost: {approval.flyer ? `${formatDate(approval.flyer.validFrom)} - ${formatDate(approval.flyer.validTo)}` : 'N/A'}</div>
                    <div>Stránek: {approval.flyer?.pages.length || 0}</div>
                    <div>Odesláno: {formatDate(approval.createdAt)}</div>
                    {!isPreApprover && approval.preApprovalStatus === 'pre_approved' && approval.preApprovedAt && (
                      <div>Předschváleno: {formatDate(approval.preApprovedAt)}</div>
                    )}
                  </div>
                </div>
                <Button onClick={() => { setSelectedApproval(approval); setCurrentPageIndex(0); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  Kontrolovat
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => { setSelectedApproval(null); setComment(''); }}
        title={selectedApproval?.flyer?.name}
        size="xl"
      >
        {selectedApproval?.flyer && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              <div>Platnost: {formatDate(selectedApproval.flyer.validFrom)} - {formatDate(selectedApproval.flyer.validTo)}</div>
              <div>Strana {currentPageIndex + 1} z {selectedApproval.flyer.pages.length}</div>
              {!isPreApprover && selectedApproval.preApprovalStatus === 'pre_approved' && selectedApproval.preApprovedAt && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <span className="font-medium text-blue-900">Předschváleno:</span>{' '}
                  <span className="text-blue-700">{formatDate(selectedApproval.preApprovedAt)}</span>
                  {selectedApproval.comment && (
                    <div className="mt-1 text-blue-700 italic">"{selectedApproval.comment}"</div>
                  )}
                </div>
              )}
            </div>

            <FlyerPageView
              page={selectedApproval.flyer.pages[currentPageIndex]}
              pageIndex={currentPageIndex}
              isEditable={false}
            />

            <div className="mt-4 flex justify-center space-x-2">
              {selectedApproval.flyer.pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPageIndex(index)}
                  className={`w-10 h-10 rounded ${
                    currentPageIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Komentář (volitelný)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Přidat komentář..."
              />
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="secondary"
                onClick={() => selectedApproval?.flyer && handleViewPdf(selectedApproval.flyer.id)}
                isLoading={isGeneratingPdf}
              >
                <FileText className="w-4 h-4 mr-2" />
                Zobrazit PDF
              </Button>
              <div className="flex space-x-3">
                <Button variant="danger" onClick={handleReject} isLoading={rejectMutation.isPending}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Zamítnout
                </Button>
                <Button variant="success" onClick={handleApprove} isLoading={approveMutation.isPending}>
                  <Check className="w-4 h-4 mr-2" />
                  {isPreApprover ? 'Předschválit' : 'Schválit'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
