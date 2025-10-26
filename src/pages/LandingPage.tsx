import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Index from './Index';

const LandingPage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      navigate('/dashboard');
    }
  }, [user, userRole, loading, navigate]);

  // Show the public landing page for unauthenticated users
  return <Index />;
};

export default LandingPage;
