import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaRobot, FaBrain, FaHeart } from "react-icons/fa";
import ChatInterface from "../components/chat/ChatInterface";
import { useAuthStore } from "../stores/authStore";

const MotionDiv = motion.div;

const ChatBotPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Chat Interface */}
      <ChatInterface
        sessionId={1}
        title="PsiChat Bot"
        subtitle="Tu asistente emocional inteligente"
        onBack={() => navigate('/dashboard')}
      />
    </div>
  );
};

export default ChatBotPage; 