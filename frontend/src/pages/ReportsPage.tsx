import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { analysisService, chatService } from '../services/api';
import Header from '../components/layout/Header';
import { 
  FaFileAlt, 
  FaChartLine, 
  FaCalendar, 
  FaDownload, 
  FaEye,
  FaFilter,
  FaChartBar,
  FaChartPie
} from 'react-icons/fa';

interface AnalysisHistory {
  id: number;
  emotion: string;
  emotion_score: number;
  style: string;
  style_score: number;
  priority: string;
  alert: boolean;
  created_at: string;
  message_text: string;
}

interface DeepAnalysis {
  total_messages: number;
  average_emotion_score: number;
  average_style_score: number;
  emotion_trend: Array<{ date: string; emotion: string; score: number }>;
  style_trend: Array<{ date: string; style: string; score: number }>;
  risk_assessment: {
    high_risk_messages: number;
    medium_risk_messages: number;
    low_risk_messages: number;
  };
  recommendations: string[];
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'alerts' | 'high-priority'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadReports();
  }, [user, navigate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Cargar historial de análisis
      const history = await analysisService.getAnalysisHistory(50);
      setAnalysisHistory(history.history);
      
      // Cargar análisis profundo
      const deep = await analysisService.getDeepAnalysis();
      setDeepAnalysis(deep);
    } catch (error) {
      console.error('Error loading reports:', error);
      setAnalysisHistory([]);
      setDeepAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'tristeza':
        return 'text-blue-600';
      case 'alegría':
        return 'text-yellow-600';
      case 'ansiedad':
        return 'text-red-600';
      case 'frustración':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = analysisHistory.filter(item => {
    if (filter === 'alerts') {
      return item.alert;
    }
    if (filter === 'high-priority') {
      return item.priority === 'alta';
    }
    return true;
  });

  const exportReport = () => {
    const reportData = {
      user: user?.nombre,
      date: new Date().toISOString(),
      totalAnalyses: analysisHistory.length,
      deepAnalysis,
      filteredHistory
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-psichat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <Header 
        title="Reportes y Análisis" 
        subtitle="Estadísticas detalladas y reportes de actividad"
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Filtros y controles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('alerts')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'alerts' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Con alertas
                </button>
                <button
                  onClick={() => setFilter('high-priority')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'high-priority' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alta prioridad
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="all">Todo el tiempo</option>
              </select>
              
              <button
                onClick={exportReport}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FaDownload />
                Exportar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Análisis profundo */}
        {deepAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaChartBar className="text-blue-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Total Mensajes</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{deepAnalysis.total_messages}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaChartPie className="text-green-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Emoción Promedio</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {deepAnalysis.average_emotion_score.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaChartLine className="text-purple-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Estilo Promedio</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {deepAnalysis.average_style_score.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaChartBar className="text-red-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Alto Riesgo</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">
                {deepAnalysis.risk_assessment.high_risk_messages}
              </p>
            </div>
          </motion.div>
        )}

        {/* Recomendaciones */}
        {deepAnalysis?.recommendations && deepAnalysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaChartLine className="text-indigo-500" />
              Recomendaciones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deepAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-indigo-800">{rec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Historial de análisis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaFileAlt className="text-indigo-500" />
              Historial de Análisis ({filteredHistory.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando reportes...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <FaChartLine className="text-indigo-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Análisis #{item.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.alert && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Alerta
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getPriorityColor(item.priority)
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-gray-700 text-sm">
                      "{item.message_text.substring(0, 100)}..."
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Emoción:</span>
                      <p className={`font-medium ${getEmotionColor(item.emotion)}`}>
                        {item.emotion} ({item.emotion_score.toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estilo:</span>
                      <p className="font-medium text-gray-900">
                        {item.style} ({item.style_score.toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Prioridad:</span>
                      <p className="font-medium text-gray-900">{item.priority}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Alerta:</span>
                      <p className="font-medium text-gray-900">
                        {item.alert ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaFileAlt className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No hay análisis disponibles para mostrar.'
                  : filter === 'alerts'
                  ? 'No hay análisis con alertas.'
                  : 'No hay análisis de alta prioridad.'
                }
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ReportsPage; 