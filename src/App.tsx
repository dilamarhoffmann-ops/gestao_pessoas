import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import LoginView from './pages/LoginView';
import { supabase } from './lib/supabase';
import { authService } from './lib/supabase-service';

// Lazy load pages for better performance
import Dashboard from './pages/Dashboard';
import DiscountsPage from './pages/DiscountsPage';
import LawsuitsPage from './pages/LawsuitsPage';
import HiringPage from './pages/HiringPage';
import ConfigurationPage from './pages/ConfigurationPage';
import DiscAssessmentPage from './pages/DiscAssessmentPage';
import ReceiptsPage from './pages/ReceiptsPage';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isPublicRoute = window.location.pathname.startsWith('/disc-assessment');

  useEffect(() => {
    let isInitializing = true;

    const setupAuth = async () => {
      console.log("Setting up Auth Listener...");

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('--- Auth Event ---', event);

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
          if (session?.user) {
            console.log('User detected in session:', session.user.email);
            // Break out of the event loop to prevent Supabase Auth deadlock
            // Supabase.from() queries require session lock, which is currently held by onAuthStateChange!
            setTimeout(async () => {
              try {
                const profile = await authService.getCurrentProfile(session.user.id);
                if (profile) {
                  const isRecovery = event === 'PASSWORD_RECOVERY';
                  const finalProfile = isRecovery ? { ...profile, must_change_password: true } : profile;

                  console.log('Applying profile to state:', finalProfile.email, 'Must change:', !!finalProfile.must_change_password);
                  handleLogin(finalProfile);
                } else {
                  console.warn('Profile not found for session in onAuthStateChange');
                  handleLogout(); // Clean state if profile is invalid
                }
              } catch (err) {
                console.error('Error fetching profile in state change:', err);
                handleLogout();
              } finally {
                setLoading(false);
              }
            }, 0);
          } else {
            console.log('No user in session during', event);
            handleLogout();
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Signed out event detected');
          handleLogout();
          setLoading(false);
        }
      });

      return subscription;
    };

    let sub: any;
    setupAuth().then(s => sub = s);

    // Safety timeout in case INITIAL_SESSION never fires or hangs
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.error("Auth init timeout - forcing load state to false");
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      if (sub) sub.unsubscribe();
    };
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
        <>
          <Routes>
            <Route path="/disc-assessment/:id" element={<DiscAssessmentPage />} />
            <Route path="*" element={<Navigate to={`/`} />} />
          </Routes>
        </>
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/discounts" element={<DiscountsPage />} />
              <Route path="/lawsuits" element={<LawsuitsPage />} />
              <Route path="/hiring" element={<HiringPage />} />
              <Route path="/receipts" element={<ReceiptsPage user={user} />} />
              <Route path="/configuration" element={<ConfigurationPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        </Layout>
      )}
    </BrowserRouter>
  );
}
