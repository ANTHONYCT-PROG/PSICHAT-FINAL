import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUniversalAccess, FaFont, FaEye, FaVolumeUp, FaKeyboard } from 'react-icons/fa';
import { useAppState } from '../hooks/useAppState';

interface AccessibilityMenuProps {
  className?: string;
}

export default function AccessibilityMenu({ className = '' }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { state, setTheme, setLanguage } = useAppState();
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast', !highContrast);
  };

  const toggleTheme = () => {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  };

  const accessibilityFeatures = [
    {
      id: 'font-size',
      icon: FaFont,
      label: 'Tamaño de fuente',
      controls: (
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseFontSize}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            aria-label="Reducir tamaño de fuente"
          >
            A-
          </button>
          <span className="text-sm font-medium w-8 text-center">{fontSize}px</span>
          <button
            onClick={increaseFontSize}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            aria-label="Aumentar tamaño de fuente"
          >
            A+
          </button>
        </div>
      )
    },
    {
      id: 'contrast',
      icon: FaEye,
      label: 'Alto contraste',
      controls: (
        <button
          onClick={toggleHighContrast}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            highContrast 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {highContrast ? 'Activado' : 'Desactivado'}
        </button>
      )
    },
    {
      id: 'theme',
      icon: FaEye,
      label: 'Tema',
      controls: (
        <button
          onClick={toggleTheme}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          {state.theme === 'light' ? 'Claro' : 'Oscuro'}
        </button>
      )
    },
    {
      id: 'language',
      icon: FaVolumeUp,
      label: 'Idioma',
      controls: (
        <select
          value={state.language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      )
    }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={toggleMenu}
        className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg"
        aria-label="Menú de accesibilidad"
        aria-expanded={isOpen}
      >
        <FaUniversalAccess size={20} />
      </button>

      {/* Menú desplegable */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={toggleMenu}
            />
            
            {/* Menú */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                <FaUniversalAccess className="text-indigo-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Accesibilidad
                </h3>
              </div>

              <div className="space-y-4">
                {accessibilityFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="text-gray-500" size={16} />
                        <span className="text-sm font-medium text-gray-700">
                          {feature.label}
                        </span>
                      </div>
                      {feature.controls}
                    </div>
                  );
                })}
              </div>

              {/* Atajos de teclado */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FaKeyboard size={14} />
                  Atajos de teclado
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><kbd className="bg-gray-100 px-1 rounded">Ctrl</kbd> + <kbd className="bg-gray-100 px-1 rounded">+</kbd> Aumentar fuente</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Ctrl</kbd> + <kbd className="bg-gray-100 px-1 rounded">-</kbd> Reducir fuente</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Ctrl</kbd> + <kbd className="bg-gray-100 px-1 rounded">T</kbd> Cambiar tema</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 