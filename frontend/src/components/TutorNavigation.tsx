import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  FaUserTie, 
  FaComments, 
  FaUsers, 
  FaChartLine, 
  FaBell, 
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaHistory,
  FaExclamationTriangle,
  FaGraduationCap,
  FaHeart,
  FaBrain
} from 'react-icons/fa';

interface TutorNavigationProps {
  className?: string;
}

export default function TutorNavigation({ className = '' }: TutorNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/tutor/dashboard',
      icon: FaHome,
      description: 'Resumen general'
    },
    {
      name: 'Sesiones',
      href: '/tutor/sessions',
      icon: FaComments,
      description: 'Chats activos'
    },
    {
      name: 'Estudiantes',
      href: '/tutor/students',
      icon: FaUsers,
      description: 'Gestión de estudiantes'
    },
    {
      name: 'Alertas',
      href: '/tutor/alerts',
      icon: FaExclamationTriangle,
      description: 'Notificaciones importantes'
    },
    {
      name: 'Reportes',
      href: '/tutor/reports',
      icon: FaChartLine,
      description: 'Análisis y estadísticas'
    },
    {
      name: 'Historial',
      href: '/tutor/history',
      icon: FaHistory,
      description: 'Sesiones anteriores'
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <nav className={`bg-white shadow-sm border-r border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Logo y título */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <FaUserTie className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">PsiChat Tutor</h1>
            <p className="text-xs text-gray-500">Panel de tutoría</p>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-emerald-600">
                {user?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.nombre}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`text-lg ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <div>{item.name}</div>
                  <div className={`text-xs ${active ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Separador */}
        <div className="my-6 border-t border-gray-200" />

        {/* Acciones rápidas */}
        <div className="space-y-1 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Acciones Rápidas
          </h3>
          
          <button
            onClick={() => navigate('/tutor/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <FaBell className="text-lg text-gray-400" />
            <span>Notificaciones</span>
          </button>
          
          <button
            onClick={() => navigate('/tutor/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <FaGraduationCap className="text-lg text-gray-400" />
            <span>Nueva Sesión</span>
          </button>
          
          <button
            onClick={() => navigate('/tutor/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <FaBrain className="text-lg text-gray-400" />
            <span>Análisis IA</span>
          </button>
        </div>

        {/* Configuración y logout */}
        <div className="space-y-1">
          <button
            onClick={() => navigate('/perfil')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <FaCog className="text-lg text-gray-400" />
            <span>Configuración</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="text-lg" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </nav>
  );
} 