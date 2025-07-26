import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { chatService } from '../services/api';
import Header from '../components/layout/Header';
import { FaSearch, FaArrowLeft, FaFilter, FaCalendar, FaUser, FaComments, FaChalkboardTeacher } from 'react-icons/fa';

interface SearchResult {
  id: number;
  contenido: string;
  timestamp: string;
  es_tutor: boolean;
  usuario_id: number;
  sesion_id: number;
  usuario_nombre?: string;
  usuario_email?: string;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<number | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadSessions();
  }, [user, navigate]);

  const loadSessions = async () => {
    try {
      const userSessions = await chatService.getUserSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = await chatService.searchMessages(query, sessionFilter || undefined);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching messages:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightQuery = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <Header 
        title="Búsqueda de Mensajes" 
        subtitle="Encuentra mensajes específicos en tus conversaciones"
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Barra de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar en mensajes..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={sessionFilter || ''}
                onChange={(e) => setSessionFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todas las sesiones</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    Sesión #{session.id} - {session.estado}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <FaSearch />
                    Buscar
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Resultados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {results.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Resultados ({results.length})
              </h2>
              
              <div className="space-y-4">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          result.es_tutor ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          {result.es_tutor ? (
                            <FaChalkboardTeacher className="text-orange-600 text-sm" />
                          ) : (
                            <FaUser className="text-blue-600 text-sm" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {result.es_tutor ? 'Tutor' : result.usuario_nombre || 'Usuario'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Sesión #{result.sesion_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaCalendar />
                        {formatDate(result.timestamp)}
                      </div>
                    </div>
                    
                    <div 
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightQuery(result.contenido) 
                      }}
                    />
                    
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => navigate(`/chat?session=${result.sesion_id}`)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                      >
                        <FaComments />
                        Ver conversación
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {!loading && results.length === 0 && query && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <FaSearch className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
              <p className="text-gray-600">
                No se encontraron mensajes que coincidan con "{query}"
              </p>
            </motion.div>
          )}
          
          {!query && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <FaSearch className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Busca en tus mensajes</h3>
              <p className="text-gray-600">
                Escribe algo en la barra de búsqueda para encontrar mensajes específicos
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SearchPage; 