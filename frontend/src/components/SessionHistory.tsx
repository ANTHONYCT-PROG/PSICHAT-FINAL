import React from 'react';
import { FaClock, FaUserTie, FaComments, FaCalendar } from 'react-icons/fa';

interface Session {
  id: number;
  tutor_nombre: string;
  tutor_email: string;
  iniciada_en: string;
  mensajes_count: number;
  estado: string;
}

interface SessionHistoryProps {
  sessions: Session[];
  currentSessionId: number;
  onSelectSession: (sessionId: number) => void;
  visible: boolean;
  onClose: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  visible,
  onClose
}) => {
  if (!visible) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa':
        return 'text-green-600 bg-green-100';
      case 'cerrada':
        return 'text-gray-600 bg-gray-100';
      case 'pausada':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Historial de Sesiones</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <FaComments className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay sesiones anteriores</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    session.id === currentSessionId
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FaUserTie className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{session.tutor_nombre}</h3>
                        <p className="text-sm text-gray-600">{session.tutor_email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.estado)}`}>
                      {session.estado}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <FaCalendar className="text-xs" />
                        <span>{formatDate(session.iniciada_en)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaComments className="text-xs" />
                        <span>{session.mensajes_count} mensajes</span>
                      </div>
                    </div>
                    
                    {session.id === currentSessionId && (
                      <span className="text-emerald-600 font-medium">Sesión actual</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory; 