import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeOverlay({ title, description, requiredPlan }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative shadow-inner border border-slate-100">
        <Lock className="h-10 w-10 text-slate-400" />
        <div className="absolute -bottom-1 -right-1 bg-amber-400 p-1.5 rounded-full shadow-sm text-[#1E3A5F]">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <h2 className="text-3xl font-extrabold text-[#1E3A5F] font-outfit mb-4">
        {title || 'Mise à niveau requise'}
      </h2>
      <p className="text-slate-500 max-w-md mb-8 font-medium">
        {description || 'Cette fonctionnalité n\'est pas incluse dans votre abonnement actuel.'}
        <br/><br/>
        <span className="inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">
          Requis : Pack {requiredPlan || 'Supérieur'}
        </span>
      </p>

      <button
        onClick={() => navigate('/billing')}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#1E3A5F] font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
      >
        Découvrir nos offres
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
