import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { tutorService } from '../services/tutorService';
import TutorLayout from '../components/TutorLayout';
import { 
  FaArrowLeft, 
  FaGraduationCap, 
  FaComments, 
  FaExclamationTriangle,
  FaClock,
  FaChartLine,
  FaEdit,
  FaSave,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaUniversity
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface StudentProfile {
  id: number;
  nombre: string;
  email: string;
  institucion?: string;
  grado_academico?: string;
  ultimo_acceso?: string;
  estadisticas: {
    total_sesiones: number;
    sesiones_activas: number;
    total_mensajes: number;
    alertas_pendientes: number;
    promedio_mensajes_por_sesion: number;
  };
  sesiones_recientes: Array<{
    id: number;
    estado: string;
    iniciada_en: string;
    mensajes_count: number;
    duracion_total?: number;
  }>;
}

interface StudentProgress {
  estudiante: {
    id: number;
    nombre: string;
    email: string;
  };
  progreso: {
    total_sesiones: number;
    sesiones_completadas: number;
    porcentaje_completado: number;
    total_mensajes: number;
    promedio_mensajes_por_sesion: number;
  };
  analisis: {
    emociones_detectadas: Record<string, number>;
    estilos_comunicacion: Record<string, number>;
  };
  sesiones: Array<{
    id: number;
    estado: string;
    iniciada_en: string;
    mensajes_count: number;
    duracion_total?: number;
  }>;
}

export default function TutorStudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'sessions' | 'notes'>('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.rol !== 'tutor') {
      navigate('/dashboard');
      return;
    }

    if (studentId) {
      loadStudentData();
    }
  }, [user, navigate, studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      const [profileData, progressData] = await Promise.all([
        tutorService.getStudentProfile(parseInt(studentId!)),
        tutorService.getStudentProgress(parseInt(studentId!))
      ]);
      
      setStudentProfile(profileData);
      setStudentProgress(progressData);
      
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Error al cargar datos del estudiante');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await tutorService.updateStudentNotes(parseInt(studentId!), notes);
      setEditingNotes(false);
      toast.success('Notas guardadas exitosamente');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Error al guardar las notas');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  if (loading) {
    return (
      <TutorLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil del estudiante...</p>
          </div>
        </div>
      </TutorLayout>
    );
  }

  if (!studentProfile) {
    return (
      <TutorLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FaUser className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Estudiante no encontrado</p>
          </div>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/tutor/dashboard')}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <FaArrowLeft />
              </button>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaGraduationCap className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Perfil del Estudiante</h1>
                <p className="text-sm text-gray-600">{studentProfile.nombre}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: FaUser },
              { id: 'progress', label: 'Progreso', icon: FaChartLine },
              { id: 'sessions', label: 'Sesiones', icon: FaComments },
              { id: 'notes', label: 'Notas', icon: FaEdit }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaGraduationCap className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{studentProfile.nombre}</h2>
                      <p className="text-gray-600 flex items-center gap-2">
                        <FaEnvelope className="text-sm" />
                        {studentProfile.email}
                      </p>
                      {studentProfile.institucion && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <FaUniversity className="text-sm" />
                          {studentProfile.institucion}
                        </p>
                      )}
                      {studentProfile.grado_academico && (
                        <p className="text-gray-600">{studentProfile.grado_academico}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Último acceso</p>
                    <p className="text-sm font-medium">
                      {studentProfile.ultimo_acceso ? formatDateTime(studentProfile.ultimo_acceso) : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sesiones</p>
                      <p className="text-2xl font-bold text-gray-900">{studentProfile.estadisticas.total_sesiones}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaComments className="text-blue-600 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                      <p className="text-2xl font-bold text-gray-900">{studentProfile.estadisticas.sesiones_activas}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaClock className="text-green-600 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                      <p className="text-2xl font-bold text-gray-900">{studentProfile.estadisticas.total_mensajes}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaComments className="text-purple-600 text-xl" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Alertas Pendientes</p>
                      <p className="text-2xl font-bold text-gray-900">{studentProfile.estadisticas.alertas_pendientes}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FaExclamationTriangle className="text-red-600 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Sesiones Recientes</h3>
                </div>
                <div className="p-6">
                  {studentProfile.sesiones_recientes.length > 0 ? (
                    <div className="space-y-4">
                      {studentProfile.sesiones_recientes.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <FaComments className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Sesión #{session.id}</p>
                              <p className="text-sm text-gray-600">
                                {session.mensajes_count} mensajes • {formatDateTime(session.iniciada_en)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.estado)}`}>
                              {session.estado}
                            </span>
                            <button
                              onClick={() => navigate(`/tutor/chat/${session.id}`)}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              Ver sesión
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaComments className="text-4xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay sesiones recientes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && studentProgress && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Progreso General</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-emerald-600">
                        {studentProgress.progreso.porcentaje_completado.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Completado</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-blue-600">
                        {studentProgress.progreso.total_sesiones}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Total Sesiones</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-purple-600">
                        {studentProgress.progreso.promedio_mensajes_por_sesion.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Promedio Mensajes</p>
                  </div>
                </div>
              </div>

              {/* Emotional Analysis */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Análisis Emocional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Emociones Detectadas</h4>
                    <div className="space-y-2">
                      {Object.entries(studentProgress.analisis.emociones_detectadas).map(([emotion, count]) => (
                        <div key={emotion} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{emotion}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Estilos de Comunicación</h4>
                    <div className="space-y-2">
                      {Object.entries(studentProgress.analisis.estilos_comunicacion).map(([style, count]) => (
                        <div key={style} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{style}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && studentProgress && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Historial de Sesiones</h3>
                </div>
                <div className="p-6">
                  {studentProgress.sesiones.length > 0 ? (
                    <div className="space-y-4">
                      {studentProgress.sesiones.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <FaComments className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Sesión #{session.id}</p>
                              <p className="text-sm text-gray-600">
                                {session.mensajes_count} mensajes • {formatDateTime(session.iniciada_en)}
                                {session.duracion_total && ` • ${formatDuration(session.duracion_total)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.estado)}`}>
                              {session.estado}
                            </span>
                            <button
                              onClick={() => navigate(`/tutor/chat/${session.id}`)}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              Ver sesión
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaComments className="text-4xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay sesiones registradas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Notas del Tutor</h3>
                  {!editingNotes ? (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <FaEdit />
                      Editar notas
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveNotes}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        <FaSave />
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <FaTimes />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
                
                {editingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribe tus notas sobre este estudiante..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg min-h-64">
                    {notes ? (
                      <p className="text-gray-800 whitespace-pre-wrap">{notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">No hay notas registradas para este estudiante.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </TutorLayout>
  );
} 