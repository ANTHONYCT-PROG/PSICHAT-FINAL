import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaLightbulb,
  FaChartBar,
  FaUser,
  FaClock,
  FaShieldAlt,
  FaHeart,
  FaComments,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Doughnut, Radar, Line } from 'react-chartjs-2';
import { useAuthStore } from '../stores/authStore';
import { analysisService } from '../services/api';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface AnalysisData {
  emotion: string;
  emotion_score: number;
  style: string;
  style_score: number;
  priority: string;
  alert: boolean;
  alert_reason?: string;
  emotion_distribution: [string, number][];
  style_distribution: [string, number][];
  recommendations: {
    immediate_actions: string[];
    emotional_support: string[];
    communication_tips: string[];
    long_term_suggestions: string[];
  };
  summary: {
    executive: string;
    technical: string;
    user_friendly: string;
  };
  detailed_insights: {
    emotional_state: string;
    communication_style: string;
    risk_assessment: string;
    alert_status: string;
  };
  message_text: string;
  analysis_date: string;
}

const LastAnalysisPage: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const navigate = useNavigate();
  
  // Obtener token y usuario del store de autenticación
  const { token, user } = useAuthStore();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!token || !user) {
      setError('Debes iniciar sesión para ver el análisis');
      setLoading(false);
      return;
    }
    
    fetchLastAnalysis();
  }, [token, user]);

  const fetchLastAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio de análisis con autenticación automática
      const data = await analysisService.getLastAnalysis();
      
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Error fetching last analysis:', err);
      
      if (err.response?.status === 404) {
        setError('No se encontraron análisis previos. Envía un mensaje en el chat para generar un análisis.');
      } else if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        // Redirigir al login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para acceder a este análisis.');
      } else {
        setError('Error al cargar el análisis del último mensaje. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'crítica': return 'text-red-600 bg-red-50 border-red-200';
      case 'alta': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'media': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'baja': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'crítica': return <FaExclamationTriangle className="text-red-500" />;
      case 'alta': return <FaExclamationTriangle className="text-orange-500" />;
      case 'media': return <FaInfoCircle className="text-yellow-500" />;
      case 'baja': return <FaInfoCircle className="text-blue-500" />;
      default: return <FaCheckCircle className="text-green-500" />;
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'alegría': return <FaHeart className="text-green-500" />;
      case 'tristeza': return <FaHeart className="text-blue-500" />;
      case 'frustración': return <FaExclamationTriangle className="text-orange-500" />;
      case 'ansiedad': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'desánimo': return <FaHeart className="text-gray-500" />;
      default: return <FaUser className="text-gray-500" />;
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style.toLowerCase()) {
      case 'formal': return <FaShieldAlt className="text-blue-500" />;
      case 'informal': return <FaComments className="text-green-500" />;
      case 'evasivo': return <FaComments className="text-yellow-500" />;
      case 'agresivo': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaComments className="text-gray-500" />;
    }
  };

  const prepareChartData = () => {
    if (!analysisData) return null;

    // Verificar si las distribuciones existen y tienen datos
    if (!analysisData.emotion_distribution || analysisData.emotion_distribution.length === 0) {
      return null;
    }

    if (!analysisData.style_distribution || analysisData.style_distribution.length === 0) {
      return null;
    }

    // Datos para gráfico de dona de emociones
    const emotionData = {
      labels: analysisData.emotion_distribution.map(([emotion]) => emotion),
      datasets: [{
        data: analysisData.emotion_distribution.map(([, score]) => score),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Datos para gráfico de dona de estilos
    const styleData = {
      labels: analysisData.style_distribution.map(([style]) => style),
      datasets: [{
        data: analysisData.style_distribution.map(([, score]) => score),
        backgroundColor: [
          '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    // Datos para gráfico de radar (emociones vs estilos)
    const radarData = {
      labels: ['Alegría', 'Tristeza', 'Frustración', 'Ansiedad', 'Formal', 'Informal', 'Evasivo', 'Agresivo'],
      datasets: [{
        label: 'Distribución',
        data: [
          analysisData.emotion_distribution.find(([e]) => e === 'alegría')?.[1] || 0,
          analysisData.emotion_distribution.find(([e]) => e === 'tristeza')?.[1] || 0,
          analysisData.emotion_distribution.find(([e]) => e === 'frustración')?.[1] || 0,
          analysisData.emotion_distribution.find(([e]) => e === 'ansiedad')?.[1] || 0,
          analysisData.style_distribution.find(([s]) => s === 'formal')?.[1] || 0,
          analysisData.style_distribution.find(([s]) => s === 'informal')?.[1] || 0,
          analysisData.style_distribution.find(([s]) => s === 'evasivo')?.[1] || 0,
          analysisData.style_distribution.find(([s]) => s === 'agresivo')?.[1] || 0,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }]
    };

    return { emotionData, styleData, radarData };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center">
              <FaExclamationTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Error al cargar el análisis</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Volver al Dashboard
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ir al Chat
                </button>
                {error.includes('sesión') && (
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const chartData = prepareChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FaArrowLeft />
              <span>Volver al Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Análisis del Último Mensaje</h1>
            <div className="w-24"></div>
          </div>
          
          {/* Fecha del análisis */}
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <FaClock />
            <span>Análisis realizado el {new Date(analysisData.analysis_date).toLocaleString('es-ES')}</span>
          </div>
        </motion.div>

        {/* Mensaje analizado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaComments className="mr-2 text-blue-500" />
            Mensaje Analizado
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-gray-700 italic">"{analysisData.message_text}"</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel Izquierdo - Análisis Principal */}
          <div className="space-y-8">
            {/* Estado Emocional */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                {getEmotionIcon(analysisData.emotion)}
                <span className="ml-2">Estado Emocional</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Emoción Dominante:</span>
                  <span className="font-semibold text-lg capitalize">{analysisData.emotion}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Intensidad</span>
                    <span>{analysisData.emotion_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysisData.emotion_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Distribución Completa:</h4>
                  <div className="space-y-2">
                    {analysisData.emotion_distribution.map(([emotion, score], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{emotion}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{score.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Estilo de Comunicación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                {getStyleIcon(analysisData.style)}
                <span className="ml-2">Estilo de Comunicación</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estilo Dominante:</span>
                  <span className="font-semibold text-lg capitalize">{analysisData.style}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Confianza</span>
                    <span>{analysisData.style_score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysisData.style_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Distribución Completa:</h4>
                  <div className="space-y-2">
                    {analysisData.style_distribution.map(([style, score], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{style}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-8">{score.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Evaluación de Riesgo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaShieldAlt className="text-purple-500" />
                <span className="ml-2">Evaluación de Riesgo</span>
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-2 ${getPriorityColor(analysisData.priority)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Nivel de Prioridad:</span>
                    {getPriorityIcon(analysisData.priority)}
                  </div>
                  <span className="text-lg font-bold capitalize">{analysisData.priority}</span>
                </div>

                {analysisData.alert && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaExclamationTriangle className="text-red-500 mr-2" />
                      <span className="font-semibold text-red-700">Alerta Detectada</span>
                    </div>
                    <p className="text-red-600 text-sm">{analysisData.alert_reason}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`font-semibold ${analysisData.alert ? 'text-red-600' : 'text-green-600'}`}>
                      {analysisData.alert ? 'Requiere Atención' : 'Normal'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Panel Derecho - Gráficos y Visualizaciones */}
          <div className="space-y-8">
            {/* Gráfico de Radar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaChartBar className="text-blue-500" />
                <span className="ml-2">Análisis Multidimensional</span>
              </h3>
              {chartData && (
                <div className="h-80">
                  <Radar 
                    data={chartData.radarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            stepSize: 20
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
              )}
            </motion.div>

            {/* Gráficos de Distribución */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Distribución de Emociones */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Emociones</h4>
                {chartData && (
                  <div className="h-48">
                    <Doughnut 
                      data={chartData.emotionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 12,
                              font: {
                                size: 10
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Distribución de Estilos */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Estilos</h4>
                {chartData && (
                  <div className="h-48">
                    <Doughnut 
                      data={chartData.styleData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 12,
                              font: {
                                size: 10
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sección de Recomendaciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <FaLightbulb className="text-yellow-500" />
            <span className="ml-2">Recomendaciones Personalizadas</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Acciones Inmediatas */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <FaArrowUp className="text-red-500 mr-2" />
                Acciones Inmediatas
              </h4>
              <ul className="space-y-2">
                {analysisData.recommendations.immediate_actions.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="text-gray-700 text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Apoyo Emocional */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <FaHeart className="text-pink-500 mr-2" />
                Apoyo Emocional
              </h4>
              <ul className="space-y-2">
                {analysisData.recommendations.emotional_support.map((support, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="text-gray-700 text-sm">{support}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips de Comunicación */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <FaComments className="text-blue-500 mr-2" />
                Tips de Comunicación
              </h4>
              <ul className="space-y-2">
                {analysisData.recommendations.communication_tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sugerencias a Largo Plazo */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <FaArrowDown className="text-green-500 mr-2" />
                Sugerencias a Largo Plazo
              </h4>
              <ul className="space-y-2">
                {analysisData.recommendations.long_term_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-700 text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Resumen Ejecutivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaInfoCircle className="text-indigo-500" />
              <span className="ml-2">Resumen Ejecutivo</span>
            </h3>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              {showTechnicalDetails ? <FaEyeSlash /> : <FaEye />}
              <span>{showTechnicalDetails ? 'Ocultar' : 'Mostrar'} Detalles Técnicos</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Resumen Ejecutivo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Resumen Ejecutivo</h4>
              <p className="text-blue-700">{analysisData.summary.executive}</p>
            </div>

            {/* Resumen Amigable */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Resumen para el Usuario</h4>
              <p className="text-green-700">{analysisData.summary.user_friendly}</p>
            </div>

            {/* Detalles Técnicos */}
            {showTechnicalDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-semibold text-gray-800 mb-2">Resumen Técnico</h4>
                <p className="text-gray-700 text-sm">{analysisData.summary.technical}</p>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Estado Emocional</h5>
                    <p className="text-gray-600 text-sm">{analysisData.detailed_insights.emotional_state}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Estilo de Comunicación</h5>
                    <p className="text-gray-600 text-sm">{analysisData.detailed_insights.communication_style}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Evaluación de Riesgo</h5>
                    <p className="text-gray-600 text-sm">{analysisData.detailed_insights.risk_assessment}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Estado de Alerta</h5>
                    <p className="text-gray-600 text-sm">{analysisData.detailed_insights.alert_status}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Botones de Acción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/analysis')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Ver Análisis Completo (Últimos 10 Mensajes)
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Continuar Chat
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Volver al Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LastAnalysisPage; 