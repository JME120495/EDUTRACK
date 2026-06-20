import React, { useContext, useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Lock, CreditCard, ShieldAlert, CheckCircle, Smartphone } from 'lucide-react';

export default function Layout() {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // School Subscription States
  const [school, setSchool] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadBillingStatus();
    }
  }, [isAuthenticated]);

  const loadBillingStatus = async () => {
    try {
      setSchoolLoading(true);
      const [schoolData, elevesData] = await Promise.all([
        apiFetch('/schools'),
        apiFetch('/eleves').catch(() => [])
      ]);
      setSchool(schoolData);
      setStudentsCount(elevesData.length);
    } catch (e) {
      console.error('Failed to load billing status in Layout:', e);
    } finally {
      setSchoolLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      const res = await apiFetch('/schools/pay-subscription', {
        method: 'POST',
        body: { months: isAnnual ? 12 : 1 }
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        setSchool(prev => ({
          ...prev,
          subscriptionExpiresAt: res.subscriptionExpiresAt
        }));
        setPaymentSuccess(false);
      }, 2000);
    } catch (err) {
      alert(err.message || 'Simulated payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading || (isAuthenticated && schoolLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1E3A5F]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Calculate Subscription Locks
  const now = new Date();
  const schoolCreatedAt = school ? new Date(school.createdAt) : now;
  // Trial: 2 months = 60 days
  const trialExpiry = new Date(schoolCreatedAt.getTime() + 60 * 24 * 60 * 60 * 1000);
  const isTrialActive = now < trialExpiry;

  const subscriptionExpiresAt = school?.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt) : null;
  const isSubscriptionActive = subscriptionExpiresAt && now < subscriptionExpiresAt;

  const isLocked = !isTrialActive && !isSubscriptionActive;

  // Calculate dynamic price
  const getPricing = (count) => {
    if (count <= 300) return { name: 'Essentiel', monthly: '25 000 FCFA', annual: '250 000 FCFA', range: '0 à 300 élèves' };
    if (count <= 800) return { name: 'Pro', monthly: '54 000 FCFA', annual: '540 000 FCFA', range: '301 à 800 élèves' };
    if (count <= 2000) return { name: 'Premium', monthly: '99 000 FCFA', annual: '990 000 FCFA', range: '801 à 2 000 élèves' };
    return { name: 'Entreprise', monthly: 'Sur Devis', annual: 'Sur Devis', range: 'Plus de 2 000 élèves' };
  };
  const pricing = getPricing(studentsCount);

  // If subscription is locked, show the paywall screen
  if (isLocked) {
    const isDirector = user?.role === 'DIRECTOR';
    
    if (!isDirector) {
      // Show generic maintenance page for Teachers and Parents to hide school financial status
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-slate-900 to-indigo-900/20 pointer-events-none" />
          <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-8 text-center text-white space-y-4 relative z-10 animate-in fade-in duration-300">
            <div className="mx-auto h-16 w-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-outfit text-white tracking-wide">
                Portail Temporairement Indisponible
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Le portail est actuellement en cours de maintenance technique ou de mise à jour par l'administration de l'établissement.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Veuillez réessayer ultérieurement ou contacter le secrétariat de l'école pour toute assistance.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise, render full paywall for Director
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-slate-900 to-indigo-900/20 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-6 text-center text-white space-y-6 relative z-10">
          <div className="mx-auto h-16 w-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-outfit text-white tracking-wide">
              Licence Suspendue / Suspended
            </h2>
            <p className="text-xs text-slate-300 font-medium px-4 leading-relaxed">
              Votre période d'essai de 2 mois est expirée. L'accès à la plateforme **EduTrack** nécessite un abonnement mensuel actif.
            </p>
          </div>

          {/* Pricing Tiers summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Votre Formule SaaS</span>
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-md text-[9px] uppercase tracking-wider">
                Pack {pricing.name}
              </span>
            </div>

            {/* Toggle Mensuel / Annuel */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-xs text-slate-400 font-medium">Fréquence de paiement :</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Mensuel</span>
                <button 
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="relative inline-flex h-5 w-10 items-center rounded-full bg-slate-700 transition-colors focus:outline-none"
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-amber-500 transition-transform ${isAnnual ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className={`text-[10px] font-bold uppercase ${isAnnual ? 'text-white' : 'text-slate-500'}`}>Annuel</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Élèves enregistrés :</span>
                <span className="font-bold">{studentsCount} élèves</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Tarif {isAnnual ? 'annuel' : 'mensuel'} :</span>
                <span className="font-black text-[#F5A623]">{isAnnual ? pricing.annual : pricing.monthly} / {isAnnual ? 'an' : 'mois'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {paymentSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
                <CheckCircle className="h-5 w-5" />
                <span>Paiement Validé ! Activation d'EduTrack...</span>
              </div>
            ) : (
              <>
                <div className="text-left space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payer via Mobile Money / Carte :</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2 text-[10px] font-bold cursor-pointer hover:bg-white/10 transition-colors">
                      <Smartphone className="h-4 w-4 text-amber-400" />
                      <span>Orange / MTN</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2 text-[10px] font-bold cursor-pointer hover:bg-white/10 transition-colors">
                      <CreditCard className="h-4 w-4 text-amber-400" />
                      <span>Wave / Carte</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  disabled={paying}
                  className="w-full py-3 bg-[#F5A623] hover:bg-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50"
                >
                  {paying ? 'Traitement en cours...' : `Activer ma licence (${isAnnual ? pricing.annual : pricing.monthly})`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 relative">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Display Trial period alert banner at top of dashboard if active (Director only) */}
            {isTrialActive && user?.role === 'DIRECTOR' && (
              <div className="p-3 bg-amber-50 border border-amber-250 text-amber-900 rounded-2xl flex items-center justify-between text-xs shadow-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <span>
                    Version d'essai active : il vous reste {Math.ceil((trialExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} jours de gratuité !
                  </span>
                </div>
                {user?.role === 'DIRECTOR' && (
                  <button
                    onClick={handleSimulatePayment}
                    className="px-3 py-1 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-lg text-[10px] font-bold uppercase transition-colors"
                  >
                    Activer l'abonnement
                  </button>
                )}
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
