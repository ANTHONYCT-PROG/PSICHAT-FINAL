import React, { useState, useEffect } from 'react';
import { 
  FaUserTie, 
  FaComments, 
  FaClock, 
  FaEye,
  FaPlay,
  FaPause,
  FaStop
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { tutorService } from '../../services/tutorService';

interface RecentSession {
  id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  estado: 'activa' | 'pausada' | 'cerrada';
  mensajes_count: number;
  iniciada_en: string;
  ultimo_mensaje?: string;
  prioridad?: string;
}

interface RealTimeStatsProps {
  sessions: RecentSession[];
  onSessionClick: (sessionId: number) => void;
}

export default function RealTimeStats({ sessions, onSessionClick }: RealTimeStatsProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activa':
        return <FaPlay className="text-green-600" />;
      case 'pausada':
        return <FaPause className="text-yellow-600" />;
      case 'cerrada':
        return <FaStop className="text-gray-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa':
        return 'text-green-600 bg-green-100';
      case 'pausada':
        return 'text-yellow-600 bg-yellow-100';
      case 'cerrada':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'alta':
        return 'text-red-600 bg-red-100';
      case 'media':
        return 'text-yellow-600 bg-yellow-100';
      case 'baja':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((currentTime.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES');
  };

  const activeSessions = sessions.filter(s => s.estado === 'activa');
  const pausedSessions = sessions.filter(s => s.estado === 'pausada');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sesiones Activas</p>
              <p className="text-2xl font-bold text-green-600">{activeSessions.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaPlay className="text-green-600" />
              </div>
              </div>
      </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sesiones Pausadas</p>
              <p className="text-2xl font-bold text-yellow-600">{pausedSessions.length}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaPause className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
          <div>
              <p className="text-sm text-gray-600">Total Mensajes</p>
              <p className="text-2xl font-bold text-blue-600">
                {sessions.reduce((total, s) => total + s.mensajes_count, 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaComments className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Actividad Reciente</h2>
          <p className="text-sm text-gray-600">Sesiones de los últimos 24 horas</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          <AnimatePresence>
            {sessions.slice(0, 5).map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSessionClick(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <FaUserTie className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{session.estudiante_nombre}</h3>
                      <p className="text-sm text-gray-600">{session.estudiante_email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaComments />
                          {session.mensajes_count} mensajes
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FaClock />
                          {formatTime(session.iniciada_en)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {session.prioridad && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(session.prioridad)}`}>
                        {session.prioridad}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.estado)}`}>
                      {session.estado}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                      <FaEye />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {sessions.length === 0 && (
            <div className="p-8 text-center">
              <FaComments className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay actividad reciente</p>
              <p className="text-sm text-gray-500 mt-2">Las sesiones aparecerán aquí cuando se inicien</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
} 