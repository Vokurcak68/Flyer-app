import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, FileText, CheckCircle, TrendingUp, Clock, Grid, Users, Tag, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { productsService } from '../services/productsService';
import { flyersService } from '../services/flyersService';
import { approvalsService } from '../services/approvalsService';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { AppFooter } from '../components/layout/AppFooter';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'supplier':
      return <SupplierDashboard />;
    case 'approver':
      return <ApproverDashboard />;
    case 'pre_approver':
      return <ApproverDashboard />;
    case 'end_user':
      return <EndUserDashboard />;
    default:
      return <div>Unknown role</div>;
  }
};

const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: productStats } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsService.getMyProductsStats(),
  });

  const { data: flyers = [] } = useQuery({
    queryKey: ['flyers', 'my'],
    queryFn: () => flyersService.getMyFlyers(),
  });

  const stats = {
    totalProducts: productStats?.active || 0,
    activeFlyers: flyers.filter((f) => f.status === 'active').length,
    pendingApproval: flyers.filter((f) => f.status === 'pending_approval').length,
    rejectedFlyers: flyers.filter((f) => f.status === 'draft' && f.rejectionReason).length,
    draftFlyers: flyers.filter((f) => f.status === 'draft').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Přehled dodavatele</h1>
        <p className="mt-2 text-gray-600">Spravujte své produkty a letáky</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div
          onClick={() => navigate('/products')}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Celkem produktů</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/flyers?status=active')}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktivní letáky</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.activeFlyers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/flyers?status=pending_approval')}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Čekají na schválení</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pendingApproval}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/flyers?status=rejected')}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zamítnuté letáky</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.rejectedFlyers}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/flyers?status=draft')}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Koncepty letáků</p>
              <p className="mt-2 text-3xl font-bold text-gray-600">{stats.draftFlyers}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <Package className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Správa produktů</h2>
          <p className="mb-6 text-blue-100">Vytvářejte a spravujte katalog produktů</p>
          <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => navigate('/products')}>
            Přejít na produkty
          </Button>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white">
          <FileText className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tvorba letáků</h2>
          <p className="mb-6 text-green-100">Navrhujte a publikujte propagační letáky</p>
          <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50" onClick={() => navigate('/flyers')}>
            Přejít na letáky
          </Button>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

const ApproverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPreApprover = user?.role === 'pre_approver';

  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalsService.getPendingApprovals(),
  });

  const { data: activeFlyers = [] } = useQuery({
    queryKey: ['flyers', 'active'],
    queryFn: () => flyersService.getActiveFlyers(),
  });

  const stats = {
    pending: approvals.filter((a) => a.status === 'pending' || a.preApprovalStatus === 'pending').length,
    approved: approvals.filter((a) => a.status === 'approved' || a.preApprovalStatus === 'pre_approved').length,
    rejected: approvals.filter((a) => a.status === 'rejected' || a.preApprovalStatus === 'rejected').length,
    activeFlyers: activeFlyers.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isPreApprover ? 'Přehled předschvalovatele' : 'Přehled schvalovatele'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isPreApprover ? 'Kontrolujte a předschvalujte letáky' : 'Kontrolujte a schvalujte letáky'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isPreApprover ? 'Čeká na předschválení' : 'Čeká na schválení'}
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isPreApprover ? 'Předschváleno' : 'Schváleno'}
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Zamítnuto</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <CheckCircle className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {isPreApprover ? 'Fronta k předschválení' : 'Fronta ke schválení'}
          </h2>
          <p className="mb-6 text-blue-100">
            {isPreApprover
              ? 'Zkontrolujte čekající letáky a předschvalte nebo zamítněte je'
              : 'Zkontrolujte čekající letáky a schvalte nebo zamítněte je'}
          </p>
          <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => navigate('/approvals')}>
            {isPreApprover ? 'Zobrazit předschvalování' : 'Zobrazit schvalování'} ({stats.pending})
          </Button>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white">
          <FileText className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Aktivní letáky</h2>
          <p className="mb-6 text-green-100">Prohlížejte schválené a aktivní propagační letáky</p>
          <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50" onClick={() => navigate('/active-flyers')}>
            Zobrazit letáky ({stats.activeFlyers})
          </Button>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

const EndUserDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: activeFlyers = [] } = useQuery({
    queryKey: ['flyers', 'active'],
    queryFn: () => flyersService.getActiveFlyers(),
  });

  const { data: myFlyers = [] } = useQuery({
    queryKey: ['flyers', 'my'],
    queryFn: () => flyersService.getMyFlyers(),
  });

  const stats = {
    activeFlyers: activeFlyers.length,
    myFlyers: myFlyers.length,
    myDraftFlyers: myFlyers.filter((f) => f.status === 'draft').length,
    availableProducts: activeFlyers.reduce((total, flyer) =>
      total + flyer.pages.reduce((pageTotal, page) =>
        pageTotal + page.slots.filter(slot => slot && slot.type === 'product' && slot.product).length, 0
      ), 0
    ),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vítejte</h1>
        <p className="mt-2 text-gray-600">Procházejte aktivní letáky a vytvářejte vlastní</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktivní letáky</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.activeFlyers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dostupné produkty</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.availableProducts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Moje letáky</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{stats.myFlyers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Grid className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Koncepty</p>
              <p className="mt-2 text-3xl font-bold text-gray-600">{stats.myDraftFlyers}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <FileText className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Aktivní letáky</h2>
          <p className="mb-6 text-blue-100">Procházejte aktuální nabídku a stahujte PDF letáky</p>
          <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => navigate('/active-flyers')}>
            Zobrazit aktivní letáky
          </Button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <Grid className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Moje letáky</h2>
          <p className="mb-6 text-purple-100">Vytvořte si vlastní letáky z dostupných produktů</p>
          <Button variant="outline" className="bg-white text-purple-600 hover:bg-purple-50" onClick={() => navigate('/my-flyers')}>
            Spravovat moje letáky
          </Button>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands');
      return response.data;
    },
  });

  const stats = {
    totalUsers: users.length,
    suppliers: users.filter((u: any) => u.role === 'supplier').length,
    approvers: users.filter((u: any) => u.role === 'approver').length,
    totalBrands: brands.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administrátorský přehled</h1>
        <p className="mt-2 text-gray-600">Spravujte uživatele a značky systému</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Celkem uživatelů</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dodavatelé</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.suppliers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Schvalovatelé</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.approvers}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Značky</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{stats.totalBrands}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <Users className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Správa uživatelů</h2>
          <p className="mb-6 text-blue-100">Vytvářejte a spravujte uživatele systému</p>
          <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => navigate('/admin/users')}>
            Přejít na uživatele
          </Button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <Tag className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Správa značek</h2>
          <p className="mb-6 text-purple-100">Vytvářejte a spravujte značky produktů</p>
          <Button variant="outline" className="bg-white text-purple-600 hover:bg-purple-50" onClick={() => navigate('/brands')}>
            Přejít na značky
          </Button>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};
