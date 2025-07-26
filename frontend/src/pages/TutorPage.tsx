import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

const TutorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || (user.rol !== 'tutor' && user.rol !== 'admin')) {
      return <Navigate to="/dashboard" replace />;
    }

    // Redirigir al nuevo dashboard de tutores
    navigate('/tutor/dashboard');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 font-sans">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al dashboard de tutores...</p>
        </div>
      </div>
    </div>
  );
};

export default TutorPage; 