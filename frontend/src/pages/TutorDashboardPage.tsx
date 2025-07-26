import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { tutorService } from '../services/tutorService';
import { reportesService, type Reporte } from '../services/reportes';
import TutorLayout from '../components/TutorLayout';
import { 
  FaUserTie, 
  FaComments, 
  FaBell, 
  FaChartLine, 
  FaUsers, 
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaEllipsisV,
  FaGraduationCap,
  FaHeart,
  FaBrain,
  FaCalendarAlt,
  FaEnvelope,
  FaFileAlt,
  FaDownload,
  FaTrash,
  FaStop
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  ultimo_acceso: string;
  sesiones_count: number;
  alertas_count: number;
}

interface Session {
  id: number;
  estudiante_nombre: string;
  estudiante_email: string;
  iniciada_en: string;
  mensajes_count: number;
  estado: string;
  prioridad: string;
  ultima_actividad: string;
}

interface DashboardStats {
  totalStudents: number;
  activeSessions: number;
  pendingAlerts: number;
  averageResponseTime: string;
  totalMessages: number;
  engagementScore: number;
}

export default function TutorDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'students' | 'sessions' | 'alerts' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [reportesLoading, setReportesLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.rol !== 'tutor') {
      navigate('/dashboard');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [studentsData, sessionsData, statsData] = await Promise.all([
        tutorService.getStudents(),
        tutorService.getSessions(),
        tutorService.getDashboardStats()
      ]);
      
      setStudents(studentsData);
      setSessions(sessionsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadReportes = async () => {
    try {
      setReportesLoading(true);
      const response = await reportesService.getReportes(1, 20);
      setReportes(response.reportes);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar reportes');
    } finally {
      setReportesLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'text-red-600 bg-red-100';
      case 'media':
        return 'text-yellow-600 bg-yellow-100';
      case 'baja':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activa':
        return 'text-green-600 bg-green-100';
      case 'pausada':
        return 'text-yellow-600 bg-yellow-100';
      case 'cerrada':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    return date.toLocaleDateString('es-ES');
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.estudiante_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.estudiante_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.estado === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.ultima_actividad).getTime() - new Date(a.ultima_actividad).getTime();
      case 'priority':
        const priorityOrder = { alta: 3, media: 2, baja: 1 };
        return (priorityOrder[b.prioridad as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.prioridad as keyof typeof priorityOrder] || 0);
      case 'messages':
        return b.mensajes_count - a.mensajes_count;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <TutorLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </TutorLayout>
    );
  }

  const handleReviewAlert = async (alertId: number) => {
    try {
      await tutorService.reviewAlert(alertId);
      toast.success('Alerta revisada con éxito');
      loadDashboardData(); // Recargar datos para actualizar el contador de alertas pendientes
    } catch (error) {
      console.error('Error al revisar alerta:', error);
      toast.error('Error al revisar alerta');
    }
  };

  return (
    <TutorLayout>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <FaUserTie className="text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Dashboard del Tutor</h1>
                <p className="text-sm text-gray-600">Bienvenido, {user?.nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <FaBell />
                {stats?.pendingAlerts && stats.pendingAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.pendingAlerts}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors"
              >
                {user?.nombre?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: FaChartLine },
              { id: 'students', label: 'Estudiantes', icon: FaUsers },
              { id: 'sessions', label: 'Sesiones', icon: FaComments },
              { id: 'alerts', label: 'Alertas', icon: FaExclamationTriangle },
              { id: 'reports', label: 'Reportes', icon: FaFileAlt }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estudiantes</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaUsers className="text-blue-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.activeSessions}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaComments className="text-green-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Alertas Pendientes</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.pendingAlerts}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-600 text-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.averageResponseTime}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FaClock className="text-purple-600 text-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Actividad Reciente</h2>
                  </div>
                  <div className="p-6">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <FaUserTie className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{session.estudiante_nombre}</p>
                            <p className="text-sm text-gray-600">{session.mensajes_count} mensajes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.estado)}`}>
                            {session.estado}
                          </span>
                          <span className="text-sm text-gray-500">{formatTime(session.ultima_actividad)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar sesiones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="activa">Activa</option>
                      <option value="pausada">Pausada</option>
                      <option value="cerrada">Cerrada</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="recent">Más recientes</option>
                      <option value="priority">Por prioridad</option>
                      <option value="messages">Por mensajes</option>
                    </select>
                  </div>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Sesiones de Chat</h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {sortedSessions.map((session) => (
                      <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                           onClick={() => navigate(`/tutor/chat/${session.id}`)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                              <FaUserTie className="text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{session.estudiante_nombre}</h3>
                              <p className="text-sm text-gray-600">{session.estudiante_email}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  <FaComments className="inline mr-1" />
                                  {session.mensajes_count} mensajes
                                </span>
                                <span className="text-xs text-gray-500">
                                  <FaClock className="inline mr-1" />
                                  {formatTime(session.ultima_actividad)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(session.prioridad)}`}>
                              {session.prioridad}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.estado)}`}>
                              {session.estado}
                            </span>
                            
                            {/* Botón de terminar sesión - solo para sesiones activas */}
                            {session.estado === 'activa' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('¿Estás seguro de que quieres terminar esta sesión? Se generará un reporte automático.')) {
                                    // Aquí llamarías al endpoint para terminar la sesión
                                    toast.success('Funcionalidad de terminar sesión en desarrollo');
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Terminar sesión y generar reporte"
                              >
                                <FaStop />
                              </button>
                            )}
                            
                            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <FaEye />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {sortedSessions.length === 0 && (
                      <div className="p-12 text-center">
                        <FaComments className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No hay sesiones que coincidan con los filtros</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Estudiantes Asignados</h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaGraduationCap className="text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{student.nombre}</h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {student.sesiones_count} sesiones
                                </span>
                                {student.alertas_count > 0 && (
                                  <span className="text-xs text-red-600">
                                    <FaExclamationTriangle className="inline mr-1" />
                                    {student.alertas_count} alertas
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              student.estado === 'activo' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                            }`}>
                              {student.estado}
                            </span>
                            <button 
                              onClick={() => navigate(`/tutor/student/${student.id}`)}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              Ver perfil
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Alertas y Notificaciones</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center py-12">
                      <FaExclamationTriangle className="text-4xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay alertas pendientes</p>
                      <p className="text-sm text-gray-500 mt-2">Todas las alertas han sido revisadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* Header con botón de cargar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Reportes de Sesiones</h2>
                      <p className="text-sm text-gray-600">Reportes generados automáticamente por Gemini</p>
                    </div>
                    <button
                      onClick={loadReportes}
                      disabled={reportesLoading}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                    >
                      {reportesLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Cargando...
                        </>
                      ) : (
                        <>
                          <FaFileAlt />
                          Cargar Reportes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lista de reportes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Reportes Generados</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {reportesLoading ? (
                      <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando reportes...</p>
                      </div>
                    ) : reportes.length === 0 ? (
                      <div className="p-12 text-center">
                        <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No hay reportes generados</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Los reportes se generan automáticamente al terminar sesiones
                        </p>
                      </div>
                    ) : (
                      reportes.map((reporte) => (
                        <div key={reporte.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <FaFileAlt className="text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800">{reporte.titulo}</h3>
                                <p className="text-sm text-gray-600">Sesión #{reporte.sesion_id}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">
                                    <FaCalendarAlt className="inline mr-1" />
                                    {reportesService.formatFecha(reporte.creado_en)}
                                  </span>
                                  {reporte.emociones_detectadas && reporte.emociones_detectadas.length > 0 && (
                                    <span className="text-xs text-purple-600">
                                      {reporte.emociones_detectadas.length} emociones detectadas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${reportesService.getEstadoColor(reporte.estado)}`}>
                                {reportesService.getEstadoTexto(reporte.estado)}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    // Aquí podrías abrir un modal para ver el reporte completo
                                    alert(`Reporte: ${reporte.titulo}\n\n${reporte.resumen_ejecutivo || 'Sin resumen disponible'}`);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver reporte"
                                >
                                  <FaEye />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    // Función para descargar reporte
                                    const contenido = `
REPORTE DE SESIÓN
================

Título: ${reporte.titulo}
Fecha: ${reportesService.formatFecha(reporte.creado_en)}
Estado: ${reportesService.getEstadoTexto(reporte.estado)}

RESUMEN EJECUTIVO
=================
${reporte.resumen_ejecutivo || 'No disponible'}

CONTENIDO COMPLETO
==================
${reporte.contenido}

RECOMENDACIONES
===============
${reporte.recomendaciones?.join('\n- ') || 'No hay recomendaciones específicas'}
                                    `;
                                    
                                    const blob = new Blob([contenido], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `reporte_sesion_${reporte.sesion_id}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Descargar reporte"
                                >
                                  <FaDownload />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
                                      reportesService.eliminarReporte(reporte.id).then(() => {
                                        toast.success('Reporte eliminado');
                                        loadReportes();
                                      }).catch(() => {
                                        toast.error('Error al eliminar reporte');
                                      });
                                    }
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar reporte"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TutorLayout>
  );
} 