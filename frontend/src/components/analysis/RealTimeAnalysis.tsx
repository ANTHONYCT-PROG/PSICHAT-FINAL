import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBrain, 
  FaHeart, 
  FaComments, 
  FaChartLine, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaEye
} from 'react-icons/fa';
import { websocketService } from '../../services/websocket';
import { useAuthStore } from '../../stores/authStore';

interface AnalysisData {
  emotion: string;
  emotion_score: number;
  style: string;
  style_score: number;
  timestamp: Date;
  priority: 'baja' | 'media' | 'alta' | 'crítica';
  risk_level: number;
  insights: string[];
}

interface RealTimeAnalysisProps {
  className?: string;
  showHistory?: boolean;
  maxHistoryItems?: number;
}

export default function RealTimeAnalysis({ 
  className = '', 
  showHistory = true, 
  maxHistoryItems = 10 
}: RealTimeAnalysisProps) {
  const { user } = useAuthStore();
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const handleAnalysisResponse = (data: any) => {
      const analysis: AnalysisData = {
        emotion: data.analysis?.emotion || 'Neutral',
        emotion_score: data.analysis?.emotion_score || 0,
        style: data.analysis?.style || 'Formal',
        style_score: data.analysis?.style_score || 0,
        timestamp: new Date(),
        priority: data.analysis?.priority || 'baja',
        risk_level: data.analysis?.risk_level || 0,
        insights: data.analysis?.insights || []
      };

      setCurrentAnalysis(analysis);
      setIsAnalyzing(false);

      if (showHistory) {
        setAnalysisHistory(prev => [analysis, ...prev.slice(0, maxHistoryItems - 1)]);
      }
    };

    const handleAnalysisStart = (data: any) => {
      setIsAnalyzing(true);
    };

    const handleConnectionChange = (data: any) => {
      setConnectionStatus('connected');
    };

    const handleDisconnection = (data: any) => {
      setConnectionStatus('disconnected');
    };

    // Setup WebSocket listeners
    websocketService.on('analysis_response', handleAnalysisResponse);
    websocketService.on('analysis_start', handleAnalysisStart);
    websocketService.on('connected', handleConnectionChange);
    websocketService.on('disconnected', handleDisconnection);

    return () => {
      websocketService.off('analysis_response', handleAnalysisResponse);
      websocketService.off('analysis_start', handleAnalysisStart);
      websocketService.off('connected', handleConnectionChange);
      websocketService.off('disconnected', handleDisconnection);
    };
  }, [showHistory, maxHistoryItems]);

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'alegría':
      case 'felicidad':
      case 'positivo':
        return 'text-green-600 bg-green-100';
      case 'tristeza':
      case 'negativo':
        return 'text-blue-600 bg-blue-100';
      case 'ira':
      case 'enojo':
        return 'text-red-600 bg-red-100';
      case 'miedo':
      case 'ansiedad':
        return 'text-purple-600 bg-purple-100';
      case 'sorpresa':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'crítica':
        return <FaExclamationTriangle size={16} />;
      case 'alta':
        return <FaExclamationTriangle size={14} />;
      case 'media':
        return <FaClock size={14} />;
      case 'baja':
        return <FaCheckCircle size={14} />;
      default:
        return <FaCheckCircle size={14} />;
    }
  };

  const getRiskLevelColor = (risk: number) => {
    if (risk >= 0.8) return 'text-red-600';
    if (risk >= 0.6) return 'text-orange-600';
    if (risk >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevelText = (risk: number) => {
    if (risk >= 0.8) return 'Alto';
    if (risk >= 0.6) return 'Medio-Alto';
    if (risk >= 0.4) return 'Medio';
    return 'Bajo';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FaBrain className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Análisis en Tiempo Real</h3>
              <p className="text-sm text-gray-600">Monitoreo emocional y de estilo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500">
              {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Analysis */}
      <div className="p-6">
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center gap-3">
              <FaBrain className="animate-spin text-indigo-500" size={20} />
              <span className="text-gray-600">Analizando mensaje...</span>
            </div>
          </motion.div>
        )}

        {currentAnalysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Priority Alert */}
            <div className={`p-4 rounded-lg border ${getPriorityColor(currentAnalysis.priority)}`}>
              <div className="flex items-center gap-2">
                {getPriorityIcon(currentAnalysis.priority)}
                <span className="font-semibold">
                  Prioridad: {currentAnalysis.priority.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Emotion and Style Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emotion */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaHeart className="text-red-500" size={16} />
                  <h4 className="font-semibold text-gray-900">Emoción Detectada</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(currentAnalysis.emotion)}`}>
                      {currentAnalysis.emotion}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {Math.round(currentAnalysis.emotion_score)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentAnalysis.emotion_score}%` }}
                      className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Style */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaComments className="text-blue-500" size={16} />
                  <h4 className="font-semibold text-gray-900">Estilo de Comunicación</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
                      {currentAnalysis.style}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {Math.round(currentAnalysis.style_score)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentAnalysis.style_score}%` }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaChartLine className="text-purple-500" size={16} />
                <h4 className="font-semibold text-gray-900">Nivel de Riesgo</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${getRiskLevelColor(currentAnalysis.risk_level)}`}>
                  {getRiskLevelText(currentAnalysis.risk_level)}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(currentAnalysis.risk_level)}% de riesgo
                </span>
              </div>
            </div>

            {/* Insights */}
            {currentAnalysis.insights.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-2">Insights</h4>
                <ul className="space-y-1">
                  {currentAnalysis.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-indigo-700 flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Último análisis: {currentAnalysis.timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        )}

        {!currentAnalysis && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            <FaBrain size={32} className="mx-auto mb-3 text-gray-300" />
            <p>Esperando mensajes para analizar...</p>
          </div>
        )}
      </div>

      {/* Analysis History */}
      {showHistory && analysisHistory.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-4 bg-gray-50">
            <h4 className="font-semibold text-gray-900">Historial de Análisis</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <AnimatePresence>
              {analysisHistory.map((analysis, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEmotionColor(analysis.emotion)}`}>
                        {analysis.emotion}
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(analysis.priority)}`}>
                      {analysis.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                                    <span>Emoción: {Math.round(analysis.emotion_score)}%</span>
                <span>Estilo: {Math.round(analysis.style_score)}%</span>
                <span>Riesgo: {Math.round(analysis.risk_level)}%</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
} 