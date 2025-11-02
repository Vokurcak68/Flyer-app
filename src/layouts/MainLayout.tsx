import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Package, FileText, CheckCircle, Home, Grid, Tag, Users, Image, Star, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// Main layout component
export const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrátor',
      'supplier': 'Dodavatel',
      'pre_approver': 'Předschvalovatel',
      'approver': 'Schvalovatel',
      'end_user': 'Koncový uživatel',
    };
    return roleLabels[role] || role;
  };

  const getNavigationItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'admin':
        return [
          { to: '/dashboard', icon: Home, label: 'Přehled' },
          { to: '/admin/users', icon: Users, label: 'Uživatelé' },
          { to: '/admin/icons', icon: Star, label: 'Ikony' },
          { to: '/brands', icon: Tag, label: 'Značky' },
          { to: '/promo-images', icon: Image, label: 'Promo obrázky' },
        ];
      case 'supplier':
        return [
          { to: '/dashboard', icon: Home, label: 'Přehled' },
          { to: '/products', icon: Package, label: 'Produkty' },
          { to: '/promo-images', icon: Image, label: 'Promo obrázky' },
          { to: '/flyers', icon: FileText, label: 'Letáky' },
        ];
      case 'pre_approver':
        return [
          { to: '/dashboard', icon: Home, label: 'Přehled' },
          { to: '/approvals', icon: CheckCircle, label: 'Předschvalování' },
          { to: '/active-flyers', icon: FileText, label: 'Aktivní letáky' },
        ];
      case 'approver':
        return [
          { to: '/dashboard', icon: Home, label: 'Přehled' },
          { to: '/approvals', icon: CheckCircle, label: 'Schvalování' },
          { to: '/active-flyers', icon: FileText, label: 'Aktivní letáky' },
        ];
      case 'end_user':
        return [
          { to: '/dashboard', icon: Home, label: 'Přehled' },
          { to: '/active-flyers', icon: FileText, label: 'Aktivní letáky' },
          { to: '/my-flyers', icon: Grid, label: 'Moje letáky' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="ml-3 text-xl font-bold text-gray-900">Správa letáků</h1>
              </Link>

              <nav className="ml-10 flex space-x-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="/UZIVATELSKY_NAVOD.html"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title="Uživatelská nápověda"
              >
                <HelpCircle className="w-5 h-5" />
              </a>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  {user && getRoleLabel(user.role)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title="Odhlásit se"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  );
};
