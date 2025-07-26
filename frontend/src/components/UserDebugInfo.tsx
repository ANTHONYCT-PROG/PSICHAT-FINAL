import React, { useState } from 'react';
import { User, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const UserDebugInfo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, token, tabId } = useAuthStore();

  const userInfo = {
    id: user?.id,
    nombre: user?.nombre,
    email: user?.email,
    rol: user?.rol,
    tabId: tabId,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    sessions: JSON.parse(localStorage.getItem('sessions') || '{}')
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(userInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      borderRadius: 8,
      padding: 12,
      fontSize: 12,
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <User size={14} />
        <span style={{ fontWeight: 600 }}>Debug Info</span>
        <button
          onClick={() => setIsVisible(!isVisible)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 2
          }}
        >
          {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={copyToClipboard}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 2
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      
      {isVisible && (
        <div style={{ maxWidth: 300 }}>
          <div><strong>ID:</strong> {userInfo.id}</div>
          <div><strong>Nombre:</strong> {userInfo.nombre}</div>
          <div><strong>Email:</strong> {userInfo.email}</div>
          <div><strong>Rol:</strong> {userInfo.rol}</div>
          <div><strong>Tab ID:</strong> {userInfo.tabId}</div>
          <div><strong>Token:</strong> {userInfo.hasToken ? '✅' : '❌'} ({userInfo.tokenLength} chars)</div>
          <div><strong>Sesiones:</strong> {Object.keys(userInfo.sessions).length}</div>
        </div>
      )}
    </div>
  );
};

export default UserDebugInfo; 