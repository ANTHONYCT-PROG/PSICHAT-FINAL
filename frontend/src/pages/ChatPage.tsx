import React, { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaRobot, FaComments, FaArrowRight, FaHistory, FaChartLine } from "react-icons/fa";
import ChatInterface from "../components/chat/ChatInterface";
import Header from "../components/layout/Header";
import { chatService } from "../services/api";

interface ChatSession {
  id: number;
  estado: string;
  mensajes_count: number;
  iniciada_en: string;
}

export default function ChatPage() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  if (!token || !user) {
    navigate("/login");
    return null;
  }

  useEffect(() => {
    loadRecentSessions();
  }, []);

  const loadRecentSessions = async () => {
    try {
      setLoading(true);
      const sessions = await chatService.getUserSessions();
      setRecentSessions(sessions.slice(0, 3)); // Solo las 3 más recientes
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setShowChat(true);
  };

  const handleContinueSession = (sessionId: number) => {
    setShowChat(true);
    // Pasar el sessionId al ChatInterface
  };

  if (showChat) {
    return (
      <ChatInterface
        sessionId={1}
        title="PsiChat"
        subtitle="Chat Estudiantil"
        onBack={() => setShowChat(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      <Header 
        title="Chat con IA" 
        subtitle="Conversa con nuestro asistente inteligente"
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
      />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaRobot className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Hola, {user.nombre || 'Estudiante'}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Estoy aquí para ayudarte con tus dudas y acompañarte en tu aprendizaje.
            <br />
            ¿En qué puedo ayudarte hoy?
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartNewChat}
            className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto"
          >
            <FaComments />
            Iniciar Nueva Conversación
            <FaArrowRight />
          </motion.button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <FaComments className="text-indigo-500 text-2xl mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Conversaciones</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {recentSessions.length}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <FaHistory className="text-pink-500 text-2xl mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Mensajes</h3>
            <p className="text-3xl font-bold text-pink-600">
              {recentSessions.reduce((acc, session) => acc + session.mensajes_count, 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <FaChartLine className="text-cyan-500 text-2xl mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Progreso</h3>
            <p className="text-3xl font-bold text-cyan-600">
              {Math.round((recentSessions.length / 10) * 100)}%
            </p>
          </div>
        </motion.div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FaHistory className="text-indigo-500" />
              Conversaciones Recientes
            </h2>
            
            <div className="space-y-4">
              {recentSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleContinueSession(session.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Sesión #{session.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {session.mensajes_count} mensajes • {new Date(session.iniciada_en).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.estado === 'activa' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.estado}
                    </span>
                    <FaArrowRight className="text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Análisis Emocional</h3>
            <p className="text-gray-600 mb-4">
              Nuestro sistema analiza tus mensajes para detectar emociones y proporcionar apoyo personalizado.
            </p>
            <button
              onClick={() => navigate('/analysis')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver análisis →
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Chat con Tutor</h3>
            <p className="text-gray-600 mb-4">
              ¿Necesitas ayuda más específica? Conecta con un tutor real para apoyo personalizado.
            </p>
            <button
              onClick={() => navigate('/tutor-chat')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Conectar con tutor →
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 