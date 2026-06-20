import React, { useState, useContext, useEffect } from 'react';
import { CheckCircle2, Star, Sparkles, Phone, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function PricingCards({ isPublic = false }) {
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  const [selectedPlan, setSelectedPlan] = useState('Standard');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPublic && user && user.subscriptionPlan) {
      const planMap = {
        'ESSENTIAL': 'Essentiel',
        'STANDARD': 'Standard',
        'PREMIUM': 'Premium',
        'CUSTOM': 'Custom'
      };
      setSelectedPlan(planMap[user.subscriptionPlan] || 'Standard');
    }
  }, [isPublic, user]);

  const handleChangePlan = async (planName, dbPlan) => {
    if (isPublic) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir passer au forfait ${planName} ?`)) return;
    
    setLoading(true);
    try {
      const result = await apiFetch('/schools/plan', {
        method: 'PUT',
        body: { plan: dbPlan }
      });
      
      if (result.token) {
        localStorage.setItem('edutrack_token', result.token);
      }

      setSelectedPlan(planName);
      alert(`Forfait mis à jour avec succès vers ${planName} !`);
      window.location.reload(); // Reload to update UI completely
    } catch (err) {
      alert("Erreur lors du changement de forfait: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-extrabold font-outfit text-[#1E3A5F] sm:text-4xl">
          {t('billing.chooseOffer')}
        </h2>
        <p className="mt-4 text-lg text-slate-500 font-medium">
          {t('billing.pricingDesc')}
        </p>
        
        {/* Commercial Trick & Demo Banner */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
            <Zap className="h-4 w-4" />
            {t('billing.demoBanner')}
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
            <Sparkles className="h-4 w-4" />
            {t('billing.specialOffer')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 items-stretch">
        
        {/* Pack Essentiel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col relative transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800">{t('billing.packs.essential.name')}</h3>
            <p className="text-slate-500 text-sm mt-2">{t('billing.packs.essential.desc')}</p>
          </div>
          <div className="mb-6 flex items-baseline text-[#1E3A5F]">
            <span className="text-4xl font-extrabold tracking-tight">25 000</span>
            <span className="ml-1 text-xl font-semibold">FCFA</span>
            <span className="text-slate-500 ml-2">{t('billing.month')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-600">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.essential.f1')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.essential.f2')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.essential.f3')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.essential.f4')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.essential.f5')}</li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handleChangePlan('Essentiel', 'ESSENTIAL')}
            className={`w-full font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 ${
              !isPublic && selectedPlan === 'Essentiel' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-400 shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}>
            {isPublic ? t('billing.btnContact') : (selectedPlan === 'Essentiel' ? t('billing.btnCurrentPlan') : t('billing.btnChangePlan'))}
          </button>
        </div>

        {/* Pack Standard */}
        <div className="bg-[#1E3A5F] rounded-3xl shadow-xl p-8 flex flex-col relative transform lg:-translate-y-4 border-2 border-amber-400">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="bg-amber-400 text-[#1E3A5F] text-xs font-black uppercase tracking-widest py-1 px-3 rounded-full flex items-center gap-1 shadow-md">
              <Star className="h-3 w-3" /> {t('billing.packs.standard.popular')}
            </span>
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">{t('billing.packs.standard.name')}</h3>
            <p className="text-blue-200 text-sm mt-2">{t('billing.packs.standard.desc')}</p>
          </div>
          <div className="mb-6 flex items-baseline text-white">
            <span className="text-4xl font-extrabold tracking-tight">54 000</span>
            <span className="ml-1 text-xl font-semibold text-amber-400">FCFA</span>
            <span className="text-blue-200 ml-2">{t('billing.month')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-blue-100">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" /> {t('billing.packs.standard.f1')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" /> {t('billing.packs.standard.f2')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" /> {t('billing.packs.standard.f3')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" /> {t('billing.packs.standard.f4')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" /> {t('billing.packs.standard.f5')}</li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handleChangePlan('Standard', 'STANDARD')}
            className={`w-full font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 ${
              !isPublic && selectedPlan === 'Standard'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-amber-400 hover:bg-amber-500 text-[#1E3A5F]'
            }`}>
            {isPublic ? t('billing.btnStartTrial') : (selectedPlan === 'Standard' ? t('billing.btnCurrentPlan') : t('billing.btnChangePlan'))}
          </button>
        </div>

        {/* Pack Premium */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col relative transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800">{t('billing.packs.premium.name')}</h3>
            <p className="text-slate-500 text-sm mt-2">{t('billing.packs.premium.desc')}</p>
          </div>
          <div className="mb-6 flex items-baseline text-[#1E3A5F]">
            <span className="text-4xl font-extrabold tracking-tight">99 000</span>
            <span className="ml-1 text-xl font-semibold">FCFA</span>
            <span className="text-slate-500 ml-2">{t('billing.month')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-600">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.premium.f1')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.premium.f2')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.premium.f3')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.premium.f4')}</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {t('billing.packs.premium.f5')}</li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handleChangePlan('Premium', 'PREMIUM')}
            className={`w-full font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 ${
              !isPublic && selectedPlan === 'Premium'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-400 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}>
            {isPublic ? t('billing.btnUpgrade') : (selectedPlan === 'Premium' ? t('billing.btnCurrentPlan') : t('billing.btnChangePlan'))}
          </button>
        </div>

        {/* Pack Sur Mesure */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-sm p-8 flex flex-col relative transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">{t('billing.packs.custom.name')}</h3>
            <p className="text-slate-400 text-sm mt-2">{t('billing.packs.custom.desc')}</p>
          </div>
          <div className="mb-6 flex items-baseline text-white">
            <span className="text-3xl font-extrabold tracking-tight">{t('billing.packs.custom.price')}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
            <li className="flex gap-3"><Shield className="h-5 w-5 text-blue-400 shrink-0" /> {t('billing.packs.custom.f1')}</li>
            <li className="flex gap-3"><Shield className="h-5 w-5 text-blue-400 shrink-0" /> {t('billing.packs.custom.f2')}</li>
            <li className="flex gap-3"><Shield className="h-5 w-5 text-blue-400 shrink-0" /> {t('billing.packs.custom.f3')}</li>
            <li className="flex gap-3"><Shield className="h-5 w-5 text-blue-400 shrink-0" /> {t('billing.packs.custom.f4')}</li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handleChangePlan('Custom', 'CUSTOM')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg disabled:opacity-50">
            {isPublic ? t('billing.btnContactSales') : (selectedPlan === 'Custom' ? t('billing.btnCurrentPlan') : t('billing.btnChangePlan'))}
          </button>
        </div>

      </div>
      
      {/* Footer / Info */}
      <div className="mt-12 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
        <p dangerouslySetInnerHTML={{ __html: t('billing.footerSetup') }} />
        <p className="flex items-center gap-1 mt-2">
          <Phone className="h-4 w-4" /> 
          <span dangerouslySetInnerHTML={{ __html: t('billing.footerHelp') }} />
        </p>
      </div>
    </div>
  );
}
