import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../stores/authStore";
import { dashboardService } from "../services/api";

const campos = [
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "apellido", label: "Apellido", type: "text" },
  { key: "telefono", label: "Teléfono", type: "text" },
  { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
  { key: "genero", label: "Género", type: "text" },
  { key: "institucion", label: "Institución", type: "text" },
  { key: "grado_academico", label: "Grado académico", type: "text" },
];

function formatDateTime(date) {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "-";
  }
}

function getInitials(nombre = "", apellido = "") {
  const n = typeof nombre === "string" ? nombre : "";
  const a = typeof apellido === "string" ? apellido : "";
  if (!n && !a) return "👤";
  return (n[0] || "") + (a[0] || "");
}

const AVATAR_KEY = "psichat_avatar";

const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user) || {};
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<any>({ ...user });
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dashboardService.getStats().then(setStats).finally(() => setStatsLoading(false));
    const saved = localStorage.getItem(AVATAR_KEY + (user?.id || ""));
    if (saved) setAvatar(saved);
  }, [user?.id]);

  if (!user || !user.email) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <h2>Debes iniciar sesión para ver tu perfil.</h2>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      const data = { ...form };
      if (data.fecha_nacimiento && typeof data.fecha_nacimiento === "string") {
        data.fecha_nacimiento = new Date(data.fecha_nacimiento);
      }
      await updateProfile(data);
      setEdit(false);
      setSuccess(true);
    } catch {}
  };

  // Avatar
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      localStorage.setItem(AVATAR_KEY + user.id, reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveAvatar = () => {
    setAvatar(null);
    localStorage.removeItem(AVATAR_KEY + user.id);
  };

  // Estado visual y colores
  const estado = user.estado || "-";
  const estadoColor = estado === "activo" ? "#22c55e" : estado === "inactivo" ? "#f59e42" : estado === "suspendido" ? "#ef4444" : "#888";
  const rolColor = user.rol === "tutor" ? "#0ea5e9" : user.rol === "admin" ? "#f59e42" : "#6366f1";
  const avatarBorder = `4px solid ${estadoColor}`;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)', padding: '40px 0' }}>
      <div style={{ maxWidth: 700, margin: "0 auto", background: "#fff8", borderRadius: 28, boxShadow: "0 8px 40px #0002", padding: 40, position: 'relative', transition: 'box-shadow 0.3s', animation: 'fadeIn 0.7s' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 8 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: '#f3f4f6',
                border: avatarBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                fontWeight: 700,
                color: '#6366f1',
                overflow: 'hidden',
                boxShadow: '0 2px 12px #0001',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onClick={handleAvatarClick}
              title="Cambiar foto de perfil"
            >
              {avatar ? (
                <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{getInitials(user.nombre, user.apellido)}</span>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              {/* Botón de eliminar foto */}
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    boxShadow: '0 1px 4px #0002',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#ef4444',
                  }}
                  title="Eliminar foto"
                >
                  ✕
                </button>
              )}
              {/* Botón de editar foto */}
              <button
                type="button"
                onClick={handleAvatarClick}
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  boxShadow: '0 1px 4px #0002',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#fff',
                }}
                title="Cambiar foto"
              >
                <span role="img" aria-label="cámara">📷</span>
              </button>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, color: '#222', marginBottom: 2 }}>{user.nombre || 'Usuario'}</div>
          <div style={{ fontSize: 15, color: '#888' }}>{user.email}</div>
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18, textAlign: 'center', letterSpacing: 1 }}>Mi Perfil</h1>
        {/* Estadísticas personales */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(90deg,#e0e7ff,#f0fdfa)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ fontSize: 15, color: '#6366f1', fontWeight: 600 }}>Conversaciones</div>
            <div style={{ fontWeight: 700, fontSize: 26 }}>{statsLoading ? '...' : stats?.totalChats ?? '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(90deg,#f0fdfa,#e0e7ff)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ fontSize: 15, color: '#0ea5e9', fontWeight: 600 }}>Mensajes</div>
            <div style={{ fontWeight: 700, fontSize: 26 }}>{statsLoading ? '...' : stats?.totalMessages ?? '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(90deg,#fef9c3,#e0e7ff)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ fontSize: 15, color: '#f59e42', fontWeight: 600 }}>Alertas</div>
            <div style={{ fontWeight: 700, fontSize: 26 }}>{statsLoading ? '...' : stats?.alerts ?? '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(90deg,#e0e7ff,#f0fdfa)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ fontSize: 15, color: '#22c55e', fontWeight: 600 }}>Progreso</div>
            <div style={{ fontWeight: 700, fontSize: 26 }}>{statsLoading ? '...' : (stats?.learningProgress ?? '-') + '%'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(90deg,#f0fdfa,#e0e7ff)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ fontSize: 15, color: '#ef4444', fontWeight: 600 }}>Emoción promedio</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{statsLoading ? '...' : stats?.avgEmotion ?? '-'}</div>
          </div>
        </div>
        {/* Resumen visual */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 180, background: '#f3f4f6', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Estado</div>
            <div style={{ color: estadoColor, fontWeight: 700, fontSize: 20, marginTop: 4, textTransform: 'capitalize' }}>{estado}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#f3f4f6', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Rol</div>
            <div style={{ color: rolColor, fontWeight: 700, fontSize: 20, marginTop: 4, textTransform: 'capitalize' }}>{user.rol || '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#f3f4f6', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Último acceso</div>
            <div style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 18, marginTop: 4 }}>{formatDateTime(user.ultimo_acceso)}</div>
          </div>
        </div>
        {/* Fechas importantes */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 180, background: '#f9fafb', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#888' }}>Creado en</div>
            <div style={{ fontWeight: 600 }}>{formatDateTime(user.creado_en)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: '#f9fafb', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#888' }}>Actualizado en</div>
            <div style={{ fontWeight: 600 }}>{formatDateTime(user.actualizado_en)}</div>
          </div>
        </div>
        {/* Formulario de edición */}
        <form onSubmit={handleSubmit}>
          {campos.map((campo) => (
            <div key={campo.key} style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>{campo.label}:</label>
              {edit ? (
                <input
                  type={campo.type}
                  name={campo.key}
                  value={form?.[campo.key] || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }}
                  disabled={loading}
                />
              ) : (
                <span style={{ marginLeft: 8, color: form?.[campo.key] ? '#222' : '#888' }}>
                  {form?.[campo.key] || <i>(Sin dato)</i>}
                </span>
              )}
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 500 }}>Email:</label>
            <span style={{ marginLeft: 8 }}>{user.email}</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 500 }}>Configuraciones:</label>
            <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 13, color: '#6366f1' }}>{user.configuraciones ? JSON.stringify(user.configuraciones) : <i>(Sin configuraciones)</i>}</span>
          </div>
          {edit ? (
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={loading} style={{ padding: "8px 20px", borderRadius: 8, background: "#6f4ef2", color: "#fff", border: 0, fontWeight: 600, boxShadow: '0 2px 8px #0001' }}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => { setEdit(false); setForm(user); }} style={{ padding: "8px 20px", borderRadius: 8, background: "#eee", color: "#333", border: 0, fontWeight: 600 }}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEdit(true)} style={{ padding: "8px 20px", borderRadius: 8, background: "#6f4ef2", color: "#fff", border: 0, fontWeight: 600, boxShadow: '0 2px 8px #0001' }}>
              Editar Perfil
            </button>
          )}
          {success && <div style={{ color: 'green', marginTop: 12 }}>¡Perfil actualizado correctamente!</div>}
          {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage; 