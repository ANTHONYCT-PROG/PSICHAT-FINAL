import React, { useState } from 'react';
import { FaExclamationTriangle, FaEye, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { tutorService } from '../../services/tutorService';
import toast from 'react-hot-toast';

interface Alert {
  id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  tipo_alerta: string;
  nivel_urgencia: 'crítica' | 'alta' | 'media' | 'baja';
  descripcion: string;
  creado_en: string;
  revisada: boolean;
  atendida?: boolean;
  notas_tutor?: string;
  accion_tomada?: string;
}

interface AlertCardProps {
  alert: Alert;
  onUpdate: () => void;
}

export default function AlertCard({ alert, onUpdate }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [notas, setNotas] = useState(alert.notas_tutor || '');
  const [accion, setAccion] = useState(alert.accion_tomada || '');

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'crítica':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'alta':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'media':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'baja':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'crítica':
        return '🔴';
      case 'alta':
        return '🟠';
      case 'media':
        return '🟡';
      case 'baja':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    return date.toLocaleDateString('es-ES');
  };

  const handleReview = async () => {
    try {
      setIsReviewing(true);
      await tutorService.reviewAlert(alert.id, notas, accion);
      toast.success('Alerta revisada correctamente');
      onUpdate();
    } catch (error) {
      console.error('Error reviewing alert:', error);
      toast.error('Error al revisar la alerta');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await tutorService.markAlertAsRead(alert.id);
      toast.success('Alerta marcada como leída');
      onUpdate();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Error al marcar la alerta como leída');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border rounded-lg p-4 transition-all duration-200 ${
        alert.revisada 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-white border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              alert.revisada ? 'bg-gray-200' : 'bg-red-100'
            }`}>
              {getUrgencyIcon(alert.nivel_urgencia)}
          </div>
        </div>
        
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800 truncate">
                {alert.estudiante_nombre}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(alert.nivel_urgencia)}`}>
                {alert.nivel_urgencia}
          </span>
              {alert.revisada && (
                <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                  Revisada
            </span>
          )}
      </div>

            <p className="text-sm text-gray-600 mb-1">{alert.tipo_alerta}</p>
            <p className="text-sm text-gray-700 mb-2">{alert.descripcion}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FaClock />
                {formatTime(alert.creado_en)}
              </span>
              <span>{alert.estudiante_email}</span>
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
          
          {!alert.revisada && (
            <button
              onClick={handleMarkAsRead}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Marcar como leída"
            >
              <FaCheck />
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          {!alert.revisada ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del tutor
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Agregar notas sobre esta alerta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acción tomada
                </label>
                <select
                  value={accion}
                  onChange={(e) => setAccion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Seleccionar acción...</option>
                  <option value="contactado_estudiante">Contactado al estudiante</option>
                  <option value="programada_intervencion">Programada intervención</option>
                  <option value="escalada_supervisor">Escalada a supervisor</option>
                  <option value="resuelta">Resuelta</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleReview}
                  disabled={isReviewing}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isReviewing ? 'Revisando...' : 'Revisar Alerta'}
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alert.notas_tutor && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Notas del tutor:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {alert.notas_tutor}
                  </p>
                </div>
              )}
              
              {alert.accion_tomada && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Acción tomada:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {alert.accion_tomada}
                  </p>
                </div>
              )}
    </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
} 