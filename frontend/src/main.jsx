import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './i18n';
import './index.css';
import { startCacheBuster } from './utils/cacheBuster';
import { syncService } from './utils/SyncService';

// Démarrer le nettoyage automatique des caches en arrière-plan
startCacheBuster();

// Initialiser le service de synchronisation hors-ligne
syncService.init();
// En mode développement, on désenregistre les éventuels Service Workers (PWA) 
// qui pourraient bloquer le rechargement automatique (HMR) sur mobile.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
