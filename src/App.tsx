import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import DashboardOverview from './pages/dashboard/Overview';
import CreateClip from './pages/dashboard/CreateClip';
import Projects from './pages/dashboard/Projects';
import ProjectDetail from './pages/dashboard/ProjectDetail';
import Jobs from './pages/dashboard/Jobs';
import WalletPage from './pages/dashboard/Wallet';
import Settings from './pages/dashboard/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <DashboardLayout>
                  <DashboardOverview />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/create"
              element={
                <DashboardLayout>
                  <CreateClip />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/projects"
              element={
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/projects/:id"
              element={
                <DashboardLayout>
                  <ProjectDetail />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/jobs"
              element={
                <DashboardLayout>
                  <Jobs />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/wallet"
              element={
                <DashboardLayout>
                  <WalletPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(220 14% 8%)',
                border: '1px solid hsl(220 12% 16%)',
                color: 'hsl(210 15% 88%)',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
