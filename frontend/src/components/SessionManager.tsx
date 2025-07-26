import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Users, LogOut, Plus, User, Shield } from 'lucide-react';

interface SessionInfo {
  tabId: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
  isCurrent: boolean;
}

const SessionManager: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const { tabId, user, logout, switchSession } = useAuthStore();

  useEffect(() => {
    const updateSessions = () => {
      const sessionsData = JSON.parse(localStorage.getItem('sessions') || '{}');
      const currentTabId = sessionStorage.getItem('tabId');
      
      const sessionsList: SessionInfo[] = Object.entries(sessionsData).map(([tabId, data]: [string, any]) => ({
        tabId,
        user: data.user,
        isCurrent: tabId === currentTabId
      }));
      
      setSessions(sessionsList);
    };

    updateSessions();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => updateSessions();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleStorageChange);
    };
  }, []);

  const handleSwitchSession = (targetTabId: string) => {
    switchSession(targetTabId);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'tutor':
      case 'admin':
        return <Shield size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'tutor':
      case 'admin':
        return '#8b5cf6';
      default:
        return '#3b82f6';
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 500,
          color: '#374151',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Users size={16} />
        <span>Sesiones ({sessions.length})</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          minWidth: 280,
          zIndex: 1000
        }}>
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: '#1f2937', 
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Users size={16} />
              Sesiones Activas
            </h4>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
              Gestiona tus sesiones en diferentes pestañas
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((session) => (
              <div
                key={session.tabId}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: session.isCurrent ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.6)',
                  border: session.isCurrent ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.3)',
                  cursor: session.isCurrent ? 'default' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => !session.isCurrent && handleSwitchSession(session.tabId)}
                onMouseEnter={(e) => {
                  if (!session.isCurrent) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!session.isCurrent) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      color: getRoleColor(session.user.rol),
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {getRoleIcon(session.user.rol)}
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#1f2937', 
                        margin: '0 0 2px 0' 
                      }}>
                        {session.user.nombre}
                      </p>
                      <p style={{ 
                        fontSize: 12, 
                        color: '#6b7280', 
                        margin: 0,
                        textTransform: 'capitalize'
                      }}>
                        {session.user.rol}
                      </p>
                    </div>
                  </div>
                  {session.isCurrent && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#6366f1',
                      background: 'rgba(99, 102, 241, 0.1)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      Actual
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: 12, 
            paddingTop: 12, 
            borderTop: '1px solid rgba(255,255,255,0.3)' 
          }}>
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <LogOut size={14} />
              Cerrar Sesión Actual
            </button>
          </div>

          <div style={{ 
            marginTop: 8, 
            textAlign: 'center' 
          }}>
            <button
              onClick={() => window.open('/login', '_blank')}
              style={{
                background: 'none',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                margin: '0 auto'
              }}
            >
              <Plus size={14} />
              Nueva Sesión
            </button>
          </div>
        </div>
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SessionManager; 