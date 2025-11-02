import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, XCircle, FileText, ArrowLeft } from 'lucide-react';
import { approvalsService } from '../../services/approvalsService';
import { flyersService } from '../../services/flyersService';
import { Button } from '../../components/ui/Button';
import { FlyerPageView } from '../../components/flyer/FlyerPageView';
import { formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

export const ApprovalReviewPage: React.FC = () => {
  const { approvalId } = useParams<{ approvalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isPreApprover = user?.role === 'pre_approver';

  // Fetch all pending approvals to find the current one
  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalsService.getPendingApprovals(),
  });

  const approval = approvals.find(a => a.id === approvalId);

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!approval) throw new Error('No approval');
      // Backend expects format: flyerId_approverId
      const backendApprovalId = `${approval.flyerId}_${approval.approverId}`;
      if (isPreApprover) {
        return approvalsService.preApprove(backendApprovalId, { comment });
      }
      return approvalsService.approve(backendApprovalId, { comment });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
      await queryClient.invalidateQueries({ queryKey: ['flyers'] });
      navigate('/approvals', { replace: true });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!approval) throw new Error('No approval');
      // Backend expects format: flyerId_approverId
      const backendApprovalId = `${approval.flyerId}_${approval.approverId}`;
      if (isPreApprover) {
        return approvalsService.preReject(backendApprovalId, { comment });
      }
      return approvalsService.reject(backendApprovalId, { comment });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
      await queryClient.invalidateQueries({ queryKey: ['flyers'] });
      navigate('/approvals', { replace: true });
    },
  });

  const handleApprove = async () => {
    if (!comment.trim()) {
      alert('Prosím zadejte komentář');
      return;
    }
    await approveMutation.mutateAsync();
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('Prosím zadejte důvod zamítnutí');
      return;
    }
    if (window.confirm('Opravdu chcete zamítnout tento leták?')) {
      await rejectMutation.mutateAsync();
    }
  };

  const handleGeneratePdf = async () => {
    if (!approval?.flyer?.id) return;

    setIsGeneratingPdf(true);
    try {
      const blob = await flyersService.getPdfBlob(approval.flyer.id, true);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Chyba při generování PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!approval || !approval.flyer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">Leták nenalezen</p>
          <Button className="mt-4" onClick={() => navigate('/approvals')}>
            Zpět na seznam
          </Button>
        </div>
      </div>
    );
  }

  const flyer = approval.flyer;
  const currentPage = flyer.pages[currentPageIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      {/* Main Content - 2 column layout */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Left Column: Info & Actions */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Header Panel */}
          <div className="bg-white rounded-lg shadow p-4 flex-shrink-0">
            <div className="mb-4">
              <Button variant="outline" onClick={() => navigate('/approvals')} size="sm" className="mb-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zpět
              </Button>
              <h1 className="text-lg font-bold mb-2">{flyer.name}</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Platnost: {formatDate(flyer.validFrom)} - {formatDate(flyer.validTo)}</div>
                <div>Stránek: {flyer.pages.length}</div>
                <div>Odesláno: {formatDate(approval.createdAt)}</div>
              </div>
            </div>

            {!isPreApprover && approval.preApprovalStatus === 'pre_approved' && approval.preApprovedAt && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Předschváleno: {formatDate(approval.preApprovedAt)}
                </div>
                {approval.approver && (
                  <div className="text-sm text-blue-700">
                    Předschvalovatel: {approval.approver.firstName} {approval.approver.lastName}
                  </div>
                )}
                {approval.comment && (
                  <div className="text-sm text-blue-700 italic mt-1">Komentář: "{approval.comment}"</div>
                )}
              </div>
            )}

            <div className="flex flex-col space-y-2 mb-4">
              <Button variant="outline" onClick={handleGeneratePdf} isLoading={isGeneratingPdf} size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Zobrazit PDF
              </Button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komentář {isPreApprover ? '(volitelný)' : '(povinný)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder={isPreApprover ? 'Váš komentář...' : 'Důvod schválení/zamítnutí...'}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                variant="success"
                onClick={handleApprove}
                isLoading={approveMutation.isPending}
                size="sm"
              >
                <Check className="w-4 h-4 mr-2" />
                {isPreApprover ? 'Předschválit' : 'Schválit'}
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={rejectMutation.isPending}
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Zamítnout
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Flyer Preview */}
        <div className="col-span-3">
          <FlyerPageView
            page={currentPage}
            pageIndex={currentPageIndex}
            isEditable={false}
          />
        </div>
      </div>

      {/* Page Navigation - Full Width Bottom */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Strana {currentPageIndex + 1} / {flyer.pages.length}</h3>
          <div className="flex space-x-2">
            {flyer.pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPageIndex(index)}
                className={`w-10 h-10 rounded ${
                  currentPageIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
