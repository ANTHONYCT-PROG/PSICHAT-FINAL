import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  FaChartLine, 
  FaChartPie, 
  FaChartBar, 
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaExpand,
  FaCompress
} from 'react-icons/fa';

interface ChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

interface ChartProps {
  title: string;
  data: ChartData[];
  type: 'area' | 'bar' | 'pie' | 'line' | 'composed' | 'radar';
  height?: number;
  tooltip?: string;
  dataKeys?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showAxis?: boolean;
  stacked?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
  className?: string;
}

const InteractiveChart: React.FC<ChartProps> = ({
  title,
  data,
  type,
  height = 300,
  tooltip,
  dataKeys = ['value'],
  colors = ['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#22c55e'],
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showAxis = true,
  stacked = false,
  fillOpacity = 0.3,
  strokeWidth = 2,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showData, setShowData] = useState(true);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      height: isExpanded ? 500 : height,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey="name" />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={stacked ? "1" : undefined}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey="name" />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]}>
                {data.map((entry, cellIndex) => (
                  <Cell key={`cell-${cellIndex}`} fill={entry.color || colors[index % colors.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={isExpanded ? 120 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey="name" />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxis && <XAxis dataKey="name" />}
            {showAxis && <YAxis />}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={stacked ? "1" : undefined}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
              />
            ))}
          </ComposedChart>
        );

      case 'radar':
        return (
          <RadarChart {...commonProps}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            {dataKeys.map((key, index) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={fillOpacity}
              />
            ))}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
          </RadarChart>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {tooltip && (
            <FaInfoCircle 
              className="text-gray-400 cursor-help" 
              title={tooltip}
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowData(!showData)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={showData ? 'Ocultar datos' : 'Mostrar datos'}
          >
            {showData ? <FaEyeSlash /> : <FaEye />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? 'Comprimir' : 'Expandir'}
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              // Función para descargar el gráfico como imagen
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const link = document.createElement('a');
                link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Descargar gráfico"
          >
            <FaDownload />
          </motion.button>
        </div>
      </div>
      
      {showData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ResponsiveContainer width="100%" height={isExpanded ? 500 : height}>
            {renderChart()}
          </ResponsiveContainer>
        </motion.div>
      )}
      
      {!showData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-32 text-gray-400"
        >
          <p>Datos ocultos</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InteractiveChart; 