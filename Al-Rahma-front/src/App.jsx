import React, { lazy, Suspense } from 'react';
import { QueryClientProvider } from 'react-query';
import { queryClient } from './react-query-client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';
import Header from './Components/Header';
import Sidebar from './Components/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.rtl.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import 'bootstrap/dist/js/bootstrap';
import ErrorBoundary from './Components/common/ErrorBoundary';
import NotFound from './Components/common/NotFound';
import LoadingSpinner from './Components/common/LoadingSpinner';

const Login = lazy(() => import('./Components/Login/Login'));
const Dashboard = lazy(() => import('./Components/Dashboard/Dashboard'));
const ActImm = lazy(() => import('./Components/ActImm/ActImm'));
const Member = lazy(() => import('./Components/Members/Member'));
const Users = lazy(() => import('./Components/Users/Users'));
const PrintableTable = lazy(() => import('./Components/Members/PrintableTable'));
const MembershipUpdateList = lazy(() => import('./Components/Members/MembershipUpdateList'));
const Dons = lazy(() => import('./Components/Dons/Dons'));
const Aid = lazy(() => import('./Components/Dons/Aid/Aid'));
const Donations = lazy(() => import('./Components/Dons/Donations/Donations'));
const Purchase = lazy(() => import('./Components/Purchase/Purchase'));
const StockManagement = lazy(() => import('./Components/StockManagement/StockManagement.jsx'));
const Gift = lazy(() => import('./Components/Dons/Gift/Gift'));
const Testament = lazy(() => import('./Components/Dons/Testament/Testament'));
const MedicalEquipment = lazy(() => import('./Components/MedicEquip/MedicEquip'));
const Dispatch = lazy(() => import('./Components/Dispatch/Dispatch'));

const PV = lazy(() => import('./Components/PV/PV'));
const FinishedProjects = lazy(() => import('./Components/Projects/FinishedProjects.jsx'));
const SuggestedPrograms = lazy(() => import('./Components/SuggestedPrograms/SuggestedPrograms'));
const OngoingProjects = lazy(() => import('./Components/OngoingProjects/OngoingProjects'));
const SuggestedProgramFormPage = lazy(() => import('./Components/SuggestedPrograms/SuggestedProgramFormPage'));
const GeneralSession = lazy(() => import('./Components/GeneralSessions/GeneralSessions'));
const InternalRegulations = lazy(() => import('./Components/InternalRegulations/InternalRegulations'));
const DeliberationFormPage = lazy(() => import('./Components/PV/deliberations/DeliberationFormPage'));
const Deliberations = lazy(() => import('./Components/PV/deliberations/Deliberations'));
const UserProfile = lazy(() => import('./Components/UserProfile/UserProfile'));
const WaitingList = lazy(() => import('./Components/WaitingList/WaitingList'));
const UpdatePassword = lazy(() => import('./Components/UpdatePassword'));

const Layout = ({ children }) => {
  const location = useLocation();
  const showSidebar = !['/login',  '/404'].includes(location.pathname);

  return (
    <div className="app-container">
      <Header />
      {showSidebar && <Sidebar />}
      <div className="content-area">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

// FIXED: Show loading spinner only during INITIAL auth check
const AuthWrapper = ({ children }) => {
  const { loading } = useAuth();
  
  // Only show loading spinner during initial auth check
  // After that, let individual components handle their own loading states
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return children;
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();



  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.Role) {
    console.error('User role is undefined, redirecting to /404');
    return <Navigate to="/404" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.Role)) {
    return <Navigate to="/404" replace />;
  }

  // Restrict Admins from update/delete routes
  if (user.Role === 'Admin' && (
      location.pathname.includes('/edit') ||
      location.pathname.includes('/delete')
  )) {
    return <Navigate to="/404" replace />;
  }

  return children;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div dir="rtl" lang="ar">
        <Toaster position="top-center" />
        <Router>
          <AuthProvider>
            <AuthWrapper>
              <Routes>
                {/* Public routes */}
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Login />
                    </Suspense>
                  }
                />


                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <UserProfile />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/actimm"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <ActImm />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/member"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Member />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route 
                  path="/update-password"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <UpdatePassword />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin']}>
                      <Layout>
                        <Users />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/printable-table"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <PrintableTable />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/membership-update-list"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <MembershipUpdateList />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/dons"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Dons />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/aid"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Aid />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/donations"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Donations />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/waiting-list"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <WaitingList />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/purchase"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Purchase />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/stock-management"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <StockManagement />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/gift"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Gift />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/testament"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Testament />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/medicequip"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <MedicalEquipment />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/dispatch"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <Dispatch />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                

                
                <Route
                  path="/pv"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <PV />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/deliberations"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <Deliberations />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/deliberations/new"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <DeliberationFormPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                

                
                <Route
                  path="/finished-projects"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <FinishedProjects />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/suggested-programs"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <SuggestedPrograms />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/suggested-programs/new"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin', 'User']}>
                      <Layout>
                        <SuggestedProgramFormPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/suggested-programs/edit/:id"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <SuggestedProgramFormPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/ongoing-projects"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <OngoingProjects />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/general-sessions"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <GeneralSession />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/sessions/:id"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <GeneralSession />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route
                  path="/internal-regulations"
                  element={
                    <PrivateRoute allowedRoles={['SuperAdmin', 'Admin']}>
                      <Layout>
                        <InternalRegulations />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </AuthWrapper>
          </AuthProvider>
        </Router>
      </div>
    </QueryClientProvider>
  );
};

export default App;