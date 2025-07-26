/**
 * Página para ver y gestionar reportes de sesiones
 */

import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaDownload,
  FaSearch,
  FaFilter,
  FaCalendar,
  FaUser,
  FaTimes
} from 'react-icons/fa';
import { reportesService, type Reporte } from '../services/reportes';
import { useAuth } from '../stores/authStore';

export default function ReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    cargarReportes();
  }, [pagina, busqueda, filtroEstado]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const response = await reportesService.getReportes(pagina, 20);
      setReportes(response.reportes);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError('Error al cargar los reportes');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerReporte = (reporte: Reporte) => {
    setReporteSeleccionado(reporte);
    setShowModal(true);
  };

  const handleEliminarReporte = async (reporteId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    try {
      await reportesService.eliminarReporte(reporteId);
      await cargarReportes();
    } catch (err) {
      alert('Error al eliminar el reporte');
      console.error('Error deleting report:', err);
    }
  };

  const handleDescargarReporte = (reporte: Reporte) => {
    // Crear un blob con el contenido del reporte
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

EMOCIONES DETECTADAS
===================
${reporte.emociones_detectadas?.join(', ') || 'No se detectaron emociones específicas'}

ALERTAS GENERADAS
=================
${reporte.alertas_generadas?.length || 0} alertas durante la sesión
    `;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_sesion_${reporte.sesion_id}_${new Date(reporte.creado_en).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && reportes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes de Sesiones</h1>
        <p className="text-gray-600">
          Gestiona y revisa los reportes generados automáticamente por Gemini
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="generado">Generado</option>
              <option value="revisado">Revisado</option>
              <option value="aprobado">Aprobado</option>
            </select>
            
            <button
              onClick={cargarReportes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaFilter className="inline mr-2" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de reportes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={cargarReportes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : reportes.length === 0 ? (
          <div className="p-12 text-center">
            <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay reportes</h3>
            <p className="text-gray-600">
              {busqueda || filtroEstado 
                ? 'No se encontraron reportes con los filtros aplicados'
                : 'Aún no se han generado reportes de sesiones'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sesión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reporte.titulo}
                          </div>
                          {reporte.resumen_ejecutivo && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {reporte.resumen_ejecutivo}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{reporte.sesion_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportesService.getEstadoColor(reporte.estado)}`}>
                        {reportesService.getEstadoTexto(reporte.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaCalendar className="mr-1" />
                        {reportesService.formatFecha(reporte.creado_en)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerReporte(reporte)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver reporte"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDescargarReporte(reporte)}
                          className="text-green-600 hover:text-green-900"
                          title="Descargar reporte"
                        >
                          <FaDownload />
                        </button>
                        {user?.rol === 'tutor' && (
                          <button
                            onClick={() => handleEliminarReporte(reporte.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar reporte"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {total > 20 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setPagina(pagina - 1)}
              disabled={pagina === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Página {pagina} de {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina >= Math.ceil(total / 20)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </nav>
        </div>
      )}

      {/* Modal para ver reporte */}
      {showModal && reporteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {reporteSeleccionado.titulo}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Estado</div>
                    <div className="font-medium">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportesService.getEstadoColor(reporteSeleccionado.estado)}`}>
                        {reportesService.getEstadoTexto(reporteSeleccionado.estado)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Fecha de creación</div>
                    <div className="font-medium">{reportesService.formatFecha(reporteSeleccionado.creado_en)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Sesión ID</div>
                    <div className="font-medium">#{reporteSeleccionado.sesion_id}</div>
                  </div>
                </div>
              </div>

              {reporteSeleccionado.resumen_ejecutivo && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Resumen Ejecutivo</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{reporteSeleccionado.resumen_ejecutivo}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Contenido Completo</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">{reporteSeleccionado.contenido}</pre>
                </div>
              </div>

              {reporteSeleccionado.recomendaciones && reporteSeleccionado.recomendaciones.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Recomendaciones</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {reporteSeleccionado.recomendaciones.map((rec, index) => (
                      <li key={index} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {reporteSeleccionado.emociones_detectadas && reporteSeleccionado.emociones_detectadas.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Emociones Detectadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {reporteSeleccionado.emociones_detectadas.map((emocion, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {emocion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => handleDescargarReporte(reporteSeleccionado)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-2"
              >
                <FaDownload className="inline mr-2" />
                Descargar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 