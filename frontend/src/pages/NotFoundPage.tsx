import React from "react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary text-white">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-2">Página no encontrada</p>
      <a href="/" className="text-primary underline">Volver al inicio</a>
    </div>
  );
} 