import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 Starting AethergenPlatform App...');

const container = document.getElementById('root');

if (!container) {
  console.error('Root element not found');
} else {
  console.log('✅ Root element found, creating React app...');
  
  try {
    const root = createRoot(container);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ AethergenPlatform App rendered successfully');
  } catch (error) {
    console.error('Failed to render AethergenPlatform app:', error);
    
    container.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        background: #f3f4f6;
        font-family: Inter, sans-serif;
        color: #6b7280;
        padding: 2rem;
      ">
        <div style="text-align: center; max-width: 500px;">
          <h1 style="color: #dc2626; margin-bottom: 16px; font-size: 24px;">AethergenPlatform Application Error</h1>
          <p style="margin-bottom: 16px;">Failed to load AethergenPlatform App. Please refresh the page.</p>
          <p style="font-size: 14px; color: #9ca3af;">Error: ${error.message}</p>
        </div>
      </div>
    `;
  }
}