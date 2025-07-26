import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import ChatBotPage from "./pages/ChatBotPage";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";
import LastAnalysisPage from "./pages/LastAnalysisPage";
import SessionsPage from "./pages/SessionsPage";
import TutorChatPage from "./pages/TutorChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import TutorPage from "./pages/TutorPage";
import TutorDashboardPage from "./pages/TutorDashboardPage";
import TutorChatSessionPage from "./pages/TutorChatSessionPage";
import SearchPage from "./pages/SearchPage";
import AlertsPage from "./pages/AlertsPage";
import ReportsPage from "./pages/ReportsPage";
import SmartRedirect from "./components/SmartRedirect";
import { useSessionSync } from "./hooks/useSessionSync";
import { useAuthStore } from "./stores/authStore";
import { authService } from "./services/auth";
import { websocketService } from "./services/websocket";
import SessionNotification from "./components/SessionNotification";
import ErrorBoundary from "./components/ErrorBoundary";
import UserDebugInfo from "./components/UserDebugInfo";
import TutorStudentProfilePage from "./pages/TutorStudentProfilePage";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { notification, setNotification } = useSessionSync();
  
  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id);
    } else {
      websocketService.disconnect();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user?.id]);

  // Initialize auth service
  useEffect(() => {
    // Auth service initialization is handled automatically
  }, []);
  
  return (
    <>
      {children}
      {notification && (
        <SessionNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <UserDebugInfo />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const location = useLocation();
  
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

function TutorRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const location = useLocation();
  
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user.rol !== 'tutor' && user.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  
  if (token && user) {
    // Si es estudiante, ir al dashboard
    if (user.rol === 'estudiante') {
      return <Navigate to="/dashboard" replace />;
    }
    // Si es tutor o admin, ir al panel de tutor
    if (user.rol === 'tutor' || user.rol === 'admin') {
      return <Navigate to="/tutor" replace />;
    }
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SmartRedirect />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/chat-bot" element={<PrivateRoute><ChatBotPage /></PrivateRoute>} />
          <Route path="/tutor-chat" element={<PrivateRoute><TutorChatPage /></PrivateRoute>} />
          <Route path="/analysis" element={<PrivateRoute><AnalysisPage /></PrivateRoute>} />
          <Route path="/last-analysis" element={<PrivateRoute><LastAnalysisPage /></PrivateRoute>} />
          <Route path="/sessions" element={<PrivateRoute><SessionsPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
          <Route path="/alerts" element={<PrivateRoute><AlertsPage /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
                  <Route path="/tutor" element={<TutorRoute><ErrorBoundary><TutorPage /></ErrorBoundary></TutorRoute>} />
        <Route path="/tutor/dashboard" element={<TutorRoute><ErrorBoundary><TutorDashboardPage /></ErrorBoundary></TutorRoute>} />
        <Route path="/tutor/chat/:sessionId" element={<TutorRoute><ErrorBoundary><TutorChatSessionPage /></ErrorBoundary></TutorRoute>} />
        <Route path="/tutor/student/:studentId" element={<TutorRoute><ErrorBoundary><TutorStudentProfilePage /></ErrorBoundary></TutorRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
