import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import LoginView from './pages/LoginView';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DiscountsPage = lazy(() => import('./pages/DiscountsPage'));
const LawsuitsPage = lazy(() => import('./pages/LawsuitsPage'));
const HiringPage = lazy(() => import('./pages/HiringPage'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage'));
const DiscAssessmentPage = lazy(() => import('./pages/DiscAssessmentPage'));
const ReceiptsPage = lazy(() => import('./pages/ReceiptsPage'));

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isPublicRoute = window.location.pathname.startsWith('/disc-assessment');

  useEffect(() => {
    const saved = localStorage.getItem('gestor_gn_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('gestor_gn_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gestor_gn_user');
  };

  if (loading) return <LoadingSpinner />;

  if (!user && !isPublicRoute) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      {isPublicRoute ? (
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/disc-assessment/:id" element={<DiscAssessmentPage />} />
            <Route path="*" element={<Navigate to={`/`} />} />
          </Routes>
        </Suspense>
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/discounts" element={<DiscountsPage />} />
              <Route path="/lawsuits" element={<LawsuitsPage />} />
              <Route path="/hiring" element={<HiringPage />} />
              <Route path="/receipts" element={<ReceiptsPage user={user} />} />
              <Route path="/configuration" element={<ConfigurationPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </Layout>
      )}
    </BrowserRouter>
  );
}
