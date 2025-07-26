import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBrain, 
  FaHeart, 
  FaComments, 
  FaShieldAlt, 
  FaArrowUp, 
  FaArrowDown,
  FaSmile,
  FaFrown,
  FaMeh,
  FaAngry,
  FaLightbulb,
  FaInfoCircle,
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaUserGraduate
} from 'react-icons/fa';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { analysisService } from '../../services/api';

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

const AdvancedAnalytics: React.FC = () => {
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [deepAnalysisData, historyData] = await Promise.all([
        analysisService.getDeepAnalysis(),
        analysisService.getAnalysisHistory(30)
      ]);
      
      setDeepAnalysis(deepAnalysisData);
      setAnalysisHistory(historyData.history);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'alegría':
      case 'felicidad':
        return <FaSmile className="text-yellow-500" />;
      case 'tristeza':
      case 'desánimo':
        return <FaFrown className="text-blue-500" />;
      case 'ansiedad':
      case 'preocupación':
        return <FaMeh className="text-orange-500" />;
      case 'frustración':
      case 'ira':
        return <FaAngry className="text-red-500" />;
      default:
        return <FaMeh className="text-gray-500" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'alegría':
      case 'felicidad':
        return '#fbbf24';
      case 'tristeza':
      case 'desánimo':
        return '#3b82f6';
      case 'ansiedad':
      case 'preocupación':
        return '#f97316';
      case 'frustración':
      case 'ira':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta':
      case 'crítica':
        return '#ef4444';
      case 'media':
        return '#f59e0b';
      case 'baja':
      case 'normal':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  // Datos para gráficos
  const emotionDistributionData = analysisHistory.reduce((acc, item) => {
    const emotion = item.emotion;
    const existing = acc.find(d => d.name === emotion);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: emotion, value: 1, color: getEmotionColor(emotion) });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; color: string }>);

  const evolutionData = analysisHistory.slice(-10).map((item, index) => ({
    name: `M${index + 1}`,
    emotion: item.emotion_score,
    style: item.style_score,
    date: formatDate(item.created_at)
  }));

  const riskData = [
    { name: 'Alto Riesgo', value: deepAnalysis?.risk_assessment?.high_risk_messages || 0, color: '#ef4444' },
    { name: 'Medio Riesgo', value: deepAnalysis?.risk_assessment?.medium_risk_messages || 0, color: '#f59e0b' },
    { name: 'Bajo Riesgo', value: deepAnalysis?.risk_assessment?.low_risk_messages || 0, color: '#22c55e' }
  ];

  const weeklyTrendData = analysisHistory.slice(-7).map((item, index) => ({
    day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index] || `D${index + 1}`,
    emotion: item.emotion_score,
    style: item.style_score
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaBrain className="text-indigo-500" />
            Análisis Avanzado
          </h2>
          <p className="text-gray-600 mt-1">
            Visualizaciones detalladas de tu bienestar emocional y patrones comunicativos
          </p>
        </div>
        
        <div className="flex gap-2">
          {['week', 'month', 'all'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe === 'week' ? 'Semana' : timeframe === 'month' ? 'Mes' : 'Total'}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emoción Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {deepAnalysis?.average_emotion_score.toFixed(1)}%
              </p>
            </div>
            <FaBrain className="text-indigo-500 text-2xl" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            {deepAnalysis?.average_emotion_score > 60 ? (
              <FaArrowUp className="text-green-500 mr-1" />
            ) : (
              <FaArrowDown className="text-red-500 mr-1" />
            )}
            <span className={deepAnalysis?.average_emotion_score > 60 ? 'text-green-600' : 'text-red-600'}>
              {deepAnalysis?.average_emotion_score > 60 ? 'Positivo' : 'Requiere atención'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estilo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {deepAnalysis?.average_style_score.toFixed(1)}%
              </p>
            </div>
            <FaComments className="text-blue-500 text-2xl" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaUserGraduate className="text-blue-500 mr-1" />
            <span className="text-blue-600">Comunicativo</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
              <p className="text-2xl font-bold text-gray-900">
                {deepAnalysis?.total_messages || 0}
              </p>
            </div>
            <FaChartBar className="text-green-500 text-2xl" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaCalendarAlt className="text-green-500 mr-1" />
            <span className="text-green-600">Analizados</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alto Riesgo</p>
              <p className="text-2xl font-bold text-gray-900">
                {deepAnalysis?.risk_assessment?.high_risk_messages || 0}
              </p>
            </div>
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <FaShieldAlt className="text-red-500 mr-1" />
            <span className="text-red-600">Requieren atención</span>
          </div>
        </motion.div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de evolución temporal */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaChartLine className="text-indigo-500" />
              Evolución Temporal
            </h3>
            <FaInfoCircle className="text-gray-400 cursor-help" title="Muestra cómo han cambiado tus emociones y estilos a lo largo del tiempo" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="emotion" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Emoción" />
              <Area type="monotone" dataKey="style" stackId="2" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} name="Estilo" />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de distribución de emociones */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaChartPie className="text-blue-500" />
              Distribución de Emociones
            </h3>
            <FaInfoCircle className="text-gray-400 cursor-help" title="Muestra qué emociones has experimentado más frecuentemente" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emotionDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {emotionDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Gráficos secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencia semanal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaChartLine className="text-green-500" />
              Tendencia Semanal
            </h3>
            <FaInfoCircle className="text-gray-400 cursor-help" title="Evolución de tu estado emocional durante la semana" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="emotion" stroke="#6366f1" strokeWidth={2} name="Emoción" />
              <Line type="monotone" dataKey="style" stroke="#0ea5e9" strokeWidth={2} name="Estilo" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de evaluación de riesgo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-500" />
              Evaluación de Riesgo
            </h3>
            <FaInfoCircle className="text-gray-400 cursor-help" title="Clasificación de tus mensajes según el nivel de riesgo emocional" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recomendaciones y insights */}
      {deepAnalysis?.recommendations && deepAnalysis.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              Recomendaciones Personalizadas
            </h3>
            <FaInfoCircle className="text-gray-400 cursor-help" title="Sugerencias personalizadas basadas en tu análisis emocional" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deepAnalysis.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border-l-4 border-indigo-500"
              >
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-indigo-500 mt-1 flex-shrink-0" />
                  <p className="text-indigo-800 font-medium">{rec}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resumen de insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaBrain className="text-2xl" />
          <h3 className="text-xl font-semibold">Resumen de Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {deepAnalysis?.average_emotion_score > 60 ? '😊' : deepAnalysis?.average_emotion_score > 40 ? '😐' : '😔'}
            </div>
            <p className="text-sm opacity-90">
              {deepAnalysis?.average_emotion_score > 60 
                ? 'Estado emocional positivo' 
                : deepAnalysis?.average_emotion_score > 40 
                ? 'Estado emocional neutral' 
                : 'Estado emocional requiere atención'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {deepAnalysis?.risk_assessment?.high_risk_messages > 0 ? '⚠️' : '✅'}
            </div>
            <p className="text-sm opacity-90">
              {deepAnalysis?.risk_assessment?.high_risk_messages > 0 
                ? `${deepAnalysis.risk_assessment.high_risk_messages} mensajes de alto riesgo` 
                : 'Sin alertas críticas'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {deepAnalysis?.total_messages > 20 ? '📈' : '📊'}
            </div>
            <p className="text-sm opacity-90">
              {deepAnalysis?.total_messages > 20 
                ? 'Buen historial de datos' 
                : 'Construyendo historial'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedAnalytics; 