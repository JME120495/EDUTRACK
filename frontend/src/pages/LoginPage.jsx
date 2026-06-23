import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../api';
import { Shield, Phone, Mail, Lock, CheckCircle2, AlertCircle, Globe } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loginParentOtp, updateLanguage } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'PARENT') navigate('/parent');
      else if (user.role === 'STUDENT') navigate('/student');
      else if (user.role === 'TEACHER') navigate('/teacher/dashboard');
      else if (user.role === 'CENSEUR') navigate('/censeur/dashboard');
      else if (user.role === 'INTENDANT') navigate('/intendant/dashboard');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'parent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [availableSchools, setAvailableSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
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

    if (!navigator.onLine) {
      setError(i18n.language.toUpperCase() === 'EN' ? 'No internet connection. Cannot login offline.' : 'Pas de connexion internet. Impossible de se connecter hors ligne.');
      return;
    }

    // Require school selection if multiple schools are available
    if (availableSchools.length > 1 && !selectedSchoolId && activeTab === 'staff') {
      setError('Veuillez sélectionner une école.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password, selectedSchoolId || null);
      
      if (result && result.action === 'SELECT_SCHOOL') {
        setAvailableSchools(result.schools);
        if (result.schools && result.schools.length > 0) {
          setSelectedSchoolId(result.schools[0].id);
        }
        setSuccess('Veuillez sélectionner une école pour continuer.');
      } else {
        const user = result;
        setSuccess('Login successful!');
        setSuccess('Login successful!');
        if (user.role === 'PARENT') {
          navigate('/parent');
        } else if (user.role === 'STUDENT') {
          navigate('/student');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!navigator.onLine) {
      setError(i18n.language.toUpperCase() === 'EN' ? 'No internet connection.' : 'Pas de connexion internet.');
      return;
    }

    if (!phone) {
      setError('Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch('/auth/parent/request-otp', {
        method: 'POST',
        body: { phone }
      });
      setOtpSent(true);

      // Store available schools for selection
      if (response.schools && response.schools.length > 0) {
        setAvailableSchools(response.schools);
        if (response.schools.length === 1) {
          setSelectedSchoolId(response.schools[0].id);
        }
      }
      
      if (response.devCode) {
        setSuccess(`${t('auth.otpSent')} (Dev Code: ${response.devCode})`);
      } else {
        setSuccess(t('auth.otpSent'));
      }
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

    if (!navigator.onLine) {
      setError(i18n.language.toUpperCase() === 'EN' ? 'No internet connection.' : 'Pas de connexion internet.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginParentOtp(phone, otpCode, selectedSchoolId || null);
      setSuccess('Login successful!');
      navigate('/parent');
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
        <p className="mt-1 text-center text-sm text-slate-400 font-medium mb-4">
          {t('auth.subtitle')}
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 border border-amber-400/20 px-4 py-2 rounded-full text-xs font-bold hover:bg-amber-400/20 transition-colors"
        >
          {i18n.language.toUpperCase() === 'EN' ? 'View pricing and offers' : 'Voir nos tarifs et offres'}
        </button>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
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

              {availableSchools && availableSchools.length > 1 && activeTab === 'staff' && (
                <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {i18n.language.toUpperCase() === 'EN' ? 'Select institution' : 'Sélectionnez l\'établissement'}
                  </label>
                  <select
                    required
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                  >
                    <option value="">{i18n.language.toUpperCase() === 'EN' ? '-- Choose a school --' : '-- Choisir une école --'}</option>
                    {availableSchools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-[#1E3A5F] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                >
                  {loading ? '...' : t('auth.loginBtn')}
                </button>
              </div>
              <div className="mt-4 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-slate-400 hover:text-white font-medium transition-colors"
                >
                  {i18n.language.toUpperCase() === 'EN' ? 'Forgot password?' : 'Mot de passe oublié ?'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm text-amber-400 hover:text-amber-300 font-semibold"
                >
                  {i18n.language.toUpperCase() === 'EN' ? "Don't have an account? Register your school" : "Vous n'avez pas de compte ? Inscrire mon école"}
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
                  {availableSchools && availableSchools.length > 1 && (
                    <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        {i18n.language.toUpperCase() === 'EN' ? "Select the child's school" : "Sélectionnez l'école de l'enfant"}
                      </label>
                      <select
                        required
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                      >
                        <option value="">{i18n.language.toUpperCase() === 'EN' ? '-- Choose a school --' : '-- Choisir une école --'}</option>
                        {availableSchools.map(school => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all tracking-widest text-center"
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
