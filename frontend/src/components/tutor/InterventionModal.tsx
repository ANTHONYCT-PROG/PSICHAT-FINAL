import React, { useState } from 'react';
import { X, Send, User, MessageSquare } from 'lucide-react';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentEmail: string;
  onSendIntervention: (message: string) => void;
  loading?: boolean;
}

const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentEmail,
  onSendIntervention,
  loading = false
}) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    {
      id: 'greeting',
      title: 'Saludo amigable',
      message: 'Hola, ¿cómo te sientes hoy? Quiero saber cómo estás.'
    },
    {
      id: 'support',
      title: 'Ofrecer apoyo',
      message: 'Hola, he notado que podrías estar pasando por un momento difícil. ¿Te gustaría hablar sobre ello? Estoy aquí para ayudarte.'
    },
    {
      id: 'check',
      title: 'Verificar estado',
      message: 'Hola, ¿todo bien? Si necesitas algo, no dudes en decírmelo.'
    },
    {
      id: 'encourage',
      title: 'Motivación',
      message: 'Hola, recuerda que eres capaz de superar cualquier desafío. ¿Cómo puedo ayudarte hoy?'
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.message);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendIntervention(message.trim());
      setMessage('');
      setSelectedTemplate('');
    }
  };

  const handleClose = () => {
    setMessage('');
    setSelectedTemplate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                Enviar Intervención
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Comunicarse con el estudiante
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: 8,
              borderRadius: 8,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Student Info */}
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1'
            }}>
              <User size={16} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', margin: '0 0 2px 0' }}>
                {studentName}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                {studentEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
            Plantillas de mensaje:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                style={{
                  background: selectedTemplate === template.id 
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                    : 'rgba(255,255,255,0.8)',
                  color: selectedTemplate === template.id ? 'white' : '#374151',
                  border: `1px solid ${selectedTemplate === template.id ? 'transparent' : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                {template.title}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'block' }}>
            Mensaje:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje de intervención..."
            style={{
              width: '100%',
              minHeight: 120,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
              fontSize: 14,
              fontFamily: 'Poppins, sans-serif',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.8)',
              color: '#6b7280',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            style={{
              background: message.trim() && !loading 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'rgba(255,255,255,0.5)',
              color: message.trim() && !loading ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              cursor: message.trim() && !loading ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (message.trim() && !loading) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (message.trim() && !loading) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <Send size={16} />
            {loading ? 'Enviando...' : 'Enviar Intervención'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default InterventionModal; 