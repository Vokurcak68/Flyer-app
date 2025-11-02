import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsListPage } from './pages/products/ProductsListPage';
import { ProductFormPage } from './pages/products/ProductFormPage';
import { BrandsListPage } from './pages/brands/BrandsListPage';
import { BrandFormPage } from './pages/brands/BrandFormPage';
import { PromoImagesPage } from './pages/promo-images/PromoImagesPage';
import { FlyersListPage } from './pages/flyers/FlyersListPage';
import { FlyerEditorPage } from './pages/flyers/FlyerEditorPage';
import { ActiveFlyersPage } from './pages/flyers/ActiveFlyersPage';
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { ApprovalReviewPage } from './pages/approvals/ApprovalReviewPage';
import { UsersListPage } from './pages/admin/UsersListPage';
import { UserFormPage } from './pages/admin/UserFormPage';
import { IconsManagementPage } from './pages/admin/IconsManagementPage';

function App() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Admin Routes */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/icons"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <IconsManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Brands Routes (Admin only) */}
          <Route
            path="brands"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BrandsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="brands/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BrandFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="brands/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BrandFormPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="products"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <ProductsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/new"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />

          {/* Promo Images Routes (Supplier + Admin) */}
          <Route
            path="promo-images"
            element={
              <ProtectedRoute allowedRoles={['supplier', 'admin']}>
                <PromoImagesPage />
              </ProtectedRoute>
            }
          />

          {/* Flyer Routes (Supplier) */}
          <Route
            path="flyers"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <FlyersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="flyers/:id"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <FlyerEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Approver Routes */}
          <Route
            path="approvals"
            element={
              <ProtectedRoute allowedRoles={['approver', 'pre_approver']}>
                <ApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="approvals/:approvalId"
            element={
              <ProtectedRoute allowedRoles={['approver', 'pre_approver']}>
                <ApprovalReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Active Flyers Routes (Approver + Pre-Approver + End User) */}
          <Route
            path="active-flyers"
            element={
              <ProtectedRoute allowedRoles={['approver', 'pre_approver', 'end_user']}>
                <ActiveFlyersPage />
              </ProtectedRoute>
            }
          />

          {/* My Flyers Routes (End User) - uses same pages as supplier */}
          <Route
            path="my-flyers"
            element={
              <ProtectedRoute allowedRoles={['end_user']}>
                <FlyersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-flyers/new"
            element={
              <ProtectedRoute allowedRoles={['end_user']}>
                <FlyerEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-flyers/:id"
            element={
              <ProtectedRoute allowedRoles={['end_user']}>
                <FlyerEditorPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
