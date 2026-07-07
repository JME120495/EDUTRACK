import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { 
  ShieldCheck, Users, GraduationCap, Gavel, 
  Wallet, Briefcase, MessageSquare, BookOpen, 
  WifiOff, Star, ChevronDown, MessageCircle, Facebook, Download, Apple, Monitor, CheckCircle2, Smartphone, Globe, Truck
} from 'lucide-react';
import PwaInstallPrompt from '../../components/PwaInstallPrompt';

export default function LandingPage() {
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const isFr = i18n.language ? i18n.language.toLowerCase().startsWith('fr') : true;

  const toggleLanguage = () => {
    const newLang = isFr ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans selection:bg-amber-500 selection:text-slate-900">
      <PwaInstallPrompt />
      {/* 1. Header / Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 left-0 right-0 bg-slate-900/20 backdrop-blur-xl border-b border-white/10 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl">🎓</span>
              <span className="font-extrabold text-white text-xl sm:text-2xl tracking-tight">EduTrack</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.quickLinks') !== 'landing.quickLinks' ? t('landing.quickLinks').split(' ')[0] : 'Fonctionnalités'}</a>
              <a href="#pricing" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.btnPricing').split(' ').pop()}</a>
              <a href="#testimonials" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.testimonialsTitle').split(' ').pop()}</a>
              <a href="#contact" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.contact')}</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={toggleLanguage} 
                className="text-sm sm:text-base text-slate-300 font-bold hover:text-amber-500 transition-colors uppercase"
              >
                {isFr ? 'EN' : 'FR'}
              </button>
              <Link to="/platform/login" className="text-sm sm:text-base text-amber-500 font-bold hover:text-amber-400 transition-colors whitespace-nowrap">
                {isFr ? 'Partenaires' : 'Partners'}
              </Link>
              <Link to={user ? "/dashboard-redirect" : "/login"} className="text-sm sm:text-base text-slate-300 font-bold hover:text-white transition-colors whitespace-nowrap">
                {user ? (isFr ? 'Tableau de bord' : 'Dashboard') : t('landing.login')}
              </Link>
              <Link to="/register" className="btn-glow whitespace-nowrap text-sm sm:text-base">
                <span className="hidden sm:inline">{t('landing.btnDemo')}</span>
                <span className="sm:hidden">{isFr ? 'Démo' : 'Demo'}</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 2. Hero section */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden border-b border-slate-800">
        <div className="absolute top-10 left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Gauche : Texte */}
            <div className="lg:w-1/2 text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm font-medium mb-6"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                {isFr ? 'SaaS Éducatif · iOS & Android · Multilingue' : 'Educational SaaS · iOS & Android · Multilingual'}
              </motion.div>

              <motion.h1 
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight"
              >
                {isFr ? 'La gestion scolaire' : 'School management'} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                  {isFr ? 'réinventée pour demain.' : 'reinvented for tomorrow.'}
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-xl text-slate-400 mb-10 font-medium leading-relaxed max-w-lg"
              >
                {t('landing.heroSubtitle')}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Link to="/register" className="w-full sm:w-auto btn-glow flex items-center justify-center gap-2 text-lg">
                  {t('landing.btnDemo')}
                </Link>
                <a href="#pricing" className="w-full sm:w-auto bg-slate-800 text-white border border-slate-700 px-8 py-3 rounded-xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                  {t('landing.btnPricing')}
                </a>
                <Link to="/platform/login" className="w-full sm:w-auto bg-slate-900 text-amber-400 border border-amber-500/30 px-8 py-3 rounded-xl font-bold text-lg hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2">
                  {isFr ? 'Espace Partenaires' : 'Partners Area'}
                </Link>
              </motion.div>
            </div>

            {/* Droite : Faux Dashboard */}
            <div className="lg:w-1/2 w-full">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="glass-panel p-4 md:p-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="ml-4 bg-slate-800/80 px-3 py-1 rounded-md text-xs text-slate-400 font-mono tracking-wider">
                    edutrack.com / admin / dashboard
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="text-slate-400 text-xs md:text-sm mb-1">{isFr ? 'Élèves' : 'Students'}</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">847</div>
                    <div className="text-emerald-400 text-xs flex items-center gap-1 mt-2">↑ 12%</div>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="text-slate-400 text-xs md:text-sm mb-1">{isFr ? 'Présences' : 'Attendance'}</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">94%</div>
                    <div className="text-emerald-400 text-xs flex items-center gap-1 mt-2">↑ 3%</div>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm hidden md:block">
                    <div className="text-slate-400 text-xs md:text-sm mb-1">{isFr ? 'Paiements' : 'Payments'}</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">98%</div>
                    <div className="text-emerald-400 text-xs flex items-center gap-1 mt-2">↑ 5%</div>
                  </div>
                </div>
                
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="text-slate-400 text-sm mb-6">{isFr ? 'Inscriptions par mois' : 'Enrollments per month'}</div>
                  <div className="flex items-end gap-2 md:gap-3 h-32 md:h-40">
                    {[40, 60, 45, 80, 50, 90, 70, 100, 60, 110, 80, 120].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm hover:from-amber-400 hover:to-amber-300 transition-colors" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section "Le problème" */}
      <section className="py-20 bg-slate-900 border-b border-slate-800">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-6">{t('landing.problemTitle')}</h2>
          <p 
            className="text-lg text-slate-400 leading-relaxed mb-8"
            dangerouslySetInnerHTML={{ __html: t('landing.problemDesc') }}
          />
        </motion.div>
      </section>

      {/* 4. Section "Fonctionnalités" */}
      <section id="features" className="py-24 bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{t('landing.featuresTitle')}</h2>
            
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold text-sm mt-4">
              <CheckCircle2 className="w-5 h-5" />
              {t('landing.featuresBadge')}
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuresList(isFr).map((feat, idx) => (
              <motion.div key={idx} variants={fadeIn} className="glass-panel p-6 hover:border-amber-500/50 transition-all hover:-translate-y-1 transform duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <div className="flex flex-col items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{feat.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{feat.desc}</p>
                <ul className="space-y-2">
                  {feat.details.slice(0, 2).map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4.5 Section "Comparaison Zéro Papier" (Avant / Avec) */}
      <section className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              {i18n.language === 'fr' ? 'La différence EduTrack' : 'The EduTrack Difference'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Avant */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 md:p-10">
              <h3 className="text-2xl font-bold text-red-400 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">✕</span>
                {i18n.language === 'fr' ? 'Avant EduTrack' : 'Before EduTrack'}
              </h3>
              <ul className="space-y-6 text-slate-400 text-lg">
                <li className="flex items-start gap-4">
                  <span className="text-red-500 mt-1">✕</span>
                  {i18n.language === 'fr' ? 'Registres d\'appel et bulletins en papier qui se perdent ou s\'abîment.' : 'Paper registers and report cards that get lost or damaged.'}
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-red-500 mt-1">✕</span>
                  {i18n.language === 'fr' ? 'Reçus de scolarité manuels, difficiles à vérifier pour la comptabilité.' : 'Manual tuition receipts, hard to verify for accounting.'}
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-red-500 mt-1">✕</span>
                  {i18n.language === 'fr' ? 'Communication lente et coûteuse avec les parents (appels, SMS payants).' : 'Slow and expensive communication with parents (calls, paid SMS).'}
                </li>
              </ul>
            </div>
            {/* Avec */}
            <div className="glass-panel border-amber-500/30 p-8 md:p-10 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-bl-full -z-10"></div>
              <h3 className="text-2xl font-bold text-amber-500 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">✓</span>
                {i18n.language === 'fr' ? 'Avec EduTrack' : 'With EduTrack'}
              </h3>
              <ul className="space-y-6 text-slate-300 text-lg">
                <li className="flex items-start gap-4">
                  <span className="text-amber-500 mt-1">✓</span>
                  {i18n.language === 'fr' ? 'Appel électronique et génération de bulletins PDF en 1 clic.' : 'Electronic roll call and 1-click PDF report card generation.'}
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-amber-500 mt-1">✓</span>
                  {i18n.language === 'fr' ? 'Reçus de paiement numériques, traçabilité totale et relances automatiques.' : 'Digital payment receipts, full traceability and automatic reminders.'}
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-amber-500 mt-1">✓</span>
                  {i18n.language === 'fr' ? 'Messagerie interne gratuite et instantanée avec les parents.' : 'Free and instant internal messaging with parents.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section "Tarifs" */}
      <section id="pricing" className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">{t('landing.pricingTitle')}</h2>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>{t('landing.monthly')}</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-8 w-16 items-center rounded-full bg-slate-700 transition-colors focus:outline-none"
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-amber-500 transition-transform duration-300 ${isAnnual ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
              <span className={`font-semibold transition-colors ${isAnnual ? 'text-white' : 'text-slate-500'}`}>{t('landing.annual')}</span>
              
              {isAnnual && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                >
                  {t('landing.saveMonths')}
                </motion.span>
              )}
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start"
          >
            {/* ESSENTIEL */}
            <PricingCard 
              title="ESSENTIEL" 
              priceMensuel="25 000" 
              priceAnnuel="250 000" 
              economy="50 000"
              isAnnual={isAnnual}
              students={i18n.language === 'fr' ? 'Jusqu\'à 300' : 'Up to 300'}
              roles={i18n.language === 'fr' ? 'Tous les rôles inclus' : 'All roles included'}
              admin={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              pedagogy={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              discipline={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              finances={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              ctaText={i18n.language === 'fr' ? 'Choisir ce plan' : 'Choose this plan'}
            />

            {/* PRO */}
            <PricingCard 
              title="PRO" 
              priceMensuel="54 000" 
              priceAnnuel="540 000" 
              economy="108 000"
              isAnnual={isAnnual}
              isPopular={true}
              students={i18n.language === 'fr' ? '301 à 800' : '301 to 800'}
              roles={i18n.language === 'fr' ? 'Tous les rôles inclus' : 'All roles included'}
              admin={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              pedagogy={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              discipline={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              finances={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              ctaText={i18n.language === 'fr' ? 'Essayer Pro' : 'Try Pro'}
              popularText={i18n.language === 'fr' ? 'Le plus populaire' : 'Most popular'}
            />

            {/* PREMIUM */}
            <PricingCard 
              title="PREMIUM" 
              priceMensuel="99 000" 
              priceAnnuel="990 000" 
              economy="198 000"
              isAnnual={isAnnual}
              students={i18n.language === 'fr' ? '801 à 2 000' : '801 to 2,000'}
              roles={i18n.language === 'fr' ? 'Tous les rôles inclus' : 'All roles included'}
              admin={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              pedagogy={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              discipline={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              bureauEleves={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              finances={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              rh={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              bibliotheque={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              ctaText={i18n.language === 'fr' ? 'Choisir ce plan' : 'Choose this plan'}
            />

            {/* ENTREPRISE */}
            <PricingCard 
              title="ENTREPRISE" 
              isEnterprise={true}
              students={i18n.language === 'fr' ? 'Plus de 2 000' : 'More than 2,000'}
              roles={i18n.language === 'fr' ? 'Tous les rôles inclus' : 'All roles included'}
              admin={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              pedagogy={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              discipline={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              bureauEleves={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              finances={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              rh={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              bibliotheque={i18n.language === 'fr' ? 'Toutes fonctionnalités' : 'All features'}
              ctaText={i18n.language === 'fr' ? 'Nous contacter' : 'Contact us'}
              surDevisText={i18n.language === 'fr' ? 'Sur devis' : 'Custom'}
              surDevisDesc={i18n.language === 'fr' ? 'Tarif calculé selon le nombre d\'élèves.' : 'Pricing adapted to your specific needs.'}
            />
          </motion.div>
        </div>
      </section>

      {/* 6. Section "Pourquoi EduTrack" */}
      <section className="py-20 bg-slate-800/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-4">{t('landing.whyTitle')}</h2>
            <p className="text-slate-400">{t('landing.whySubtitle')}</p>
          </motion.div>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            <motion.div variants={fadeIn} className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{i18n.language === 'fr' ? 'Adaptation Culturelle' : 'Cultural Adaptation'}</h3>
              <p className="text-slate-400">{i18n.language === 'fr' ? 'Conçu pour l\'Afrique : Séquences, Censeur, Intendant, Moratoires et Franc CFA.' : 'Built for Africa: Sequences, Censeur, Bursar, Moratoriums and local currencies.'}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{i18n.language === 'fr' ? 'Centralisation Totale' : 'Total Centralization'}</h3>
              <p className="text-slate-400">{i18n.language === 'fr' ? 'Finances, Pédagogie, Vie Scolaire et RH réunies sur une seule et même plateforme.' : 'Finances, Pedagogy, School Life and HR all united on a single platform.'}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{i18n.language === 'fr' ? 'Transparence & Sécurité' : 'Transparency & Security'}</h3>
              <p className="text-slate-400">{i18n.language === 'fr' ? 'Portails parents/élèves séparés, génération de PDF professionnels et sécurité cloud.' : 'Dedicated parent/student portals, professional PDF generation and cloud security.'}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{i18n.language === 'fr' ? 'Paiement Mobile Money' : 'Mobile Money Payment'}</h3>
              <p className="text-slate-400">{i18n.language === 'fr' ? 'Intégration native pour le paiement des frais via Wave, Orange Money et MTN MoMo.' : 'Native integration for fee payments via Wave, Orange Money and MTN MoMo.'}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <WifiOff className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{i18n.language === 'fr' ? 'Mode Hors-Ligne' : 'Offline Mode'}</h3>
              <p className="text-slate-400">{i18n.language === 'fr' ? 'Fonctionnement optimisé même avec une connexion instable. Synchronisation automatique.' : 'Optimized to work even with unstable connections. Automatic synchronization.'}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="p-6">
              <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{i18n.language === 'fr' ? 'Bilingue FR / EN' : 'Bilingual EN / FR'}</h3>
              <p className="text-slate-400">{i18n.language === 'fr' ? 'Idéal pour le sous-système francophone et anglophone. Changez de langue en un clic.' : 'Ideal for both Francophone and Anglophone sub-systems. Switch languages in one click.'}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. Section témoignages */}
      <section id="testimonials" className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-12"
          >
            {t('landing.testimonialsTitle')}
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-left hover:border-amber-500/30 transition-colors">
              <div className="flex gap-1 text-amber-500 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-300 italic mb-6">"{i18n.language === 'fr' ? '[À compléter avec vos premiers retours clients. L\'impact de la solution sur la gestion de l\'école sera décrit ici.]' : '[To be filled with early customer feedback. The impact of the solution will be described here.]'}"</p>
              <div className="font-bold text-white">{i18n.language === 'fr' ? 'Directeur d\'Établissement' : 'School Director'}</div>
              <div className="text-sm text-slate-500">{i18n.language === 'fr' ? 'École Privée, Yaoundé' : 'Private School, Yaoundé'}</div>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-left hover:border-amber-500/30 transition-colors">
              <div className="flex gap-1 text-amber-500 mb-4">
                <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-slate-300 italic mb-6">"{i18n.language === 'fr' ? '[À compléter avec les retours de parents ou d\'enseignants concernant la facilité de communication et de suivi.]' : '[To be filled with parent or teacher feedback regarding ease of communication.]'}"</p>
              <div className="font-bold text-white">{i18n.language === 'fr' ? 'Parent d\'Élève' : 'Student Parent'}</div>
              <div className="text-sm text-slate-500">{i18n.language === 'fr' ? 'Collège, Douala' : 'High School, Douala'}</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section Applications Multiplateformes */}
      <section className="py-20 bg-slate-900 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-emerald-900/20 rounded-full blur-3xl -z-10 transform -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                {i18n.language === 'fr' ? 'Emportez EduTrack partout avec vous' : 'Take EduTrack everywhere you go'}
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                {i18n.language === 'fr' 
                  ? 'Installez nos applications pour ordinateurs (Windows, Mac) ou pour appareils mobiles. Profitez de l\'accès hors-ligne, des notifications, et d\'une expérience fluide.'
                  : 'Install our applications for computers (Windows, Mac) or mobile devices. Enjoy offline access, notifications, and a seamless experience.'
                }
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    const promptEvent = new Event('beforeinstallprompt');
                    window.dispatchEvent(promptEvent);
                    alert(i18n.language === 'fr' ? `Si l'installation ne démarre pas, ouvrez le menu de votre navigateur Chrome (3 points) et choisissez "Ajouter à l'écran d'accueil".` : 'If installation does not start, open your Chrome browser menu (3 dots) and select "Add to Home Screen".');
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-3 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>{i18n.language === 'fr' ? 'Installer sur Android' : 'Install on Android'}</span>
                </button>
                <button 
                  onClick={() => {
                    alert(i18n.language === 'fr' ? `Sur iPhone/iPad : Ouvrez Safari, appuyez sur l'icône "Partager" (carré avec flèche vers le haut) puis choisissez "Sur l'écran d'accueil".` : 'On iPhone/iPad: Open Safari, tap the "Share" icon (square with arrow pointing up) and select "Add to Home Screen".');
                  }}
                  className="bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 shadow-lg"
                >
                  <Apple className="w-5 h-5" />
                  <span>{i18n.language === 'fr' ? 'Installer sur iPhone' : 'Install on iPhone'}</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <a 
                  href="/downloads/EduTrack-Setup.exe"
                  download
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-3 shadow-lg flex-1"
                >
                  <Monitor className="w-5 h-5" />
                  <span>{i18n.language === 'fr' ? 'Windows (.exe)' : 'Windows (.exe)'}</span>
                </a>
                <a 
                  href="/downloads/EduTrack-Mac.dmg"
                  download
                  className="bg-slate-700 text-white border border-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors flex items-center justify-center gap-3 shadow-lg flex-1"
                >
                  <Apple className="w-5 h-5" />
                  <span>{i18n.language === 'fr' ? 'Mac (.dmg)' : 'Mac (.dmg)'}</span>
                </a>
              </div>
            </div>
            </motion.div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative w-64 h-auto aspect-[1/2] bg-slate-800 rounded-[2.5rem] border-8 border-slate-700 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-amber-500 w-full h-1/4 flex items-end justify-center pb-4 text-slate-900 font-bold text-2xl tracking-tighter">
                <span className="mr-1">🎓</span>EduTrack
              </div>
              <div className="flex-1 p-4 flex flex-col gap-3 bg-slate-900">
                <div className="h-10 bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="h-24 bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-16 w-1/2 bg-slate-800 rounded-lg animate-pulse"></div>
                  <div className="h-16 w-1/2 bg-slate-800 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-10 bg-amber-500/20 rounded-lg animate-pulse mt-auto"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Documentation & Ressources */}
      <section className="py-20 bg-slate-800/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              {i18n.language === 'fr' ? 'Ressources & Documentation' : 'Resources & Documentation'}
            </h2>
            <p className="text-slate-400">
              {i18n.language === 'fr' ? 'Téléchargez nos manuels officiels pour maîtriser toutes les fonctionnalités d\'EduTrack.' : 'Download our official manuals to master all EduTrack features.'}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <a 
              href="/Manuel_Utilisation_EduTrack_FR.pdf"
              download
              className="glass-panel p-6 flex flex-col items-center hover:border-amber-500/50 transition-all hover:-translate-y-1 w-full sm:w-80 group cursor-pointer"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Manuel d'Utilisation (FR)</h3>
              <p className="text-sm text-slate-400 mb-6 flex-grow">Guide complet en français couvrant la comptabilité OHADA, la pédagogie et l'administration.</p>
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Télécharger le PDF</span>
              </div>
            </a>

            <a 
              href="/EduTrack_User_Manual_EN.pdf"
              download
              className="glass-panel p-6 flex flex-col items-center hover:border-amber-500/50 transition-all hover:-translate-y-1 w-full sm:w-80 group cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">User Manual (EN)</h3>
              <p className="text-sm text-slate-400 mb-6 flex-grow">Complete English guide covering OHADA accounting, pedagogy, and administration.</p>
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* 8. Section FAQ */}
      <section className="py-20 bg-slate-800/50 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white text-center mb-10"
          >
            {t('landing.faqTitle')}
          </motion.h2>
          <div className="space-y-4">
            {faqs(isFr).map((faq, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
              >
                <button 
                  onClick={() => toggleFaq(idx)} 
                  className="w-full px-6 py-4 text-left flex justify-between items-center font-bold text-white hover:bg-slate-700/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-amber-500 transform transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-4 text-slate-400"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA final & Contact Form */}
      <section id="contact" className="py-24 bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 md:p-12 flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">{isFr ? 'Contactez-nous' : 'Contact Us'}</h2>
              <p className="text-slate-400 text-lg">
                {isFr 
                  ? "Une question ? Besoin d'une démo personnalisée ? Notre équipe est là pour vous répondre rapidement." 
                  : "Any questions? Need a customized demo? Our team is here to answer you quickly."
                }
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-500">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">{isFr ? 'WhatsApp / Appel' : 'WhatsApp / Call'}</div>
                    <div className="font-bold">+237 691 00 33 92</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="font-bold">contact@edutrack.com</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 w-full bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{isFr ? 'Nom complet' : 'Full Name'}</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder={isFr ? "Jean Dupont" : "John Doe"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder="contact@school.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
                  <textarea rows="4" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" placeholder={isFr ? "Comment pouvons-nous vous aider ?" : "How can we help you?"}></textarea>
                </div>
                <button type="submit" className="w-full btn-glow text-center mt-2">
                  {isFr ? 'Envoyer le message' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-slate-950 py-8 border-t border-slate-800 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-extrabold text-white text-lg">EduTrack</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400 flex-wrap justify-center">
            <a href="#features" className="hover:text-amber-500 transition-colors">{isFr ? 'Fonctionnalités' : 'Features'}</a>
            <a href="#pricing" className="hover:text-amber-500 transition-colors">{isFr ? 'Tarifs' : 'Pricing'}</a>
            <Link to="/login" className="hover:text-amber-500 transition-colors">{isFr ? 'Connexion' : 'Login'}</Link>
            <Link to="/platform/login" className="hover:text-amber-500 transition-colors">{isFr ? 'Portail Partenaires' : 'Partners Portal'}</Link>
          </div>
          <div className="flex gap-4">
            <a href="https://facebook.com/edutrack" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#1877F2] transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
          <p className="text-slate-600 text-xs mt-4">
            © {new Date().getFullYear()} EduTrack. {isFr ? "Fabriqué avec passion pour l'éducation." : "Made with passion for education."}
          </p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <motion.a 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        href="https://wa.me/237691003392" 
        target="_blank"  
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="w-8 h-8" />
      </motion.a>

    </div>
  );
}

const featuresList = (isFr) => [
  {
    title: !isFr ? 'Security & Multi-Role Portals' : 'Sécurité & Portails multi-rôles',
    desc: !isFr ? 'Dedicated bilingual portals for Director, Censeur, Intendant, Teacher, Parent, and Student.' : 'Des espaces de travail dédiés et bilingues pour le Directeur, Censeur, Intendant, Enseignant, Parent et Élève.',
    details: !isFr ? [
      'Strict role-based access control (RBAC). Parents only see their child, teachers only their classes.',
      'Instant toggle between French and English across the entire platform.',
      'Maximum data security and isolation per campus.'
    ] : [
      'Contrôle d\'accès strict. Le parent ne voit que son enfant, l\'enseignant ne voit que ses classes.',
      'Basculement instantané entre le Français et l\'Anglais sur toute la plateforme.',
      'Sécurité maximale des données et isolation par établissement.'
    ],
    icon: <ShieldCheck className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Discipline & Real-Time Parent Tracking' : 'Discipline & Suivi Parent en Temps Réel',
    desc: !isFr ? 'Immediate notification to parents of absences or penalties, establishing a direct connection between home and school.' : 'Notification immédiate aux parents en cas d\'absence, de retard ou de sanction, pour un lien école-famille renforcé.',
    details: !isFr ? [
      'Fast electronic roll call in class by the teacher in just 3 clicks.',
      'Instant visibility of all student actions and discipline reports on the Parent portal.',
      'Free, secure internal messaging connecting parents directly with administration, avoiding costly SMS.'
    ] : [
      'Appel électronique rapide en classe directement par l\'enseignant en 3 clics.',
      'Visibilité instantanée de tous les agissements, absences ou retards sur le portail Parent.',
      'Messagerie interne gratuite et sécurisée reliant les parents à l\'école, évitant les frais de SMS.'
    ],
    icon: <MessageSquare className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Administration & Centralization' : 'Administration & Centralisation',
    desc: !isFr ? 'Simplify your enrollment process and keep track of your student body effortlessly.' : 'Simplifiez vos inscriptions et centralisez vos données (Finances + Pédagogie + RH).',
    details: !isFr ? [
      'Fast student enrollment and massive CSV data import.',
      'Automatic generation of student ID cards with integrated QR codes.',
      'One-click generation of enrollment certificates and official documents.'
    ] : [
      'Inscription rapide des élèves et importation massive de données via CSV.',
      'Génération automatique des cartes scolaires avec QR code de sécurité intégré.',
      'Édition en un clic des certificats de scolarité et autres documents officiels.'
    ],
    icon: <Users className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Pedagogy & Digital Report Cards' : 'Pédagogie & Bulletins',
    desc: !isFr ? 'Automate academic tracking (Sequences, Terms) from timetable creation to report cards.' : 'Automatisez le suivi académique (Séquences et Trimestres), des emplois du temps aux bulletins.',
    details: !isFr ? [
      'Conflict-free timetable creation and management.',
      'Grade entry by sequence via intuitive interface or Excel import.',
      'Automatic generation of term report cards with instant GPA calculations.'
    ] : [
      'Création et gestion des emplois du temps sans conflits.',
      'Saisie des notes par Séquence sur interface intuitive ou import Excel.',
      'Génération automatique des bulletins trimestriels et annuels avec calcul de moyenne.'
    ],
    icon: <GraduationCap className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Bursary & Fee Reminders' : 'Finances & Scolarité',
    desc: !isFr ? 'A robust system for the Intendant to track tuition fees and handle payments.' : 'Un système robuste pour l\'Intendant, permettant de suivre la scolarité et la comptabilité.',
    details: !isFr ? [
      'Strict tracking of tuition installments and moratoriums (payment delays).',
      'Automatic reminders to parents for unpaid fees via internal messaging.',
      'Instantly printable professional payment receipts.'
    ] : [
      'Suivi rigoureux des paiements de scolarité par tranches et gestion des Moratoires.',
      'Relances automatiques aux parents pour les impayés via la messagerie interne.',
      'Génération instantanée de reçus de paiement professionnels imprimables.'
    ],
    icon: <Wallet className="w-6 h-6" />
  },
  {
    title: !isFr ? 'OHADA General Accounting' : 'Comptabilité Générale (Norme OHADA)',
    desc: !isFr ? 'Full school bookkeeping with double-entry ledgers, journals, and reports.' : 'Tenue de livre comptable complète avec plan comptable scolaire, journaux et balances.',
    details: !isFr ? [
      'Dedicated financial journals (Cash, Bank, Miscellaneous Operations).',
      'Structured chart of accounts aligned with general accounting rules.',
      'Double-entry accounting ensuring perfectly balanced debits and credits.'
    ] : [
      'Journaux comptables dédiés (Caisse, Banque, Opérations Diverses).',
      'Plan comptable scolaire structuré et paramétrable.',
      'Enregistrement à double entrée garantissant l\'équilibre Débit/Crédit des écritures.'
    ],
    icon: <Star className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Human Resources & Payroll' : 'Ressources Humaines & Paie',
    desc: !isFr ? 'Manage your teaching and support staff effectively.' : 'Gérez efficacement votre personnel enseignant et administratif.',
    details: !isFr ? [
      'Digital files for permanent and substitute teachers.',
      'Time tracking and automated payroll calculations.',
      'Management of leave requests and salary advances.'
    ] : [
      'Dossiers numériques complets pour les enseignants titulaires et vacataires.',
      'Pointage des heures de cours et calcul automatisé de la paie.',
      'Gestion simplifiée des demandes de congés et des bulletins de salaire.'
    ],
    icon: <Briefcase className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Logistics (Transport & Canteen)' : 'Services Logistiques (Transport & Cantine)',
    desc: !isFr ? 'Manage school bus routes, driver details, and canteen dietary restrictions.' : 'Gérez les lignes de bus scolaires, les informations des chauffeurs et la cantine.',
    details: !isFr ? [
      'Bus route setup with driver phone numbers and monthly fees.',
      'Real-time student bus search for fast subscription enrollment.',
      'Canteen enrollment database tracking allergies and dietary notes.'
    ] : [
      'Configuration des lignes de bus (chauffeurs, tarifs, numéros).',
      'Recherche d\'élèves en temps réel pour une inscription rapide au transport.',
      'Suivi de la cantine avec prise en compte des allergies et régimes spécifiques.'
    ],
    icon: <Truck className="w-6 h-6" />
  },
  {
    title: !isFr ? 'Parental Consent (Loi 2024/017)' : 'Consentement Parental (Loi 2024/017 Cameroun)',
    desc: !isFr ? 'Complete compliance with personal data protection laws for minors.' : 'Conformité totale avec la loi sur la protection des données personnelles des élèves mineurs.',
    details: !isFr ? [
      'Explicit opt-in forms for data processing, photo rights, and health.',
      'Full electronic signature tracking (IP address, timestamps).',
      'Security audit logs recording every access to sensitive student records.'
    ] : [
      'Cases d\'opt-in explicites pour le traitement des données, le droit à l\'image et la santé.',
      'Traçabilité complète des signatures électroniques (IP, Horodatage).',
      'Registre d\'audit enregistrant chaque accès aux informations privées de l\'élève.'
    ],
    icon: <Gavel className="w-6 h-6" />
  },
  {
    title: !isFr ? 'School Library' : 'Bibliothèque Scolaire',
    desc: !isFr ? 'A modern approach to managing your school\'s book inventory and loans.' : 'Une approche moderne pour gérer le catalogue de livres et les emprunts de votre établissement.',
    details: !isFr ? [
      'Fully digitized book inventory with advanced search.',
      'Loan and return tracking with deadline alerts.',
      'Student reading history shared directly with the administration.'
    ] : [
      'Inventaire numérisé complet des ouvrages avec recherche avancée.',
      'Suivi précis des emprunts et retours avec alertes de délais.',
      'Historique de lecture des élèves partagé avec l\'administration.'
    ],
    icon: <BookOpen className="w-6 h-6" />
  }
];

const faqs = (isFr) => [
  { 
    q: !isFr ? "How does setup work?" : "Comment se passe la mise en place ?", 
    a: !isFr ? "Our team helps you import your data (existing CSV files) and train key staff. In just a few days, your school is operational on EduTrack." : "Notre équipe vous accompagne pour importer vos données (fichiers CSV existants) et former votre personnel clé. En quelques jours, l'école est opérationnelle sur EduTrack." 
  },
  { 
    q: !isFr ? "Is my data secure?" : "Mes données sont-elles sécurisées ?", 
    a: !isFr ? "Yes, data is stored on secure servers with regular backups. The role system ensures everyone only sees what they are allowed to see." : "Oui, les données sont stockées sur des serveurs sécurisés avec sauvegardes régulières. Le système de rôles garantit que chacun ne voit que ce qu'il a le droit de voir." 
  },
  { 
    q: !isFr ? "Does it work without stable internet?" : "Le système fonctionne-t-il sans connexion internet stable ?", 
    a: !isFr ? "Yes, offline mode allows entering grades without a connection, syncing automatically when the network returns." : "Oui, le mode hors-ligne permet notamment la saisie des notes sans connexion, avec une synchronisation automatique dès que le réseau revient." 
  },
  { 
    q: !isFr ? "How do parents access the platform?" : "Comment les parents accèdent-ils à la plateforme ?", 
    a: !isFr ? "Parents receive a secure account to log in via phone or computer, letting them track their children's grades, absences, and payments." : "Les parents reçoivent un compte sécurisé pour se connecter via leur téléphone ou ordinateur, leur permettant de suivre notes, absences et paiements de leurs enfants." 
  },
  { 
    q: !isFr ? "What's the difference between monthly and annual payment?" : "Quelle est la différence entre payer au mois et payer à l'année ?", 
    a: !isFr ? "The annual subscription gives you 2 free months (pay 10 instead of 12), with access to the exact same features." : "L'abonnement annuel vous permet d'économiser 2 mois gratuits (vous payez 10 mois au lieu de 12), tout en accédant aux mêmes fonctionnalités." 
  }
];

function PricingCard({ 
  title, priceMensuel, priceAnnuel, economy, isAnnual, isPopular, isEnterprise, 
  students, roles, admin, pedagogy, discipline, bureauEleves, finances, rh, bibliotheque, ctaText,
  popularText, surDevisText, surDevisDesc
}) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
      }}
      className={`relative glass-panel ${isPopular ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-slate-700/50'} p-6 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-lg">
          {popularText || 'Le plus populaire'}
        </div>
      )}
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      
      <div className="mb-6 min-h-[5rem]">
        {isEnterprise ? (
          <div>
            <div className="text-3xl font-black text-white">{surDevisText || 'Sur devis'}</div>
            <div className="text-sm text-slate-400 mt-1">{surDevisDesc || 'Tarif calculé selon le nombre d\'élèves.'}</div>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{isAnnual ? priceAnnuel : priceMensuel}</span>
              <span className="text-slate-400 font-medium">FCFA/{isAnnual ? 'an' : 'mois'}</span>
            </div>
            {isAnnual && economy && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-emerald-400 font-medium mt-1"
              >
                ({economy} FCFA {title === 'BRONZE' && economy === '70 000' && !economy.includes('saved') ? 'd\'économie' : 'saved'})
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 text-sm text-slate-300 flex-grow mb-8">
        <div className="flex flex-col border-b border-slate-700/50 pb-2">
          <span className="text-xs text-slate-500 font-bold uppercase mb-1">{title === 'BRONZE' && roles && roles.includes('Director') ? 'Students included' : 'Élèves inclus'}</span>
          <span className="font-semibold text-white">{students}</span>
        </div>
        <div className="flex flex-col border-b border-slate-700/50 pb-2">
          <span className="text-xs text-slate-500 font-bold uppercase mb-1">{title === 'BRONZE' && roles && roles.includes('Director') ? 'Roles' : 'Rôles'}</span>
          <span>{roles}</span>
        </div>
        <div className="flex flex-col border-b border-slate-700/50 pb-2">
          <span className="text-xs text-slate-500 font-bold uppercase mb-1">Administration</span>
          <span>{admin}</span>
        </div>
        <div className="flex flex-col border-b border-slate-700/50 pb-2">
          <span className="text-xs text-slate-500 font-bold uppercase mb-1">{title === 'BRONZE' && roles && roles.includes('Director') ? 'Pedagogy' : 'Pédagogie'}</span>
          <span>{pedagogy}</span>
        </div>
        <div className="flex flex-col border-b border-slate-700/50 pb-2">
          <span className="text-xs text-slate-500 font-bold uppercase mb-1">Discipline</span>
          <span>{discipline}</span>
        </div>
        <div className="flex flex-col border-b border-slate-700/50 pb-2">
          <span className="text-xs text-slate-500 font-bold uppercase mb-1">Finances</span>
          <span>{finances}</span>
        </div>
      </div>

      <button className={`w-full py-3 rounded-xl font-bold transition-colors mt-auto ${
        isPopular ? 'btn-glow text-center' : 'bg-slate-700 text-white hover:bg-slate-600'
      }`}>
        {ctaText}
      </button>
    </motion.div>
  );
}
