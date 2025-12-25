// src/App.tsx
import React from 'react';
import AppRouter from './router/AppRouter';
import './App.css';

// 🎯 Componente principal de la aplicación
function App() {
  return (
    <div className="App">
      {/* 🛣️ Sistema de rutas centralizado */}
      <AppRouter />
    </div>
  );
}

export default App;