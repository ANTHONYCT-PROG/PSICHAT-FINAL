import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const SmartRedirect: React.FC = () => {
  const { user, token, restore } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión al cargar
    restore();
    
    // Dar tiempo para que se cargue la sesión
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [restore]);

  // Si está cargando, mostrar loading
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center', color: '#6366f1' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: '4px solid #e0e7ff', 
            borderTop: '4px solid #6366f1', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: 18 }}>Cargando...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si no hay token, ir a login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay usuario cargado, ir a login (token inválido)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir directamente según el rol
  if (user.rol === 'tutor' || user.rol === 'admin') {
    return <Navigate to="/tutor" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export default SmartRedirect; 