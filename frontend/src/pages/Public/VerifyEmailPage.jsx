import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../../api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Jeton de vérification manquant dans l\'URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        const data = await apiFetch('/auth/verify-email', {
          method: 'POST',
          body: { token }
        });
        setStatus('success');
        setMessage(data.message || 'Votre adresse e-mail a été confirmée avec succès.');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Le lien de vérification est invalide ou a expiré.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700 text-center">
        
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Vérification en cours...</h2>
            <p className="text-slate-400 text-sm">Veuillez patienter pendant que nous validons votre adresse e-mail.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">E-mail Vérifié !</h2>
            <p className="text-slate-300 mb-8">{message}</p>
            <Link to="/login" className="inline-block bg-amber-500 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors w-full">
              Se Connecter
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Échec de la vérification</h2>
            <p className="text-slate-300 mb-8">{message}</p>
            <Link to="/login" className="inline-block bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors w-full">
              Retour à l'accueil
            </Link>
          </div>
        )}
        
      </div>
    </div>
  );
}
