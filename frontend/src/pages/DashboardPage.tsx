import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { analysisService, chatService, dashboardService } from '../services/api';
import Header from '../components/layout/Header';
import RealTimeStats from '../components/dashboard/RealTimeStats';
import RealTimeAnalysis from '../components/analysis/RealTimeAnalysis';
import { 
  FaUser, 
  FaChartLine, 
  FaComments, 
  FaChalkboardTeacher, 
  FaHistory, 
  FaBell, 
  FaFileAlt,
  FaSearch,
  FaCog,
  FaSignOutAlt,
  FaHeart,
  FaSmile,
  FaFrown,
  FaMeh,
  FaAngry,
  FaBrain,
  FaUserTie,
  FaGraduationCap,
  FaLightbulb
} from 'react-icons/fa';

interface DashboardStats {
  totalChats: number;
  totalMessages: number;
  avgEmotion: string;
  avgStyle: string;
  learningProgress: number;
  recentActivity: any[];
  emotionTrend: any[];
  alerts: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await dashboardService.getStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Función para obtener el icono de emoción
  const getEmotionIcon = (emotion: string) => {
    const emotionLower = emotion.toLowerCase();
    if (emotionLower.includes('alegría') || emotionLower.includes('felicidad') || emotionLower.includes('contento')) {
      return FaSmile;
    } else if (emotionLower.includes('tristeza') || emotionLower.includes('desánimo')) {
      return FaFrown;
    } else if (emotionLower.includes('ansiedad') || emotionLower.includes('preocupación')) {
      return FaMeh;
    } else if (emotionLower.includes('frustración') || emotionLower.includes('ira') || emotionLower.includes('agresivo')) {
      return FaAngry;
    } else {
      return FaHeart;
    }
  };

  // Función para obtener el icono de estilo
  const getStyleIcon = (style: string) => {
    const styleLower = style.toLowerCase();
    if (styleLower.includes('formal') || styleLower.includes('académico')) {
      return FaUserTie;
    } else if (styleLower.includes('coloquial') || styleLower.includes('informal')) {
      return FaComments;
    } else if (styleLower.includes('técnico') || styleLower.includes('especializado')) {
      return FaGraduationCap;
    } else if (styleLower.includes('creativo') || styleLower.includes('expresivo')) {
      return FaLightbulb;
    } else {
      return FaBrain;
    }
  };

  // Función para obtener descripción de emoción
  const getEmotionDescription = (emotion: string) => {
    const emotionLower = emotion.toLowerCase();
    if (emotionLower.includes('alegría') || emotionLower.includes('felicidad')) {
      return 'Estado emocional positivo y optimista';
    } else if (emotionLower.includes('tristeza') || emotionLower.includes('desánimo')) {
      return 'Estado emocional bajo o melancólico';
    } else if (emotionLower.includes('ansiedad') || emotionLower.includes('preocupación')) {
      return 'Estado de inquietud o nerviosismo';
    } else if (emotionLower.includes('frustración') || emotionLower.includes('ira')) {
      return 'Estado de irritación o enojo';
    } else {
      return 'Estado emocional equilibrado';
    }
  };

  // Función para obtener descripción de estilo
  const getStyleDescription = (style: string) => {
    const styleLower = style.toLowerCase();
    if (styleLower.includes('formal') || styleLower.includes('académico')) {
      return 'Comunicación estructurada y profesional';
    } else if (styleLower.includes('coloquial') || styleLower.includes('informal')) {
      return 'Comunicación relajada y cercana';
    } else if (styleLower.includes('técnico') || styleLower.includes('especializado')) {
      return 'Comunicación técnica y detallada';
    } else if (styleLower.includes('creativo') || styleLower.includes('expresivo')) {
      return 'Comunicación imaginativa y expresiva';
    } else {
      return 'Estilo comunicativo equilibrado';
    }
  };

