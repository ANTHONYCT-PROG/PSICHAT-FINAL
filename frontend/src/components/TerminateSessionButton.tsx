import React, { useState } from 'react';
import { FaStop, FaFileAlt, FaTimes } from 'react-icons/fa';
import { reportesService } from '../services/reportes';
import toast from 'react-hot-toast';

interface TerminateSessionButtonProps {
  sessionId: number;
  sessionStatus: string;
  onSessionTerminated?: () => void;
  className?: string;
}

export default function TerminateSessionButton({ 
  sessionId, 
  sessionStatus, 
  onSessionTerminated,
  className = ""
}: TerminateSessionButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [terminateNotes, setTerminateNotes] = useState('');
  const [terminateReason, setTerminateReason] = useState('');

  const handleTerminateSession = async () => {
    if (!terminateReason) {
      toast.error('Por favor selecciona un motivo de finalización');
      return;
    }

    try {
      setTerminating(true);
      
      const response = await fetch(`/api/reportes/generar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sesion_id: sessionId,
          notas_tutor: terminateNotes,
          motivo_finalizacion: terminateReason
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Sesión terminada exitosamente. Se ha generado un reporte automático.');
        setShowModal(false);
        setTerminateNotes('');
        setTerminateReason('');
        onSessionTerminated?.();
      } else {
        const errorData = await response.json();
        toast.error(`Error al terminar la sesión: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error terminating session:', err);
      toast.error('Error al terminar la sesión');
    } finally {
      setTerminating(false);
    }
  };

  // Solo mostrar el botón si la sesión está activa
  if (sessionStatus !== 'activa') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`}
        title="Terminar sesión y generar reporte"
      >
        <FaStop />
      </button>

      {/* Modal de terminar sesión */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaFileAlt className="mr-2 text-red-600" />
                Terminar Sesión
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Al terminar la sesión se generará automáticamente un reporte usando Gemini con el análisis completo de la conversación.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de finalización *
                </label>
                <select
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar motivo...</option>
                  <option value="Sesión completada exitosamente">Sesión completada exitosamente</option>
                  <option value="Estudiante solicitó finalizar">Estudiante solicitó finalizar</option>
                  <option value="Problema técnico">Problema técnico</option>
                  <option value="Intervención requerida">Intervención requerida</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={terminateNotes}
                  onChange={(e) => setTerminateNotes(e.target.value)}
                  placeholder="Observaciones adicionales para el reporte..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={terminating}
              >
                Cancelar
              </button>
              <button
                onClick={handleTerminateSession}
                disabled={terminating || !terminateReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {terminating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando reporte...
                  </>
                ) : (
                  <>
                    <FaStop className="mr-2" />
                    Terminar y Generar Reporte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 