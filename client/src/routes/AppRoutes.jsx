import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageSkeleton } from '../components/ui/Loader';
import { useAuth } from '../context/AuthContext';

// Public pages
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Protected Feature Pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const FarmProfile = lazy(() => import('../pages/FarmProfile'));
const Weather = lazy(() => import('../pages/Weather'));
const Irrigation = lazy(() => import('../pages/Irrigation'));
const CropHealth = lazy(() => import('../pages/CropHealth'));
const MarketIntelligence = lazy(() => import('../pages/MarketIntelligence'));
const VoiceAssistant = lazy(() => import('../pages/VoiceAssistant'));
const FertilizerPlanning = lazy(() => import('../pages/FertilizerPlanning'));
const CropRecommendation = lazy(() => import('../pages/CropRecommendation'));
const AdminRoutes = lazy(() => import('../admin/routes/AdminRoutes'));

/**
 * Route guard for protected routes.
 * Accessible only by authenticated users.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Route guard for public/auth routes.
 * Redirects authenticated users to /dashboard automatically.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public auth pages */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected Agricultural App Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farm-profile"
          element={
            <ProtectedRoute>
              <FarmProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/weather"
          element={
            <ProtectedRoute>
              <Weather />
            </ProtectedRoute>
          }
        />
        <Route
          path="/irrigation"
          element={
            <ProtectedRoute>
              <Irrigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crop-health"
          element={
            <ProtectedRoute>
              <CropHealth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <MarketIntelligence />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice-assistant"
          element={
            <ProtectedRoute>
              <VoiceAssistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fertilizer-planning"
          element={
            <ProtectedRoute>
              <FertilizerPlanning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crop-recommendation"
          element={
            <ProtectedRoute>
              <CropRecommendation />
            </ProtectedRoute>
          }
        />

        {/* Admin Subsystem Routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Catch all 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
