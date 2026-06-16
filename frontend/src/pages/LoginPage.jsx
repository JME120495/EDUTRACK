import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../api';
import { Shield, Phone, Mail, Lock, CheckCircle2, AlertCircle, Globe } from 'lucide-react';

export default function LoginPage() {
  const { login, loginParentOtp, updateLanguage } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'parent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleLanguage = () => {
    const nextLang = i18n.language.toUpperCase() === 'FR' ? 'EN' : 'FR';
    updateLanguage(nextLang);
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = await login(email, password);
      setSuccess('Login successful!');
      setTimeout(() => {
        if (user.role === 'PARENT') {
          navigate('/parent');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (err) {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!phone) {
      setError('Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/parent/request-otp', {
        method: 'POST',
        body: { phone }
      });
      setOtpSent(true);
      setSuccess(t('auth.otpSent') + ' (Mock OTP: 123456)');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = await loginParentOtp(phone, otpCode);
      setSuccess('Login successful!');
      setTimeout(() => {
        navigate('/parent');
      }, 800);
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Language switcher top right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs font-semibold text-white"
        >
          <Globe className="h-3.5 w-3.5 text-amber-400" />
          <span>{i18n.language.toUpperCase() === 'FR' ? '🇫🇷 FR' : '🇬🇧 EN'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <span className="text-4xl">🎓</span>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-white font-outfit tracking-tight">
          EduTrack
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400 font-medium">
          {t('auth.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="backdrop-blur-md bg-white/10 border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          
          {/* Tab Selector */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => {
                setActiveTab('staff');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'staff'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.staffLoginTab')}
            </button>
            <button
              onClick={() => {
                setActiveTab('parent');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'parent'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('auth.parentLoginTab')}
            </button>
          </div>

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

          {activeTab === 'staff' ? (
            <form className="space-y-5" onSubmit={handleStaffLogin}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all font-semibold"
                    placeholder="email@example.com ou +237..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                >
                  {loading ? '...' : t('auth.loginBtn')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {t('auth.phone')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                        placeholder="+237670000001"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                  >
                    {loading ? '...' : t('auth.requestOtp')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {t('auth.enterOtp')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                        placeholder="123456"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 py-2.5 px-4 border border-slate-700 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                    >
                      {loading ? '...' : t('auth.verifyOtp')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
