import React from 'react';
import { 
  FaUsers, 
  FaComments, 
  FaExclamationTriangle,
  FaClock,
  FaChartLine,
  FaHeart,
  FaBrain
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  change, 
  description 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          
          {change && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
          </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

interface DashboardMetricsProps {
  stats: {
    totalStudents: number;
    activeSessions: number;
    pendingAlerts: number;
    averageResponseTime: string;
    totalMessages: number;
    engagementScore: number;
  };
}

export default function DashboardMetrics({ stats }: DashboardMetricsProps) {
  const metrics = [
    {
      title: 'Estudiantes Activos',
      value: stats.totalStudents,
      icon: <FaUsers className="text-blue-600 text-xl" />,
      color: 'bg-blue-100',
      description: 'Estudiantes con sesiones activas'
    },
    {
      title: 'Sesiones Activas',
      value: stats.activeSessions,
      icon: <FaComments className="text-green-600 text-xl" />,
      color: 'bg-green-100',
      description: 'Sesiones en curso'
    },
    {
      title: 'Alertas Pendientes',
      value: stats.pendingAlerts,
      icon: <FaExclamationTriangle className="text-red-600 text-xl" />,
      color: 'bg-red-100',
      description: 'Requieren atención'
    },
    {
      title: 'Tiempo Respuesta',
      value: stats.averageResponseTime,
      icon: <FaClock className="text-purple-600 text-xl" />,
      color: 'bg-purple-100',
      description: 'Promedio de respuesta'
    },
    {
      title: 'Mensajes Hoy',
      value: stats.totalMessages,
      icon: <FaChartLine className="text-indigo-600 text-xl" />,
      color: 'bg-indigo-100',
      description: 'Total de mensajes'
    },
    {
      title: 'Engagement',
      value: `${stats.engagementScore}%`,
      icon: <FaHeart className="text-pink-600 text-xl" />,
      color: 'bg-pink-100',
      description: 'Nivel de participación'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          color={metric.color}
          description={metric.description}
        />
      ))}
    </div>
  );
}

export { MetricCard }; 