  // Opciones del dashboard con sus rutas y APIs correspondientes
  const dashboardOptions = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: FaUser,
      description: 'Ver y editar información personal',
      route: '/profile',
      color: 'from-blue-500 to-blue-600',
      api: '/auth/me'
    },
    {
      id: 'analysis',
      title: 'Análisis',
      icon: FaChartLine,
      description: 'Análisis del último mensaje',
      route: '/last-analysis',
      color: 'from-green-500 to-green-600',
      api: '/analysis/last'
    },
    {
      id: 'chat-bot',
      title: 'Chat Bot',
      icon: FaComments,
      description: 'Conversar con IA empática',
      route: '/chat-bot', // Cambiado para ir directo al chat
      color: 'from-purple-500 to-purple-600',
      api: '/chat/'
    },
    {
      id: 'chat-tutor',
      title: 'Chat Tutor',
      icon: FaChalkboardTeacher,
      description: 'Conectar con tutor real',
      route: '/tutor-chat',
      color: 'from-orange-500 to-orange-600',
      api: '/tutor-chat/session'
    },
    {
      id: 'sessions',
      title: 'Sesiones',
      icon: FaHistory,
      description: 'Historial de conversaciones',
      route: '/sessions',
      color: 'from-indigo-500 to-indigo-600',
      api: '/chat/sessions'
    },
    {
      id: 'alerts',
      title: 'Alertas',
      icon: FaBell,
      description: 'Notificaciones importantes',
      route: '/alerts',
      color: 'from-red-500 to-red-600',
      api: '/chat/unread-messages'
    },
    {
      id: 'reports',
      title: 'Reportes',
      icon: FaFileAlt,
      description: 'Reportes detallados',
      route: '/reports',
      color: 'from-teal-500 to-teal-600',
      api: '/analysis/history'
    },
    {
      id: 'search',
      title: 'Buscar',
      icon: FaSearch,
      description: 'Buscar en mensajes',
      route: '/search',
      color: 'from-gray-500 to-gray-600',
      api: '/chat/search'
    }
  ];

  const quickStats = [
    {
      title: 'Mensajes Total',
      value: stats?.totalMessages || 0,
      icon: FaComments,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Emoción Dominante',
      value: stats?.avgEmotion || 'Neutral',
      icon: getEmotionIcon(stats?.avgEmotion || 'Neutral'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Estilo Dominante',
      value: stats?.avgStyle || 'Neutral',
      icon: getStyleIcon(stats?.avgStyle || 'Neutral'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Sesiones Activas',
      value: stats?.totalChats || 0,
      icon: FaHistory,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Alertas Pendientes',
      value: stats?.alerts || 0,
      icon: FaBell,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Progreso Emocional',
      value: `${stats?.learningProgress || 0}%`,
      icon: FaChartLine,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <Header title="Dashboard" subtitle="Panel de Control de PsiChat" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Opciones principales del dashboard */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Herramientas Disponibles</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {dashboardOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(option.route)}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-lg flex items-center justify-center mb-4`}>
                  <option.icon className="text-white text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </motion.div>
            ))}
                </div>
        </section>

        {/* Estadísticas rápidas */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Panel de Estadísticas Rápidas</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-4 text-center"
              >
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`text-lg ${stat.color}`} />
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                
                {/* Tooltip informativo para emociones y estilos */}
                {(stat.title === 'Emoción Dominante' || stat.title === 'Estilo Dominante') && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      {stat.title === 'Emoción Dominante' 
                        ? getEmotionDescription(stats?.avgEmotion || 'Neutral')
                        : getStyleDescription(stats?.avgStyle || 'Neutral')
                      }
                    </p>
                  </div>
                )}
                
                {/* Barra de progreso para el progreso emocional */}
                {stat.title === 'Progreso Emocional' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          (stats?.learningProgress || 0) >= 70 ? 'bg-green-500' : 
                          (stats?.learningProgress || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stats?.learningProgress || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats?.learningProgress >= 70 ? '🎉 ¡Excelente!' : 
                       stats?.learningProgress >= 50 ? '👍 Buen progreso' : '💪 Área de mejora'}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Acciones rápidas */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Acciones Rápidas</h2>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/search')}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                <FaSearch />
                Buscar mensajes
              </button>
              
              <button
                onClick={() => navigate('/analysis')}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                <FaChartLine />
                Ver análisis profundo (últimos 10 mensajes)
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                <FaCog />
                Configurar alertas
              </button>
                  </div>
              </div>
          </section>

        {/* Actividad reciente */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Actividad Reciente</h2>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'message' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'message' ? (
                          <FaComments className="text-blue-600 text-sm" />
                        ) : (
                          <FaChartLine className="text-green-600 text-sm" />
                        )}
                      </div>
              <div>
                        <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
                </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                        activity.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {activity.priority}
                      </span>
                </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Botón de logout */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            <FaSignOutAlt />
            Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 