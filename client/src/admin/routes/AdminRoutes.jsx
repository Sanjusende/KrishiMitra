import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import AdminLayout from '../layouts/AdminLayout';

// Lazy loading all admin pages
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Farmers = lazy(() => import('../pages/Farmers'));
const FarmerDetails = lazy(() => import('../pages/FarmerDetails'));
const Farms = lazy(() => import('../pages/Farms'));
const CropHealth = lazy(() => import('../pages/CropHealth'));
const DiseaseManagement = lazy(() => import('../pages/DiseaseManagement'));
const IrrigationAnalytics = lazy(() => import('../pages/IrrigationAnalytics'));
const WeatherAnalytics = lazy(() => import('../pages/WeatherAnalytics'));
const MarketIntelligence = lazy(() => import('../pages/MarketIntelligence'));
const Notifications = lazy(() => import('../pages/Notifications'));
const GovernmentSchemes = lazy(() => import('../pages/GovernmentSchemes'));
const SupportTickets = lazy(() => import('../pages/SupportTickets'));
const Reports = lazy(() => import('../pages/Reports'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const Settings = lazy(() => import('../pages/Settings'));
const CommunityReports = lazy(() => import('../pages/CommunityReports'));

// Loading Screen Skeleton
const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500">Loading KrishiMitra Console...</p>
    </div>
  </div>
);

/**
 * Route guard for administrative routes.
 */
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) return <AdminLoader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return <AdminLayout>{children}</AdminLayout>;
};

/**
 * Route guard for public administrative login.
 */
const AdminPublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) return <AdminLoader />;
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  return children;
};

const AdminRoutes = () => {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<AdminLoader />}>
        <Routes>
          {/* Public Auth Screen */}
          <Route
            path="/login"
            element={
              <AdminPublicRoute>
                <Login />
              </AdminPublicRoute>
            }
          />

          {/* Protected Subsystem Screens */}
          <Route
            path="/dashboard"
            element={
              <AdminProtectedRoute>
                <Dashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/farmers"
            element={
              <AdminProtectedRoute>
                <Farmers />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/farmers/:id"
            element={
              <AdminProtectedRoute>
                <FarmerDetails />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/farms"
            element={
              <AdminProtectedRoute>
                <Farms />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/crop-health"
            element={
              <AdminProtectedRoute>
                <CropHealth />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/diseases"
            element={
              <AdminProtectedRoute>
                <DiseaseManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/irrigation"
            element={
              <AdminProtectedRoute>
                <IrrigationAnalytics />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <AdminProtectedRoute>
                <WeatherAnalytics />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/market"
            element={
              <AdminProtectedRoute>
                <MarketIntelligence />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <AdminProtectedRoute>
                <Notifications />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/schemes"
            element={
              <AdminProtectedRoute>
                <GovernmentSchemes />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <AdminProtectedRoute>
                <SupportTickets />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <AdminProtectedRoute>
                <Reports />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <AdminProtectedRoute>
                <AuditLogs />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminProtectedRoute>
                <Settings />
              </AdminProtectedRoute>
            }
          />

          {/* Catch all sub-path redirects to dashboard */}
          <Route
            path="/community-reports"
            element={
              <AdminProtectedRoute>
                <CommunityReports />
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  );
};

export default AdminRoutes;
