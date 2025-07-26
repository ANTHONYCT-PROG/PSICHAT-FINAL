import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { FaUserPlus } from 'react-icons/fa';
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

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [gradoAcademico, setGradoAcademico] = useState("");
  const [rol, setRol] = useState("");
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setNombreError(null);
    let valid = true;
    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio.");
      valid = false;
    }
    if (!validateEmail(email)) {
      setEmailError("Introduce un correo electrónico válido.");
      valid = false;
    }
    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres 🛡️");
      valid = false;
    }
    if (!valid) return;
    const data: any = {
      nombre: nombre.trim(),
      email: email.trim(),
      password,
    };
    if (apellido.trim()) data.apellido = apellido.trim();
    if (telefono.trim()) data.telefono = telefono.trim();
    if (fechaNacimiento) data.fecha_nacimiento = fechaNacimiento + 'T00:00:00';
    if (genero) data.genero = genero;
    if (institucion.trim()) data.institucion = institucion.trim();
    if (gradoAcademico.trim()) data.grado_academico = gradoAcademico.trim();
    if (rol) data.rol = rol;
    try {
      await register(data);
      navigate("/dashboard");
    } catch (err: any) {
      // El error ya está manejado en el store
      console.error('Register error:', err);
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
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          alignItems: 'center',
        }}
        onSubmit={handleSubmit}
        aria-label="Formulario de registro"
      >
        {LOGO}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#6366f1', marginBottom: 2 }}>¡Crea tu cuenta en PsiChat!</h2>
          <span style={{ fontSize: 16, color: '#666' }}>Regístrate y empieza a conversar en un espacio seguro y positivo.</span>
        </div>
        <input
          type="text"
          placeholder="Nombre completo"
          style={{
            border: 'none',
            borderRadius: 16,
            padding: '14px 18px',
            fontSize: 17,
            background: '#fff',
            boxShadow: nombreError ? '0 0 0 2px #ef4444' : '0 2px 8px #0001',
            outline: 'none',
            width: '100%',
            fontFamily: 'Poppins, sans-serif',
            marginBottom: 2,
          }}
          required
          value={nombre}
          onChange={e => {
            setNombre(e.target.value);
            if (nombreError && e.target.value.trim()) setNombreError(null);
          }}
          aria-label="Nombre completo"
        />
        {nombreError && (
          <div style={{ color: '#ef4444', fontSize: 13, width: '100%', textAlign: 'left', marginBottom: -10 }}>{nombreError}</div>
        )}
        <input
          type="text"
          placeholder="Apellido (opcional)"
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
          value={apellido}
          onChange={e => setApellido(e.target.value)}
          aria-label="Apellido"
        />
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
            fontFamily: 'Poppins, sans-serif',
            marginBottom: 2,
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
            boxShadow: passwordError ? '0 0 0 2px #ef4444' : '0 2px 8px #0001',
            outline: 'none',
            width: '100%',
            fontFamily: 'Poppins, sans-serif',
          }}
          required
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (passwordError && e.target.value.length >= 8) setPasswordError(null);
          }}
          aria-label="Contraseña"
          autoComplete="new-password"
        />
        {passwordError && (
          <div style={{ color: '#ef4444', fontSize: 13, width: '100%', textAlign: 'left', marginBottom: -10 }}>{passwordError}</div>
        )}
        <input
          type="tel"
          placeholder="Teléfono (opcional)"
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
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          aria-label="Teléfono"
        />
        <input
          type="date"
          placeholder="Fecha de nacimiento (opcional)"
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
          value={fechaNacimiento}
          onChange={e => setFechaNacimiento(e.target.value)}
          aria-label="Fecha de nacimiento"
        />
        <select
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
          value={genero}
          onChange={e => setGenero(e.target.value)}
          aria-label="Género"
        >
          <option value="">Género (opcional)</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
          <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
        </select>
        <input
          type="text"
          placeholder="Institución (opcional)"
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
          value={institucion}
          onChange={e => setInstitucion(e.target.value)}
          aria-label="Institución"
        />
        <input
          type="text"
          placeholder="Grado académico (opcional)"
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
          value={gradoAcademico}
          onChange={e => setGradoAcademico(e.target.value)}
          aria-label="Grado académico"
        />
        <select
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
          value={rol}
          onChange={e => setRol(e.target.value)}
          aria-label="Rol"
        >
          <option value="">Rol (opcional)</option>
          <option value="estudiante">Estudiante</option>
          <option value="tutor">Tutor</option>
        </select>
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
          aria-label="Registrarse"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: loading ? 1 : 1.04 }}
        >
          <FaUserPlus style={{ fontSize: 22 }} />
          <span>{loading ? "Registrando..." : "Registrarse"}</span>
        </motion.button>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 0', borderRadius: 10, width: '100%', textAlign: 'center', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{error}</div>
        )}
        <div style={{ textAlign: 'center', fontSize: 15, color: '#6366f1', marginTop: 8 }}>
          ¿Ya tienes cuenta? <a href="/login" style={{ color: '#f472b6', fontWeight: 600, textDecoration: 'underline', marginLeft: 2 }}>Inicia sesión</a>
        </div>
      </motion.form>
    </div>
  );
} 