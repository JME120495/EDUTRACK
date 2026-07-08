import React, { useState, useEffect } from 'react';
import { Loader2, ServerOff } from 'lucide-react';

// Hook personnalisé pour partager l'état du serveur
function useServerStatus() {
  const [status, setStatus] = useState('online');

  useEffect(() => {
    const handleWakingUp = () => setStatus('waking_up');
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');
    
    window.addEventListener('server_waking_up', handleWakingUp);
    window.addEventListener('server_online', handleOnline);
    window.addEventListener('server_offline', handleOffline);
    
    return () => {
      window.removeEventListener('server_waking_up', handleWakingUp);
      window.removeEventListener('server_online', handleOnline);
      window.removeEventListener('server_offline', handleOffline);
    };
  }, []);

  return status;
}

// 1. L'indicateur discret pour la barre de navigation
export function ServerStatusIndicator() {
  const status = useServerStatus();

  if (status === 'online') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 transition-all" title="Serveur en ligne">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hidden sm:inline-block">En ligne</span>
      </div>
    );
  }
  
  if (status === 'waking_up') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 transition-all" title="Réveil du serveur">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 hidden sm:inline-block">Réveil...</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 transition-all" title="Serveur hors ligne">
      <div className="w-2 h-2 rounded-full bg-red-500"></div>
      <span className="text-xs font-medium text-red-700 dark:text-red-400 hidden sm:inline-block">Hors ligne</span>
    </div>
  );
}

// 2. Le Loader global plein écran (Cold Start)
export function ColdStartLoader() {
  const status = useServerStatus();

  if (status === 'online') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center transform transition-all animate-in fade-in zoom-in duration-300">
        
        {status === 'waking_up' && (
          <>
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <Loader2 className="absolute inset-0 m-auto text-indigo-600 animate-pulse w-10 h-10" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Connexion au serveur...
            </h3>
            
            <div className="text-slate-600 dark:text-slate-300 text-sm space-y-4">
              <p>Le serveur principal est en cours de démarrage.</p>
              
              <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 text-xs font-medium shadow-sm">
                Cette opération peut prendre <strong>jusqu'à 60 secondes</strong> car l'application n'a pas été utilisée récemment.
              </div>
              
              <p className="animate-pulse text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                Veuillez patienter, reconnexion automatique...
              </p>
            </div>
            
            <div className="mt-8 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full w-full animate-pulse transition-all duration-1000 origin-left"></div>
            </div>
          </>
        )}

        {status === 'offline' && (
          <>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ServerOff className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Serveur Injoignable
            </h3>
            
            <div className="text-slate-600 dark:text-slate-300 text-sm space-y-3">
              <p>Impossible d'établir une connexion avec le serveur.</p>
              <p className="text-xs">Veuillez vérifier votre connexion internet ou réessayer plus tard.</p>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              Réessayer la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}
