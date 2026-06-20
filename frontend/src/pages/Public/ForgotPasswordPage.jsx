import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, KeyRound, CheckCircle2, AlertCircle, Globe, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword, updateLanguage } = useContext(AuthContext);
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Reset Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language.toUpperCase() === 'FR' ? 'EN' : 'FR';
    updateLanguage(nextLang);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setSuccess(`${response.message} (TEST DEV: Votre code est ${response.devCode})`);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Erreur lors de la demande de réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      setSuccess('Mot de passe réinitialisé avec succès ! Vous pouvez vous connecter.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs font-semibold text-white"
        >
          <Globe className="h-3.5 w-3.5 text-amber-400" />
          <span>{i18n.language.toUpperCase() === 'FR' ? '🇫🇷 FR' : '🇬🇧 EN'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <span className="text-4xl">🔐</span>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white font-outfit tracking-tight">
          Mot de passe oublié
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400 font-medium mb-4">
          Récupérez l'accès à votre compte EduTrack
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="backdrop-blur-md bg-white/10 border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl p-3 flex items-start gap-2.5 text-red-200 text-sm animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-950/50 border border-emerald-800 rounded-xl p-3 flex items-start gap-2.5 text-emerald-200 text-sm animate-in fade-in duration-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-5" onSubmit={handleRequestCode}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Votre adresse Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                >
                  {loading ? 'Recherche en cours...' : 'Recevoir le code'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Code de vérification (6 chiffres)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-mono transition-all text-center"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                >
                  {loading ? 'Validation...' : 'Réinitialiser le mot de passe'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-400 hover:text-white font-semibold flex items-center justify-center gap-1 w-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
