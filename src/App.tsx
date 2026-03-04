import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import LoginView from './pages/LoginView';
import { supabase } from './lib/supabase';
import { authService } from './lib/supabase-service';

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
    const initAuth = async () => {
      console.log("Initializing Auth...");
      try {
        const profile = await authService.getCurrentProfile();
        if (profile) {
          console.log("Found existing session profile:", profile.email);
          handleLogin(profile);
        } else {
          console.log("No active session found on init.");
        }
      } catch (err) {
        console.error("Critical error during auth init:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('--- Auth Event ---', event);

      if (session?.user) {
        console.log('User detected in session:', session.user.email);
        try {
          const profile = await authService.getCurrentProfile();
          if (profile) {
            const isRecovery = event === 'PASSWORD_RECOVERY';
            const finalProfile = isRecovery ? { ...profile, must_change_password: true } : profile;

            console.log('Applying profile to state:', finalProfile.email, 'Must change:', !!finalProfile.must_change_password);
            handleLogin(finalProfile);
          } else {
            console.warn('Profile not found for session in onAuthStateChange');
          }
        } catch (err) {
          console.error('Error fetching profile in state change:', err);
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('Signed out event detected');
        handleLogout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('gente_gestao_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gente_gestao_user');
  };

  if (loading) return <LoadingSpinner />;

  const mustChange = user?.must_change_password;

  if ((!user || mustChange) && !isPublicRoute) {
    return <LoginView onLogin={handleLogin} currentUser={user} />;
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
