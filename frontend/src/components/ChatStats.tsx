import React from 'react';
import { FaClock, FaComments, FaUserTie, FaChartLine, FaHeart, FaBrain } from 'react-icons/fa';

interface ChatStatsProps {
  stats: {
    totalMessages: number;
    userMessages: number;
    tutorMessages: number;
    sessionDuration: string;
    lastActivity: string;
    averageResponseTime?: string;
    emotionalTrend?: string;
    engagementScore?: number;
  };
  visible: boolean;
  onClose: () => void;
}

const ChatStats: React.FC<ChatStatsProps> = ({ stats, visible, onClose }) => {
  if (!visible) return null;

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEmotionalTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <FaHeart className="text-green-500" />;
      case 'neutral':
        return <FaBrain className="text-blue-500" />;
      case 'negative':
        return <FaHeart className="text-red-500" />;
      default:
        return <FaBrain className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-2xl text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Estadísticas del Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mensajes */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <FaComments className="text-2xl text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Mensajes</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tus mensajes</span>
                  <span className="text-lg font-semibold text-gray-800">{stats.userMessages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Respuestas tutor</span>
                  <span className="text-lg font-semibold text-gray-800">{stats.tutorMessages}</span>
                </div>
              </div>
            </div>

            {/* Tiempo */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <FaClock className="text-2xl text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Tiempo</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duración sesión</span>
                  <span className="text-lg font-semibold text-green-600">{stats.sessionDuration}</span>
                </div>
                {stats.averageResponseTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tiempo respuesta</span>
                    <span className="text-lg font-semibold text-gray-800">{stats.averageResponseTime}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última actividad</span>
                  <span className="text-sm text-gray-600">
                    {new Date(stats.lastActivity).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Análisis Emocional */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <FaBrain className="text-2xl text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">Análisis Emocional</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tendencia</span>
                  <div className="flex items-center gap-2">
                    {getEmotionalTrendIcon(stats.emotionalTrend || 'neutral')}
                    <span className="text-lg font-semibold text-gray-800 capitalize">
                      {stats.emotionalTrend || 'neutral'}
                    </span>
                  </div>
                </div>
                {stats.engagementScore && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Engagement</span>
                    <span className={`text-lg font-semibold ${getEngagementColor(stats.engagementScore)}`}>
                      {stats.engagementScore}%
                    </span>
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.engagementScore || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <FaUserTie className="text-2xl text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-800">Resumen</h3>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>• Sesión activa y productiva</p>
                  <p>• Comunicación fluida</p>
                  <p>• Respuestas oportunas</p>
                  {stats.engagementScore && stats.engagementScore >= 80 && (
                    <p>• Excelente nivel de engagement</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="mt-6 bg-gray-50 p-4 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-3">Recomendaciones</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {stats.userMessages < 5 && (
                <p>💡 Intenta ser más participativo para aprovechar mejor la sesión</p>
              )}
              {stats.engagementScore && stats.engagementScore < 60 && (
                <p>💡 Considera hacer preguntas más específicas para mejorar el engagement</p>
              )}
              {stats.averageResponseTime && parseInt(stats.averageResponseTime) > 5 && (
                <p>⏱️ Las respuestas del tutor pueden tardar un poco, ten paciencia</p>
              )}
              <p>✅ Continúa con la buena comunicación que has establecido</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatStats; 