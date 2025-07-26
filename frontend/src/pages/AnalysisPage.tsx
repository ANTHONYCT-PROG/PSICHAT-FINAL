import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { analysisService, chatService } from '../services/api';
import Header from '../components/layout/Header';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaBrain, 
  FaHeart, 
  FaComments,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaDownload,
  FaSync,
  FaSmile,
  FaFrown,
  FaMeh,
  FaAngry,
  FaLightbulb,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar as RechartsBar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler
);

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

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'details'>('overview');
  const reportRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAnalysisData();
  }, [user, navigate]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      
      // Cargar último análisis
      try {
        const lastAnalysisData = await analysisService.getLastAnalysis();
        setLastAnalysis(lastAnalysisData);
      } catch (error) {
        setLastAnalysis(null);
      }
      
      // Cargar análisis profundo
      try {
        const deepAnalysisData = await analysisService.getDeepAnalysis();
        setDeepAnalysis(deepAnalysisData);
      } catch (error) {
        setDeepAnalysis(null);
      }
      
      // Cargar historial de análisis
      try {
        const history = await analysisService.getAnalysisHistory(20);
        setAnalysisHistory(history.history);
      } catch (error) {
        setAnalysisHistory([]);
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
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

  // Función para obtener el icono de emoción
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
      case 'agresivo':
        return <FaAngry className="text-red-500" />;
      default:
        return <FaMeh className="text-gray-500" />;
    }
  };

  // Función para obtener el color de emoción
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

  // Función para calcular el progreso emocional basado en análisis de emociones
  const calculateEmotionalProgress = () => {
    if (!analysisHistory || analysisHistory.length === 0) return 0;
    
    // Si hay muy pocos mensajes, usar un cálculo más simple
    if (analysisHistory.length < 4) {
      const avgEmotion = analysisHistory.reduce((sum, msg) => sum + msg.emotion_score, 0) / analysisHistory.length;
      return Math.round(Math.min(100, Math.max(0, avgEmotion)));
    }
    
    // Dividir el historial en dos períodos para comparar
    const midPoint = Math.floor(analysisHistory.length / 2);
    const recentMessages = analysisHistory.slice(midPoint);
    const olderMessages = analysisHistory.slice(0, midPoint);
    
    if (olderMessages.length === 0) return 50; // Si no hay suficientes datos
    
    // Calcular puntuaciones promedio por período
    const recentAvgEmotion = recentMessages.reduce((sum, msg) => sum + msg.emotion_score, 0) / recentMessages.length;
    const olderAvgEmotion = olderMessages.reduce((sum, msg) => sum + msg.emotion_score, 0) / olderMessages.length;
    
    // Calcular mejora en emociones positivas (normalizada a 0-100)
    const emotionImprovement = Math.max(0, recentAvgEmotion - olderAvgEmotion);
    const normalizedEmotionImprovement = Math.min(100, emotionImprovement * 2); // Factor de escala
    
    // Analizar distribución de emociones
    const recentEmotions = recentMessages.map(msg => msg.emotion.toLowerCase());
    const olderEmotions = olderMessages.map(msg => msg.emotion.toLowerCase());
    
    // Contar emociones positivas vs negativas
    const positiveEmotions = ['alegría', 'felicidad', 'contento', 'tranquilo', 'optimista', 'satisfecho'];
    const negativeEmotions = ['tristeza', 'desánimo', 'ansiedad', 'preocupación', 'frustración', 'ira', 'agresivo', 'estresado'];
    
    const recentPositive = recentEmotions.filter(e => positiveEmotions.includes(e)).length;
    const recentNegative = recentEmotions.filter(e => negativeEmotions.includes(e)).length;
    const olderPositive = olderEmotions.filter(e => positiveEmotions.includes(e)).length;
    const olderNegative = olderEmotions.filter(e => negativeEmotions.includes(e)).length;
    
    // Calcular ratio de emociones positivas
    const recentPositiveRatio = recentPositive / (recentPositive + recentNegative) || 0;
    const olderPositiveRatio = olderPositive / (olderPositive + olderNegative) || 0;
    const positiveRatioImprovement = (recentPositiveRatio - olderPositiveRatio) * 100;
    
    // Calcular estabilidad emocional (menos fluctuaciones)
    const recentVariance = recentMessages.reduce((sum, msg) => {
      return sum + Math.pow(msg.emotion_score - recentAvgEmotion, 2);
    }, 0) / recentMessages.length;
    
    const olderVariance = olderMessages.reduce((sum, msg) => {
      return sum + Math.pow(msg.emotion_score - olderAvgEmotion, 2);
    }, 0) / olderMessages.length;
    
    // Normalizar la mejora de estabilidad (menor varianza = mejor estabilidad)
    const stabilityImprovement = Math.max(0, (olderVariance - recentVariance) / Math.max(olderVariance, 1)) * 100;
    
    // Calcular progreso final (0-100) con pesos ajustados
    const progress = Math.min(100, Math.max(0, 
      (normalizedEmotionImprovement * 0.4) + // 40% peso a mejora emocional
      (Math.max(0, positiveRatioImprovement) * 0.3) + // 30% peso a ratio de emociones positivas
      (stabilityImprovement * 0.3) // 30% peso a estabilidad
    ));
    
    return Math.round(progress);
  };

  // Datos para gráficos mejorados
  const emotionData = {
    labels: analysisHistory.slice(-10).map(item => formatDate(item.created_at)),
    datasets: [
      {
        label: 'Puntuación Emocional',
        data: analysisHistory.slice(-10).map(item => item.emotion_score),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const styleData = {
    labels: analysisHistory.slice(-10).map(item => formatDate(item.created_at)),
    datasets: [
      {
        label: 'Puntuación de Estilo',
        data: analysisHistory.slice(-10).map(item => item.style_score),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Datos para gráfico de distribución de emociones (Recharts)
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

  // Datos para gráfico de evolución temporal (Recharts)
  const evolutionData = analysisHistory.slice(-10).map((item, index) => ({
    name: `M${index + 1}`,
    emotion: item.emotion_score,
    style: item.style_score,
    date: formatDate(item.created_at)
  }));

  // Datos para gráfico de riesgo
  const riskData = [
    { name: 'Alto Riesgo', value: deepAnalysis?.risk_assessment?.high_risk_messages || 0, color: '#ef4444' },
    { name: 'Medio Riesgo', value: deepAnalysis?.risk_assessment?.medium_risk_messages || 0, color: '#f59e0b' },
    { name: 'Bajo Riesgo', value: deepAnalysis?.risk_assessment?.low_risk_messages || 0, color: '#22c55e' }
  ];

  const emotionDistribution = {
    labels: ['Tristeza', 'Alegría', 'Ansiedad', 'Frustración', 'Neutral'],
    datasets: [
      {
        data: [
          analysisHistory.filter(item => item.emotion === 'tristeza').length,
          analysisHistory.filter(item => item.emotion === 'alegría').length,
          analysisHistory.filter(item => item.emotion === 'ansiedad').length,
          analysisHistory.filter(item => item.emotion === 'frustración').length,
          analysisHistory.filter(item => item.emotion === 'neutral').length
        ],
        backgroundColor: [
          '#3b82f6',
          '#fbbf24',
          '#ef4444',
          '#f97316',
          '#6b7280'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const riskAssessment = {
    labels: ['Alto Riesgo', 'Medio Riesgo', 'Bajo Riesgo'],
    datasets: [
      {
        data: [
          deepAnalysis?.risk_assessment?.high_risk_messages || 0,
          deepAnalysis?.risk_assessment?.medium_risk_messages || 0,
          deepAnalysis?.risk_assessment?.low_risk_messages || 0
        ],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#22c55e'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const radarData = {
    labels: ['Emoción Positiva', 'Estilo Formal', 'Comunicación Clara', 'Estabilidad', 'Progreso'],
    datasets: [
      {
        label: 'Tu Perfil',
        data: [
          (deepAnalysis?.average_emotion_score || 0),
          (deepAnalysis?.average_style_score || 0),
          75, // Comunicación clara (ejemplo)
          80, // Estabilidad (ejemplo)
          calculateEmotionalProgress() // Progreso basado en análisis emocional
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Header title="Análisis Profundo" subtitle="Visualiza tu estado emocional y recibe recomendaciones inteligentes" />
      <main ref={reportRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tabs de navegación */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'overview' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500 border border-indigo-200 hover:bg-indigo-50'}`}>Resumen</button>
          <button onClick={() => setActiveTab('trends')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'trends' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500 border border-indigo-200 hover:bg-indigo-50'}`}>Tendencias</button>
          <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'details' ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500 border border-indigo-200 hover:bg-indigo-50'}`}>Detalles</button>
        </div>

        {/* Tarjetas de métricas principales */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emoción Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{deepAnalysis?.average_emotion_score?.toFixed(1) ?? '--'}%</p>
                </div>
                <FaBrain className="text-indigo-500 text-2xl" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estilo Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{deepAnalysis?.average_style_score?.toFixed(1) ?? '--'}%</p>
                </div>
                <FaHeart className="text-pink-500 text-2xl" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensajes de Alto Riesgo</p>
                  <p className="text-2xl font-bold text-gray-900">{deepAnalysis?.risk_assessment?.high_risk_messages ?? '--'}</p>
                </div>
                <FaExclamationTriangle className="text-red-500 text-2xl" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.03 }} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progreso Emocional</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateEmotionalProgress()}%</p>
                </div>
                <FaChartLine className="text-green-500 text-2xl" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Gráficos principales */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* SVG LineChart de emociones */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChartLine className="text-indigo-400" /> Emociones Recientes</h3>
              <EmotionSVGChart analysisHistory={analysisHistory} />
              {/* Distribución de emociones promedio */}
              <EmotionDistributionBar analysisHistory={analysisHistory} />
            </div>
            {/* SVG RadarChart de estilos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChartPie className="text-pink-400" /> Expresión de Estilos</h3>
              <StyleRadarSVGChart analysisHistory={analysisHistory} />
              {/* Distribución de estilos promedio */}
              <StyleDistributionBar analysisHistory={analysisHistory} />
            </div>
          </div>
        )}

        {/* Sección de recomendaciones */}
        {activeTab === 'overview' && deepAnalysis?.recommendations && (
          <div className="bg-gradient-to-r from-indigo-100 via-pink-100 to-green-100 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2"><FaLightbulb className="text-yellow-400" /> Recomendaciones Personalizadas</h3>
            <ul className="space-y-2">
              {deepAnalysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <FaCheckCircle className="text-green-500" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gráficos de tendencias y detalles */}
        {activeTab === 'trends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChartLine className="text-indigo-400" /> Tendencia de Emociones</h3>
              <Line data={emotionData} options={chartOptions} />
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChartLine className="text-pink-400" /> Tendencia de Estilos</h3>
              <Line data={styleData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Tabla de detalles */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FaInfoCircle className="text-indigo-400" /> Detalle de Mensajes Analizados</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emoción</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estilo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Riesgo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisHistory.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(msg.created_at)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{msg.message_text}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium" style={{ color: getEmotionColor(msg.emotion) }}>{msg.emotion}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{msg.style}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      {msg.priority === 'alta' ? <span className="text-red-500">Alto</span> : msg.priority === 'media' ? <span className="text-yellow-500">Medio</span> : <span className="text-green-500">Bajo</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Botón de descarga de reporte */}
        <div className="flex justify-end mt-8">
          <button
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition-all duration-200"
            onClick={async () => {
              if (!reportRef.current) return;
              const canvas = await html2canvas(reportRef.current, {backgroundColor:'#fff',scale:2});
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF({orientation:'portrait',unit:'pt',format:'a4'});
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();
              const imgWidth = pageWidth-40;
              const imgHeight = canvas.height * imgWidth / canvas.width;
              pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
              pdf.save('analisis_profundo.pdf');
            }}
          >
            <FaDownload />
            Descargar Reporte
          </button>
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTE SVG DE LÍNEAS DE EMOCIONES ---
function EmotionSVGChart({ analysisHistory }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState({emotion: null, idx: null, value: null, x: 0, y: 0});
  const last10 = analysisHistory.slice(-10);
  const allEmotions = Array.from(new Set(analysisHistory.map(m => m.emotion)));
  const colors = ['#6366f1','#f59e42','#ef4444','#10b981','#fbbf24','#3b82f6','#a21caf','#eab308','#f472b6','#22d3ee'];
  const width = 420, height = 220, padding = 40;
  const yScale = v => height - padding - (v/100)*(height-2*padding);
  const xStep = (width-2*padding)/(last10.length-1||1);
  const downloadSVG = () => {
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emociones.svg';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <svg ref={svgRef} width={width} height={height} style={{background:'#f8fafc',borderRadius:8}}>
        {/* Ejes */}
        <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#888" strokeWidth={1}/>
        <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#888" strokeWidth={1}/>
        {/* Líneas de emociones animadas */}
        {allEmotions.map((emotion, i) => {
          const points = last10.map((m, idx) => [padding+idx*xStep, yScale(m.emotion===emotion?m.emotion_score:0)]);
          const path = points.map((p, idx) => idx===0?`M${p[0]},${p[1]}`:`L${p[0]},${p[1]}`).join(' ');
          return <path key={emotion} d={path} fill="none" stroke={colors[i%colors.length]} strokeWidth={2} style={{transition:'stroke 0.3s', opacity: hover.emotion && hover.emotion!==emotion ? 0.3 : 1}} />;
        })}
        {/* Puntos interactivos */}
        {allEmotions.map((emotion, i) => last10.map((m, idx) => m.emotion===emotion ? (
          <circle key={emotion+idx} cx={padding+idx*xStep} cy={yScale(m.emotion_score)} r={hover.emotion===emotion&&hover.idx===idx?7:4} fill={colors[i%colors.length]}
            style={{cursor:'pointer',transition:'r 0.2s'}}
            onMouseEnter={e=>setHover({emotion,idx,value:m.emotion_score,x:e.nativeEvent.offsetX,y:e.nativeEvent.offsetY})}
            onMouseLeave={()=>setHover({emotion:null,idx:null,value:null,x:0,y:0})}
          />
        ) : null))}
        {/* Etiquetas de eje Y */}
        {[0,25,50,75,100].map(v => (
          <text key={v} x={padding-28} y={yScale(v)+4} fontSize={11} fill="#666">{v}%</text>
        ))}
        {/* Etiquetas de eje X */}
        {last10.map((m, idx) => (
          <text key={idx} x={padding+idx*xStep} y={height-padding+18} fontSize={11} fill="#666" textAnchor="middle">{`M${idx+1}`}</text>
        ))}
        {/* Tooltip animado */}
        {hover.emotion!==null && hover.idx!==null && (
          <g>
            <rect x={hover.x+10} y={hover.y-30} width="60" height="28" rx="6" fill="#fff" stroke="#6366f1" />
            <text x={hover.x+18} y={hover.y-14} fontSize={12} fill="#333">{hover.emotion}</text>
            <text x={hover.x+18} y={hover.y-2} fontSize={12} fill="#6366f1">{hover.value}%</text>
          </g>
        )}
      </svg>
      {/* Leyenda centrada debajo */}
      <div className="flex flex-wrap justify-center gap-4 mt-2 mb-2">
        {allEmotions.map((emotion, i) => (
          <div key={emotion} className="flex items-center gap-2">
            <span style={{width:16,height:4,background:colors[i%colors.length],display:'inline-block',borderRadius:2}}></span>
            <span className="text-xs text-gray-700 font-medium">{emotion}</span>
          </div>
        ))}
      </div>
      <button onClick={downloadSVG} className="mt-2 px-4 py-1 bg-indigo-500 text-white rounded shadow hover:bg-indigo-600">Descargar SVG</button>
    </div>
  );
}

// --- COMPONENTE SVG DE RADAR DE ESTILOS ---
function StyleRadarSVGChart({ analysisHistory }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState({idx:null,value:null,x:0,y:0});
  const styles = Array.from(new Set(analysisHistory.map(m => m.style)));
  const colors = ['#6366f1','#f59e42','#ef4444','#10b981','#fbbf24','#3b82f6','#a21caf','#eab308','#f472b6','#22d3ee'];
  const width = 320, height = 320, cx = width/2, cy = height/2, r = 110;
  const values = styles.map(style => {
    const msgs = analysisHistory.filter(m => m.style === style);
    return msgs.length ? (msgs.reduce((sum, m) => sum + m.style_score, 0) / msgs.length) : 0;
  });
  const points = values.map((v,i) => {
    const angle = (2*Math.PI*i)/styles.length;
    return [cx + Math.sin(angle)*r*v/100, cy - Math.cos(angle)*r*v/100];
  });
  const downloadSVG = () => {
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estilos.svg';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <svg ref={svgRef} width={width} height={height} style={{background:'#f8fafc',borderRadius:8}}>
        {/* Ejes y líneas */}
        {styles.map((_,i) => {
          const angle = (2*Math.PI*i)/styles.length;
          return <line key={i} x1={cx} y1={cy} x2={cx+Math.sin(angle)*r} y2={cy-Math.cos(angle)*r} stroke="#bbb" />;
        })}
        {/* Polígono de valores animado */}
        <polygon points={points.map(p=>p.join(",")).join(' ')} fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth={2} style={{transition:'all 0.4s'}} />
        {/* Puntos interactivos */}
        {points.map((p,i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={hover.idx===i?9:6} fill={colors[i%colors.length]} style={{cursor:'pointer',transition:'r 0.2s'}}
            onMouseEnter={e=>setHover({idx:i,value:values[i],x:e.nativeEvent.offsetX,y:e.nativeEvent.offsetY})}
            onMouseLeave={()=>setHover({idx:null,value:null,x:0,y:0})}
          />
        ))}
        {/* Etiquetas */}
        {styles.map((style,i) => {
          const angle = (2*Math.PI*i)/styles.length;
          return <text key={style} x={cx+Math.sin(angle)*(r+18)} y={cy-Math.cos(angle)*(r+18)} fontSize={13} fill="#6366f1" textAnchor="middle">{style}</text>;
        })}
        {/* Círculos guía */}
        {[25,50,75,100].map(v => (
          <circle key={v} cx={cx} cy={cy} r={r*v/100} fill="none" stroke="#e5e7eb" />
        ))}
        {/* Tooltip animado */}
        {hover.idx!==null && (
          <g>
            <rect x={hover.x+10} y={hover.y-30} width="60" height="28" rx="6" fill="#fff" stroke="#f472b6" />
            <text x={hover.x+18} y={hover.y-14} fontSize={12} fill="#333">{styles[hover.idx]}</text>
            <text x={hover.x+18} y={hover.y-2} fontSize={12} fill="#f472b6">{hover.value?.toFixed(1)}%</text>
          </g>
        )}
      </svg>
      {/* Leyenda centrada debajo */}
      <div className="flex flex-wrap justify-center gap-4 mt-2 mb-2">
        {styles.map((style, i) => (
          <div key={style} className="flex items-center gap-2">
            <span style={{width:16,height:4,background:colors[i%colors.length],display:'inline-block',borderRadius:2}}></span>
            <span className="text-xs text-gray-700 font-medium">{style}</span>
          </div>
        ))}
      </div>
      <button onClick={downloadSVG} className="mt-2 px-4 py-1 bg-pink-500 text-white rounded shadow hover:bg-pink-600">Descargar SVG</button>
    </div>
  );
}

// --- COMPONENTE DE BARRAS DE EMOCIONES ---
function EmotionDistributionBar({ analysisHistory }) {
  // Calcular distribución
  const emotionCounts = analysisHistory.reduce((acc, item) => {
    acc[item.emotion] = (acc[item.emotion] || 0) + 1;
    return acc;
  }, {});
  const total = analysisHistory.length || 1;
  const emotions = Object.keys(emotionCounts);
  const colors = ['#6366f1','#f59e42','#ef4444','#10b981','#fbbf24','#3b82f6','#a21caf','#eab308','#f472b6','#22d3ee'];
  const sorted = emotions.map(e => ({
    emotion: e,
    count: emotionCounts[e],
    percent: (emotionCounts[e]/total)*100
  })).sort((a,b)=>b.percent-a.percent);
  const dominante = sorted[0];
  // Interpretación simple
  const interpret = dominante ? `Tu emoción predominante es "${dominante.emotion}" (${dominante.percent.toFixed(1)}%). Esto indica que esta emoción ha sido la más frecuente en tus mensajes recientes.` : '';
  // Recomendación simple
  const recomend = dominante ? (dominante.emotion.toLowerCase().includes('triste')||dominante.emotion.toLowerCase().includes('ira') ? 'Te recomendamos buscar actividades que te ayuden a gestionar emociones negativas, como hablar con alguien de confianza o practicar técnicas de relajación.' : '¡Sigue así! Mantener emociones positivas es clave para tu bienestar.') : '';
  return (
    <div className="mt-6">
      <h4 className="text-md font-semibold text-indigo-700 mb-2">Distribución promedio de emociones</h4>
      <div className="space-y-2 mb-2">
        {sorted.map((e,i) => (
          <div key={e.emotion} className="flex items-center gap-2">
            <span className="text-xs w-20 text-gray-700">{e.emotion}</span>
            <div className="flex-1 bg-gray-200 rounded h-4 overflow-hidden">
              <div style={{width:`${e.percent}%`,background:colors[i%colors.length],transition:'width 0.5s'}} className="h-4 rounded"></div>
            </div>
            <span className="text-xs font-bold text-gray-700 ml-2">{e.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      {dominante && (
        <div className="mt-2 text-sm text-indigo-800 font-medium">Emoción dominante promedio: <span className="font-bold">{dominante.emotion}</span></div>
      )}
      {interpret && <div className="text-xs text-gray-600 mt-1">{interpret}</div>}
      {recomend && <div className="text-xs text-green-600 mt-1">{recomend}</div>}
    </div>
  );
}

// --- COMPONENTE DE BARRAS DE ESTILOS ---
function StyleDistributionBar({ analysisHistory }) {
  // Calcular distribución
  const styleCounts = analysisHistory.reduce((acc, item) => {
    acc[item.style] = (acc[item.style] || 0) + 1;
    return acc;
  }, {});
  const total = analysisHistory.length || 1;
  const styles = Object.keys(styleCounts);
  const colors = ['#f472b6','#6366f1','#10b981','#f59e42','#ef4444','#fbbf24','#3b82f6','#a21caf','#eab308','#22d3ee'];
  const sorted = styles.map(s => ({
    style: s,
    count: styleCounts[s],
    percent: (styleCounts[s]/total)*100
  })).sort((a,b)=>b.percent-a.percent);
  const dominante = sorted[0];
  // Interpretación simple
  const interpret = dominante ? `Tu estilo predominante es "${dominante.style}" (${dominante.percent.toFixed(1)}%). Esto indica que este estilo ha sido el más frecuente en tus mensajes recientes.` : '';
  // Recomendación simple
  const recomend = dominante ? (dominante.style.toLowerCase().includes('agresivo') ? 'Te sugerimos trabajar en la comunicación asertiva para mejorar tus relaciones.' : '¡Buen trabajo! Mantener un estilo positivo favorece la comunicación.') : '';
  return (
    <div className="mt-6">
      <h4 className="text-md font-semibold text-pink-700 mb-2">Distribución promedio de estilos</h4>
      <div className="space-y-2 mb-2">
        {sorted.map((s,i) => (
          <div key={s.style} className="flex items-center gap-2">
            <span className="text-xs w-20 text-gray-700">{s.style}</span>
            <div className="flex-1 bg-gray-200 rounded h-4 overflow-hidden">
              <div style={{width:`${s.percent}%`,background:colors[i%colors.length],transition:'width 0.5s'}} className="h-4 rounded"></div>
            </div>
            <span className="text-xs font-bold text-gray-700 ml-2">{s.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      {dominante && (
        <div className="mt-2 text-sm text-pink-800 font-medium">Estilo dominante promedio: <span className="font-bold">{dominante.style}</span></div>
      )}
      {interpret && <div className="text-xs text-gray-600 mt-1">{interpret}</div>}
      {recomend && <div className="text-xs text-green-600 mt-1">{recomend}</div>}
    </div>
  );
}

export default AnalysisPage;