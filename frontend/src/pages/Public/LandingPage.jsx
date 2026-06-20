import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, Users, GraduationCap, Gavel, 
  Wallet, Briefcase, MessageSquare, BookOpen, 
  ArrowRight, CheckCircle2, Globe, Smartphone, 
  WifiOff, Star, ChevronDown, MessageCircle, Facebook, Download, Apple
} from 'lucide-react';
import PwaInstallPrompt from '../../components/PwaInstallPrompt';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
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
        className="sticky top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎓</span>
              <span className="font-extrabold text-white text-2xl tracking-tight">EduTrack</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.quickLinks') !== 'landing.quickLinks' ? t('landing.quickLinks').split(' ')[0] : 'Fonctionnalités'}</a>
              <a href="#pricing" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.btnPricing').split(' ').pop()}</a>
              <a href="#testimonials" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.testimonialsTitle').split(' ').pop()}</a>
              <a href="#contact" className="text-slate-300 hover:text-amber-500 font-semibold transition-colors">{t('landing.contact')}</a>
            </nav>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleLanguage} 
                className="text-slate-300 font-bold hover:text-amber-500 transition-colors uppercase"
              >
                {i18n.language === 'fr' ? 'EN' : 'FR'}
              </button>
              <Link to="/login" className="hidden sm:inline-flex text-slate-300 font-bold hover:text-white transition-colors">
                {t('landing.login')}
              </Link>
              <Link to="/register" className="bg-amber-500 text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-amber-400 transition-all shadow-md">
                {t('landing.btnDemo')}
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 2. Hero section */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6"
            dangerouslySetInnerHTML={{ __html: t('landing.heroTitle').replace('établissement scolaire', '<br class="hidden md:block" />établissement scolaire').replace('school management', '<br class="hidden md:block" />school management') }}
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto mb-10 font-medium leading-relaxed"
          >
            {t('landing.heroSubtitle')}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
          >
            <Link to="/register" className="w-full sm:w-auto bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-amber-400 transition-all shadow-xl flex items-center justify-center gap-2 transform hover:scale-105">
              {t('landing.btnDemo')}
            </Link>
            <a href="#pricing" className="w-full sm:w-auto bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105">
              {t('landing.btnPricing')}
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mx-auto max-w-4xl bg-slate-800/50 p-2 md:p-4 rounded-3xl border border-slate-700 shadow-2xl relative"
          >
            <img 
              src="/hero.png" 
              alt="EduTrack Dashboard" 
              className="rounded-2xl w-full h-auto object-cover opacity-80"
            />
          </motion.div>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {featuresList(i18n.language).map((feat, idx) => (
              <motion.div key={idx} variants={fadeIn} className="bg-slate-800 border border-slate-700 rounded-3xl p-8 hover:border-amber-500/50 transition-colors hover:-translate-y-1 transform duration-300 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900/50 border border-slate-700 flex items-center justify-center text-amber-500 flex-shrink-0">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">{feat.title}</h3>
                </div>
                <p className="text-base text-slate-400 leading-relaxed mb-6">{feat.desc}</p>
                <ul className="space-y-3">
                  {feat.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
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

      {/* Section Application Mobile */}
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
                  ? 'Installez notre application mobile directement depuis ce site web. Pas besoin de passer par l\'App Store ou le Play Store. Accès rapide, notifications, et mode hors-ligne inclus.'
                  : 'Install our mobile application directly from this website. No need to go through the App Store or Play Store. Fast access, notifications, and offline mode included.'
                }
              </p>
              
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
            {faqs(i18n.language).map((faq, idx) => (
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">{t('landing.ctaTitle')}</h2>
              <p className="text-slate-400 text-lg">{t('landing.ctaSubtitle')}</p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="text-amber-500 w-5 h-5"/> {i18n.language === 'fr' ? 'Démo personnalisée' : 'Custom demo'}</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-amber-500 w-5 h-5"/> {i18n.language === 'fr' ? 'Accompagnement à l\'installation' : 'Installation support'}</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-amber-500 w-5 h-5"/> {i18n.language === 'fr' ? 'Sans engagement' : 'No commitment'}</li>
              </ul>
            </div>
            
            <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6 text-center">
              <div className="text-5xl mb-2">🎓</div>
              <h3 className="text-xl font-bold text-white">{i18n.language === 'fr' ? 'Prêt à transformer votre école ?' : 'Ready to transform your school?'}</h3>
              <p className="text-slate-400 text-sm">
                {i18n.language === 'fr' 
                  ? 'Rejoignez-nous dès aujourd\'hui et découvrez comment EduTrack peut simplifier votre gestion quotidienne.'
                  : 'Join us today and discover how EduTrack can simplify your daily management.'}
              </p>
              <Link to="/register" className="w-full bg-amber-500 text-slate-900 font-bold rounded-lg px-6 py-4 hover:bg-amber-400 transition-all shadow-lg transform hover:-translate-y-1 mt-4 block">
                {t('landing.btnDemo')}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎓</span>
              <span className="font-extrabold text-white text-xl">EduTrack</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm mb-4">{t('landing.footerDesc')}</p>
            <p className="text-slate-500 text-xs">© {new Date().getFullYear()} EduTrack. {i18n.language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t('landing.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-amber-500">{t('landing.quickLinks') !== 'landing.quickLinks' ? t('landing.quickLinks').split(' ')[0] : 'Fonctionnalités'}</a></li>
              <li><a href="#pricing" className="hover:text-amber-500">{t('landing.btnPricing').split(' ').pop()}</a></li>
              <li><a href="/login" className="hover:text-amber-500">{t('landing.login')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t('landing.contact')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>contact@edutrack.com</li>
              <li>+237 691 00 33 92 / +237 681 62 55 20</li>
              <li>Yaoundé, {i18n.language === 'fr' ? 'Cameroun' : 'Cameroon'}, Emana</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{t('landing.followUs')}</h4>
            <div className="flex gap-4">
              <a href="https://facebook.com/edutrack" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#1877F2] hover:text-white transition-colors" title="Facebook EduTrack">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@edutrack" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white transition-colors" title="TikTok EduTrack">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.8-5.46-.4-2.51.33-5.17 2.05-7.06 1.48-1.62 3.65-2.55 5.86-2.57v4.06c-1.33-.07-2.73.35-3.66 1.35-.91.95-1.28 2.37-.99 3.69.24 1.05.96 1.98 1.88 2.48 1.25.68 2.87.69 4.09.07 1.25-.63 2.07-1.92 2.18-3.32.19-3.21.05-6.44.09-9.66z"/>
                </svg>
              </a>
            </div>
          </div>
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

const featuresList = (lang) => [
  {
    title: lang === 'en' ? 'Security & Multi-Role Portals' : 'Sécurité & Portails multi-rôles',
    desc: lang === 'en' ? 'Dedicated bilingual portals for Director, Master, Bursar, Teacher, Parent, and Student.' : 'Des espaces de travail dédiés et bilingues pour le Directeur, Censeur, Intendant, Enseignant, Parent et Élève.',
    details: lang === 'en' ? [
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
    title: lang === 'en' ? 'Administration' : 'Administration',
    desc: lang === 'en' ? 'Simplify your enrollment process and keep track of your student body effortlessly.' : 'Simplifiez vos inscriptions et gardez le contrôle total sur vos effectifs en toute simplicité.',
    details: lang === 'en' ? [
      'Fast student enrollment and massive CSV data import.',
      'Automatic generation of student ID cards with integrated QR codes.',
      'One-click generation of enrollment certificates and official documents.'
    ] : [
      'Inscription rapide des élèves et importation massive de données via CSV.',
      'Génération automatique des cartes scolaires avec QR code intégré.',
      'Édition en un clic des certificats de scolarité et autres documents officiels.'
    ],
    icon: <Users className="w-6 h-6" />
  },
  {
    title: lang === 'en' ? 'Pedagogy' : 'Pédagogie',
    desc: lang === 'en' ? 'Automate academic tracking from timetable creation to report cards.' : 'Automatisez le suivi académique, de la création de l\'emploi du temps à l\'édition des bulletins.',
    details: lang === 'en' ? [
      'Conflict-free timetable creation and management.',
      'Grade entry via intuitive interface or Excel import by teachers.',
      'Automatic generation of term report cards with instant GPA calculations.'
    ] : [
      'Création et gestion des emplois du temps sans conflits.',
      'Saisie des notes sur interface intuitive ou import Excel par les enseignants.',
      'Génération automatique des bulletins trimestriels avec calcul instantané des moyennes.'
    ],
    icon: <GraduationCap className="w-6 h-6" />
  },
  {
    title: lang === 'en' ? 'Discipline' : 'Discipline',
    desc: lang === 'en' ? 'Maintain order and track student behavior meticulously.' : 'Maintenez l\'ordre et suivez le comportement des élèves de manière très rigoureuse.',
    details: lang === 'en' ? [
      'Fast electronic roll call in class by the teacher.',
      'Absence justification system directly accessible by parents.',
      'Tracking of sanctions (warnings, reprimands) and disciplinary councils.'
    ] : [
      'Appel électronique rapide en classe directement par l\'enseignant.',
      'Système de justification des absences accessible par les parents.',
      'Saisie et suivi des sanctions (avertissements, blâmes) et conseils de discipline.'
    ],
    icon: <Gavel className="w-6 h-6" />
  },
  {
    title: lang === 'en' ? 'Finances' : 'Finances & Trésorerie',
    desc: lang === 'en' ? 'A robust system to track tuition fees and handle payments seamlessly.' : 'Un système robuste pour suivre la scolarité et gérer les paiements sans friction.',
    details: lang === 'en' ? [
      'Strict tracking of tuition installments and partial payments.',
      'Automatic reminders to parents for unpaid fees via internal messaging.',
      'Instantly printable professional payment receipts.'
    ] : [
      'Suivi rigoureux des paiements de scolarité par tranches et paiements partiels.',
      'Relances automatiques aux parents pour les impayés via la messagerie interne.',
      'Génération instantanée de reçus de paiement professionnels imprimables.'
    ],
    icon: <Wallet className="w-6 h-6" />
  },
  {
    title: lang === 'en' ? 'Human Resources' : 'Ressources Humaines',
    desc: lang === 'en' ? 'Manage your teaching and support staff effectively.' : 'Gérez efficacement votre personnel enseignant et administratif.',
    details: lang === 'en' ? [
      'Digital files for permanent and substitute teachers.',
      'Time tracking and automated payroll calculations.',
      'Management of leave requests and salary advances.'
    ] : [
      'Dossiers numériques complets pour les enseignants titulaires et vacataires.',
      'Pointage des heures et calcul automatisé de la paie.',
      'Gestion simplifiée des demandes de congés et des avances sur salaire.'
    ],
    icon: <Briefcase className="w-6 h-6" />
  },
  {
    title: lang === 'en' ? 'Communication' : 'Communication',
    desc: lang === 'en' ? 'Bridge the gap between the school and parents without relying on expensive SMS.' : 'Rapprochez l\'école et les parents sans dépendre des SMS groupés coûteux.',
    details: lang === 'en' ? [
      'Secure, two-way internal messaging system for all stakeholders.',
      'Targeted broadcast of circulars to specific classes or roles.',
      'Exclusive module for the Student Council to post announcements.'
    ] : [
      'Système de messagerie interne bidirectionnelle et sécurisée pour tous les acteurs.',
      'Diffusion de circulaires ciblées (par classe ou par rôle).',
      'Module exclusif pour le Bureau des Élèves pour publier des annonces.'
    ],
    icon: <MessageSquare className="w-6 h-6" />
  },
  {
    title: lang === 'en' ? 'Library' : 'Bibliothèque',
    desc: lang === 'en' ? 'A modern approach to managing your school\'s book inventory and loans.' : 'Une approche moderne pour gérer le catalogue de livres et les emprunts de votre établissement.',
    details: lang === 'en' ? [
      'Fully digitized book inventory with advanced search.',
      'Loan and return tracking with deadline alerts.',
      'Student reading history shared directly with the Discipline Master.'
    ] : [
      'Inventaire numérisé complet des ouvrages avec recherche avancée.',
      'Suivi précis des emprunts et retours avec alertes de délais.',
      'Historique de lecture des élèves partagé directement avec le Censeur.'
    ],
    icon: <BookOpen className="w-6 h-6" />
  }
];

const faqs = (lang) => [
  { 
    q: lang === 'en' ? "How does setup work?" : "Comment se passe la mise en place ?", 
    a: lang === 'en' ? "Our team helps you import your data (existing CSV files) and train key staff. In just a few days, your school is operational on EduTrack." : "Notre équipe vous accompagne pour importer vos données (fichiers CSV existants) et former votre personnel clé. En quelques jours, l'école est opérationnelle sur EduTrack." 
  },
  { 
    q: lang === 'en' ? "Is my data secure?" : "Mes données sont-elles sécurisées ?", 
    a: lang === 'en' ? "Yes, data is stored on secure servers with regular backups. The role system ensures everyone only sees what they are allowed to see." : "Oui, les données sont stockées sur des serveurs sécurisés avec sauvegardes régulières. Le système de rôles garantit que chacun ne voit que ce qu'il a le droit de voir." 
  },
  { 
    q: lang === 'en' ? "Does it work without stable internet?" : "Le système fonctionne-t-il sans connexion internet stable ?", 
    a: lang === 'en' ? "Yes, offline mode allows entering grades without a connection, syncing automatically when the network returns." : "Oui, le mode hors-ligne permet notamment la saisie des notes sans connexion, avec une synchronisation automatique dès que le réseau revient." 
  },
  { 
    q: lang === 'en' ? "How do parents access the platform?" : "Comment les parents accèdent-ils à la plateforme ?", 
    a: lang === 'en' ? "Parents receive a secure account to log in via phone or computer, letting them track their children's grades, absences, and payments." : "Les parents reçoivent un compte sécurisé pour se connecter via leur téléphone ou ordinateur, leur permettant de suivre notes, absences et paiements de leurs enfants." 
  },
  { 
    q: lang === 'en' ? "What's the difference between monthly and annual payment?" : "Quelle est la différence entre payer au mois et payer à l'année ?", 
    a: lang === 'en' ? "The annual subscription gives you 2 free months (pay 10 instead of 12), with access to the exact same features." : "L'abonnement annuel vous permet d'économiser 2 mois gratuits (vous payez 10 mois au lieu de 12), tout en accédant aux mêmes fonctionnalités." 
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
      className={`relative bg-slate-800 rounded-3xl border ${isPopular ? 'border-amber-500 shadow-xl shadow-amber-900/20' : 'border-slate-700'} p-6 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
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

      <button className={`w-full py-3 rounded-xl font-bold transition-colors ${
        isPopular ? 'bg-amber-500 text-slate-900 hover:bg-amber-400' : 'bg-slate-700 text-white hover:bg-slate-600'
      }`}>
        {ctaText}
      </button>
    </motion.div>
  );
}
