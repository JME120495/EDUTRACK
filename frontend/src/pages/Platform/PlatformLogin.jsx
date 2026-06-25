import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';

export default function PlatformLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/platform/login', {
        method: 'POST',
        body: { email, password }
      });

      localStorage.setItem('platform_token', data.token);
      localStorage.setItem('platform_user', JSON.stringify(data.user));

      if (data.user.role === 'SUPER_ADMIN') {
        navigate('/platform/admin');
      } else if (data.user.role === 'INFLUENCER') {
        navigate('/platform/influencer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#112240] flex items-center justify-center p-4 font-inter relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 font-outfit">
              Platform Portal
            </h1>
            <p className="text-blue-200 text-sm">
              Espace d'administration globale et partenaires.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-start text-red-200 shadow-inner">
              <AlertCircle className="h-5 w-5 mr-3 shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5 ml-1">
                Adresse Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300 group-focus-within:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/10 transition-all text-sm"
                  placeholder="admin@edutrack.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-1.5 ml-1">
                Mot de passe
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300 group-focus-within:text-white transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/10 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:ring-offset-[#1E3A5F] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-8"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
