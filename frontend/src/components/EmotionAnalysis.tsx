import React from 'react';
import { FaHeart, FaBrain, FaChartBar } from 'react-icons/fa';

interface EmotionAnalysisProps {
  analysis: any;
  isVisible: boolean;
  onToggle: () => void;
}

const EmotionAnalysis: React.FC<EmotionAnalysisProps> = ({ analysis, isVisible, onToggle }) => {
  if (!analysis || Object.keys(analysis).length === 0) return null;

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      alegria: 'text-yellow-600 bg-yellow-100',
      tristeza: 'text-blue-600 bg-blue-100',
      enojo: 'text-red-600 bg-red-100',
      miedo: 'text-purple-600 bg-purple-100',
      sorpresa: 'text-orange-600 bg-orange-100',
      neutral: 'text-gray-600 bg-gray-100'
    };
    return colors[emotion] || colors.neutral;
  };

  const getStyleColor = (style: string) => {
    const colors: { [key: string]: string } = {
      formal: 'text-green-600 bg-green-100',
      informal: 'text-blue-600 bg-blue-100',
      agresivo: 'text-red-600 bg-red-100',
      pasivo: 'text-gray-600 bg-gray-100'
    };
    return colors[style] || colors.informal;
  };

  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <FaBrain className="text-xs" />
        {isVisible ? 'Ocultar análisis' : 'Ver análisis emocional'}
      </button>
      
      {isVisible && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Emoción */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaHeart className="text-red-500 text-xs" />
                <span className="text-xs font-medium text-gray-700">Emoción detectada</span>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(analysis.emotion)}`}>
                {analysis.emotion || 'Neutral'}
              </div>
              {analysis.emotion_score && (
                <div className="mt-1">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Confianza</span>
                    <span>{Math.round(analysis.emotion_score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.emotion_score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Estilo comunicativo */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaChartBar className="text-blue-500 text-xs" />
                <span className="text-xs font-medium text-gray-700">Estilo comunicativo</span>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStyleColor(analysis.style)}`}>
                {analysis.style || 'Informal'}
              </div>
              {analysis.style_score && (
                <div className="mt-1">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Confianza</span>
                    <span>{Math.round(analysis.style_score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.style_score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prioridad y alertas */}
          {(analysis.priority || analysis.alert) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              {analysis.priority && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">Prioridad:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    analysis.priority === 'alta' ? 'bg-red-100 text-red-700' :
                    analysis.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {analysis.priority}
                  </span>
                </div>
              )}
              
              {analysis.alert && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-red-600">⚠️ Alerta detectada</span>
                  {analysis.alert_reason && (
                    <span className="text-xs text-gray-600">({analysis.alert_reason})</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmotionAnalysis; 