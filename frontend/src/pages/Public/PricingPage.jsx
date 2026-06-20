import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import PricingCards from '../../components/PricingCards';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎓</span>
          <span className="font-extrabold text-[#1E3A5F] text-xl tracking-tight font-outfit">EduTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-[#1E3A5F] transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <div className="bg-gradient-to-b from-slate-900 to-[#1E3A5F] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 font-outfit">
            Digitalisez votre école aujourd'hui
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Le logiciel de gestion scolaire bilingue n°1 en Afrique. Simple, complet et abordable.
          </p>
        </div>
      </div>

      <PricingCards isPublic={true} />
    </div>
  );
}
