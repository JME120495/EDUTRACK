import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Écouter l'événement standard d'installation PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détecter si on est sur iOS Safari pour afficher un message spécifique
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Détecter si on est déjà en mode standalone
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIos() && !isInStandaloneMode()) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (!deferredPrompt && !showIosPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 z-[100] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🎓</span>
        </div>
        <div>
          <h4 className="text-white font-bold">{i18n.language === 'fr' ? 'Installer EduTrack' : 'Install EduTrack'}</h4>
          <p className="text-slate-400 text-sm">
            {showIosPrompt && !deferredPrompt 
              ? (i18n.language === 'fr' ? 'Appuyez sur "Partager" puis "Sur l\'écran d\'accueil"' : 'Tap "Share" then "Add to Home Screen"') 
              : (i18n.language === 'fr' ? 'Ajoutez l\'application sur votre écran d\'accueil pour un accès rapide.' : 'Add the app to your home screen for quick access.')
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none bg-amber-500 text-slate-900 px-6 py-2.5 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {i18n.language === 'fr' ? 'Installer' : 'Install'}
          </button>
        )}
        <button 
          onClick={() => { setDeferredPrompt(null); setShowIosPrompt(false); }}
          className="p-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
