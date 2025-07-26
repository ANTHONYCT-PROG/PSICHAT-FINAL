const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function sendMessage(token: string, user_text: string, history: {user: string, bot: string}[]) {
  const res = await fetch(`${API_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ user_text, history }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error(data.detail || "Error al enviar mensaje");
  }
  return await res.json();
}

export async function getChatHistory(token: string) {
  const res = await fetch(`${API_URL}/chat/history`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error(data.detail || "Error al obtener historial");
  }
  return await res.json();
}

export async function getUnreadMessages(token: string) {
  const res = await fetch(`${API_URL}/chat/unread`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error("TOKEN_EXPIRED");
    }
    throw new Error(data.detail || "Error al obtener mensajes no leídos");
  }
  return await res.json();
} 