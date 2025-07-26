import React from 'react';
import TutorNavigation from './TutorNavigation';

interface TutorLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export default function TutorLayout({ children, showNavigation = true }: TutorLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 font-sans">
      <div className="flex h-screen">
        {/* Navegación lateral */}
        {showNavigation && (
          <div className="w-64 flex-shrink-0">
            <TutorNavigation />
          </div>
        )}
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 