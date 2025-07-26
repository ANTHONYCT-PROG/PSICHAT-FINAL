// frontend/src/components/dashboard/TutorDashboard.tsx
/**
 * Dashboard principal del tutor - Panel robusto y moderno
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { 
  FaUserTie, 
  FaComments, 
  FaClock, 
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
  FaChartLine,
  FaBell,
  FaUsers,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';
import { tutorService } from '../../services/tutorService';
import type { TutorDashboard as TutorDashboardType } from '../../services/tutorService';
import SessionsManager from './SessionsManager';
import MessageInbox from './MessageInbox';

const TutorDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<TutorDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'alerts' | 'students'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getDashboard();
      setDashboard(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el dashboard');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error || 'No se pudo cargar el dashboard'}</p>
            <button 
              onClick={loadDashboard}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel del Tutor</h1>
              <p className="text-gray-600">Gestión completa de sesiones y estudiantes</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <FaBell className="text-gray-400 text-xl" />
                {dashboard.notificaciones_no_leidas > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {dashboard.notificaciones_no_leidas}
                  </span>
                )}
              </div>
              <button 
                onClick={loadDashboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: FaChartLine },
              { id: 'sessions', label: 'Sesiones', icon: FaComments },
              { id: 'alerts', label: 'Alertas', icon: FaExclamationTriangle },
              { id: 'students', label: 'Estudiantes', icon: FaUsers }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="text-lg" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewTab dashboard={dashboard} />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'alerts' && <AlertsTab />}
        {activeTab === 'students' && <StudentsTab />}
      </div>
    </div>
  );
};

// Componente de la pestaña Overview
const OverviewTab: React.FC<{ dashboard: TutorDashboardType }> = ({ dashboard }) => {
  const stats = dashboard.stats;

  const statCards = [
    {
      title: 'Sesiones Activas',
      value: stats.sesiones_activas,
      icon: FaComments,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Sesiones Hoy',
      value: stats.sesiones_hoy,
      icon: FaClock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Alertas Pendientes',
      value: stats.alertas_pendientes,
      icon: FaExclamationTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Estudiantes Activos',
      value: stats.estudiantes_activos,
      icon: FaUsers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Mensajes Hoy',
      value: stats.mensajes_hoy,
      icon: FaComments,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Intervenciones Hoy',
      value: stats.intervenciones_hoy,
      icon: FaLightbulb,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`text-2xl ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Bandeja de Mensajes (reemplaza Sesiones Recientes) */}
      <MessageInbox />
      {/* Alertas Recientes (opcional, puedes dejarlo o quitarlo) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaExclamationTriangle className="mr-2 text-red-500" />
            Alertas Recientes
          </h3>
        </div>
        <div className="p-6">
          {dashboard.alertas_recientes.length > 0 ? (
            <div className="space-y-4">
              {dashboard.alertas_recientes.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{alert.estudiante_nombre}</h4>
                    <p className="text-sm text-gray-600">{alert.tipo_alerta}</p>
                    <div className="flex items-center mt-2 space-x-4 text-xs">
                      <span className={`px-2 py-1 rounded-full ${tutorService.getUrgencyColor(alert.nivel_urgencia)}`}>
                        {alert.nivel_urgencia}
                      </span>
                      <span className="text-gray-500">{tutorService.formatRelativeTime(alert.creado_en)}</span>
                      {alert.revisada && (
                        <span className="text-green-600 flex items-center">
                          <FaCheckCircle className="mr-1" />
                          Revisada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay alertas recientes</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const SessionsTab: React.FC = () => (
  <SessionsManager />
);

const MessagesTab: React.FC = () => (
  <MessageInbox />
);

const AlertsTab: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestión de Alertas</h3>
    <p className="text-gray-600">Componente de alertas en desarrollo...</p>
  </div>
);

const StudentsTab: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestión de Estudiantes</h3>
    <p className="text-gray-600">Componente de estudiantes en desarrollo...</p>
  </div>
);

export default TutorDashboard; 