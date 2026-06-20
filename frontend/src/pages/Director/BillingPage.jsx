import React from 'react';
import { useTranslation } from 'react-i18next';
import PricingCards from '../../components/PricingCards';

export default function BillingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-amber-400 to-amber-500 p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 text-[#1E3A5F]">
          <h1 className="text-2xl font-extrabold font-outfit tracking-tight">
            {t('billing.title')}
          </h1>
          <p className="text-[#1E3A5F]/80 text-sm mt-1 font-bold">
            {t('billing.subtitle')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <PricingCards isPublic={false} />
      </div>
    </div>
  );
}
