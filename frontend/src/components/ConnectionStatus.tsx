import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaWifi, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { websocketService } from '../services/websocket';
import { authService } from '../services/auth';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function ConnectionStatus({ className = '', showDetails = false }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [authStatus, setAuthStatus] = useState<'authenticated' | 'unauthenticated'>('unauthenticated');
  const [lastPing, setLastPing] = useState<number>(0);

  useEffect(() => {
    const handleConnectionChange = (data: any) => {
      setConnectionStatus('connected');
    };

    const handleDisconnection = (data: any) => {
      setConnectionStatus('disconnected');
    };

    const handleConnecting = () => {
      setConnectionStatus('connecting');
    };

    // Listen to WebSocket events
    websocketService.on('connected', handleConnectionChange);
    websocketService.on('disconnected', handleDisconnection);

    // Check initial status
    setConnectionStatus(websocketService.getConnectionStatus());
    setAuthStatus(authService.isAuthenticated() ? 'authenticated' : 'unauthenticated');

    // Setup ping interval
    const pingInterval = setInterval(() => {
      if (connectionStatus === 'connected') {
        setLastPing(Date.now());
      }
    }, 30000); // Ping every 30 seconds

    return () => {
      websocketService.off('connected', handleConnectionChange);
      websocketService.off('disconnected', handleDisconnection);
      clearInterval(pingInterval);
    };
  }, [connectionStatus]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <FaWifi size={16} />;
      case 'connecting':
        return <FaSpinner size={16} className="animate-spin" />;
      case 'disconnected':
        return <FaTimes size={16} />;
      default:
        return <FaWifi size={16} />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  const getAuthIcon = () => {
    return authStatus === 'authenticated' ? 
      <FaCheckCircle size={14} className="text-green-500" /> : 
      <FaExclamationTriangle size={14} className="text-red-500" />;
  };

  const getAuthText = () => {
    return authStatus === 'authenticated' ? 'Autenticado' : 'No autenticado';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* WebSocket Status */}
      <div className="flex items-center gap-1">
        <motion.div
          animate={{ 
            scale: connectionStatus === 'connected' ? [1, 1.1, 1] : 1 
          }}
          transition={{ 
            duration: 2, 
            repeat: connectionStatus === 'connected' ? Infinity : 0 
          }}
        >
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
        </motion.div>
        {showDetails && (
          <span className="text-xs text-gray-600">
            {getStatusText()}
          </span>
        )}
      </div>

      {/* Auth Status */}
      {showDetails && (
        <div className="flex items-center gap-1">
          {getAuthIcon()}
          <span className="text-xs text-gray-600">
            {getAuthText()}
          </span>
        </div>
      )}

      {/* Ping Indicator */}
      {showDetails && connectionStatus === 'connected' && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">
            {lastPing > 0 ? 'Activo' : 'En línea'}
          </span>
        </div>
      )}
    </div>
  );
} 