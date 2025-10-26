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
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { UserFlyersPage } from './pages/user-flyers/UserFlyersPage';
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

          {/* Brands Routes (Admin + Supplier) */}
          <Route
            path="brands"
            element={
              <ProtectedRoute allowedRoles={['admin', 'supplier']}>
                <BrandsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="brands/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'supplier']}>
                <BrandFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="brands/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'supplier']}>
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

          {/* Promo Images Routes (Supplier) */}
          <Route
            path="promo-images"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
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
              <ProtectedRoute allowedRoles={['approver']}>
                <ApprovalsPage />
              </ProtectedRoute>
            }
          />

          {/* End User Routes */}
          <Route
            path="user-flyers"
            element={
              <ProtectedRoute allowedRoles={['end_user']}>
                <UserFlyersPage />
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
