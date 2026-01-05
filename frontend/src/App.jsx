import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthScreen } from './components/auth/AuthScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { Toaster } from './components/ui/sonner';
import { useAppContext } from './context/AppContext';

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Loading Application...</h2>
    </div>
  );
}

function App() {
  const { user, handleAuth, handleLogout, isInitializing, loadUserFromToken } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  useEffect(() => {
    if (isInitializing) return;

    // --- START: UPDATED REDIRECT LOGIC ---
    // If the user is logged in and they are somehow at the base '/app' path,
    // redirect them to the default dashboard page.
    if (user && location.pathname === '/app') {
      navigate('/app/projects');
    } 
    // If the user is NOT logged in and they try to access any '/app/*' route,
    // redirect them back to the main landing page to sign in.
    else if (!user && location.pathname.startsWith('/app')) {
      navigate('/');
    }
    // --- END: UPDATED REDIRECT LOGIC ---

  }, [user, isInitializing, navigate, location.pathname]);

  if (isInitializing) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // If not logged in, AuthScreen is the component to render for the '/app' route.
    // The router knows to show this component when the path is '/app' and there's no user.
    return (
      <>
        <AuthScreen onAuth={handleAuth} />
        <Toaster />
      </>
    );
  }
  
  return (
    <>
      <Dashboard user={user} onLogout={handleLogout}>
        <Outlet />
      </Dashboard>
      <Toaster />
    </>
  );
}

export default App;