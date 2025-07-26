import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { FaSignInAlt, FaRegCommentDots, FaHeart, FaHandsHelping } from 'react-icons/fa';
import { motion } from 'framer-motion';

const LOGO = (
  <div style={{
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#6366f1 40%,#f472b6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 24px #0002',
    margin: '0 auto 10px',
    fontSize: 38,
    color: '#fff',
    fontWeight: 700,
    border: '4px solid #fff8',
  }}>
    <span role="img" aria-label="PsiChat">💬</span>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    if (!validateEmail(email)) {
      setEmailError("Introduce un correo electrónico válido.");
      return;
    }
    try {
      const user = await login(email, password);
      if (user?.rol === "tutor" || user?.rol === "admin") {
        navigate("/tutor");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      // El error ya está manejado en el store
      console.error('Login error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', backgroundAttachment: 'fixed' }}>
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring' }}
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: 28,
          boxShadow: '0 8px 40px #0002',
          padding: 36,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          alignItems: 'center',
        }}
        onSubmit={handleSubmit}
        aria-label="Formulario de inicio de sesión"
      >
        {LOGO}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#6366f1', marginBottom: 2 }}>¡Bienvenido a PsiChat!</h2>
          <span style={{ fontSize: 16, color: '#666' }}>Inicia sesión para comenzar a conversar y sentirte mejor.</span>
        </div>
        <input
          type="email"
          placeholder="Correo electrónico"
          style={{
            border: 'none',
            borderRadius: 16,
            padding: '14px 18px',
            fontSize: 17,
            background: '#fff',
            boxShadow: emailError ? '0 0 0 2px #ef4444' : '0 2px 8px #0001',
            outline: 'none',
            width: '100%',
            marginBottom: 2,
            fontFamily: 'Poppins, sans-serif',
          }}
          required
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (emailError && validateEmail(e.target.value)) setEmailError(null);
          }}
          aria-label="Correo electrónico"
          autoComplete="email"
        />
        {emailError && (
          <div style={{ color: '#ef4444', fontSize: 13, width: '100%', textAlign: 'left', marginBottom: -10 }}>{emailError}</div>
        )}
        <input
          type="password"
          placeholder="Contraseña"
          style={{
            border: 'none',
            borderRadius: 16,
            padding: '14px 18px',
            fontSize: 17,
            background: '#fff',
            boxShadow: '0 2px 8px #0001',
            outline: 'none',
            width: '100%',
            fontFamily: 'Poppins, sans-serif',
          }}
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          aria-label="Contraseña"
          autoComplete="current-password"
        />
        <motion.button
          type="submit"
          style={{
            background: 'linear-gradient(90deg,#6366f1 40%,#f472b6 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            padding: '13px 0',
            borderRadius: 999,
            boxShadow: '0 2px 12px #6366f133',
            width: '100%',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
          disabled={loading}
          aria-label="Entrar"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: loading ? 1 : 1.04 }}
        >
          <FaSignInAlt style={{ fontSize: 22 }} />
          <span>{loading ? "Entrando..." : "Entrar"}</span>
        </motion.button>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 0', borderRadius: 10, width: '100%', textAlign: 'center', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{error}</div>
        )}
        <div style={{ textAlign: 'center', fontSize: 15, color: '#6366f1', marginTop: 8 }}>
          ¿No tienes cuenta? <a href="/register" style={{ color: '#f472b6', fontWeight: 600, textDecoration: 'underline', marginLeft: 2 }}>Regístrate</a>
        </div>
      </motion.form>
    </div>
  );
} 