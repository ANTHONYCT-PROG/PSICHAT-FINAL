import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaClock, 
  FaComments, 
  FaExclamationTriangle,
  FaEye,
  FaPhone,
  FaGraduationCap,
  FaBuilding
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { tutorService } from '../../services/tutorService';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  nombre: string;
  email: string;
  institucion?: string;
  grado_academico?: string;
  ultimo_acceso?: string;
  sesiones_count: number;
  alertas_count?: number;
  estado?: string;
}

interface StudentCardProps {
  student: Student;
  onViewProfile: (studentId: number) => void;
  onUpdate: () => void;
}

export default function StudentCard({ student, onViewProfile, onUpdate }: StudentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)} días`;
    return date.toLocaleDateString('es-ES');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'activo':
        return 'text-green-600 bg-green-100';
      case 'inactivo':
        return 'text-gray-600 bg-gray-100';
      case 'ausente':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEngagementLevel = (sessionsCount: number) => {
    if (sessionsCount >= 10) return { level: 'Alto', color: 'text-green-600', icon: '🔥' };
    if (sessionsCount >= 5) return { level: 'Medio', color: 'text-yellow-600', icon: '⭐' };
    return { level: 'Bajo', color: 'text-gray-600', icon: '🌱' };
  };

  const loadProgress = async () => {
    if (progress) return; // Ya cargado
    
    try {
      setIsLoading(true);
      const data = await tutorService.getStudentProgress(student.id);
      setProgress(data);
    } catch (error) {
      console.error('Error loading student progress:', error);
      toast.error('Error al cargar el progreso del estudiante');
    } finally {
      setIsLoading(false);
    }
  };

  const engagement = getEngagementLevel(student.sesiones_count);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaGraduationCap className="text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800 truncate">{student.nombre}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.estado)}`}>
                  {student.estado || 'activo'}
                </span>
        </div>
        
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <FaEnvelope className="text-gray-400" />
            {student.email}
          </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <FaComments />
                  {student.sesiones_count} sesiones
                </span>
                {student.alertas_count && student.alertas_count > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <FaExclamationTriangle />
                    {student.alertas_count} alertas
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FaClock />
                  {formatTime(student.ultimo_acceso)}
          </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${engagement.color}`}>
                  {engagement.icon} {engagement.level} engagement
                </span>
                {student.institucion && (
                  <span className="text-xs text-gray-500">
                    {student.institucion}
                  </span>
                )}
              </div>
        </div>
      </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
            >
              <FaEye />
            </button>
            
            <button
              onClick={() => onViewProfile(student.id)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              Ver perfil
            </button>
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Información del Estudiante</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Institución:</span>
                    <span className="text-gray-800">{student.institucion || 'No especificada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grado académico:</span>
                    <span className="text-gray-800">{student.grado_academico || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Último acceso:</span>
                    <span className="text-gray-800">{formatTime(student.ultimo_acceso)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total sesiones:</span>
                    <span className="text-gray-800">{student.sesiones_count}</span>
                  </div>
        </div>
      </div>

              {/* Progress Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Resumen de Progreso</h4>
                {!progress ? (
                  <button
                    onClick={loadProgress}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Cargando...' : 'Cargar progreso'}
                  </button>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sesiones completadas:</span>
                      <span className="text-gray-800">{progress.progreso?.sesiones_completadas || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total mensajes:</span>
                      <span className="text-gray-800">{progress.progreso?.total_mensajes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alertas generadas:</span>
                      <span className="text-gray-800">{progress.progreso?.alertas_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nivel de engagement:</span>
                      <span className={`font-medium ${engagement.color}`}>
                        {engagement.level}
            </span>
          </div>
            </div>
          )}
        </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Acciones Rápidas</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewProfile(student.id)}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
                >
                  Ver perfil completo
                </button>
        <button
                  onClick={() => {/* Implementar chat directo */}}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Iniciar chat
        </button>
        <button
                  onClick={() => {/* Implementar notas */}}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Agregar notas
        </button>
      </div>
    </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 