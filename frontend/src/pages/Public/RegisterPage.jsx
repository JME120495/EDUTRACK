import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { Eye, EyeOff, ChevronDown, Image as ImageIcon, Upload } from 'lucide-react';

const africanCountries = [
  { name: "Algérie", code: "+213" },
  { name: "Angola", code: "+244" },
  { name: "Bénin", code: "+229" },
  { name: "Botswana", code: "+267" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cameroun", code: "+237" },
  { name: "Cap-Vert", code: "+238" },
  { name: "Centrafrique", code: "+236" },
  { name: "Comores", code: "+269" },
  { name: "Congo (Brazzaville)", code: "+242" },
  { name: "Congo (RDC)", code: "+243" },
  { name: "Côte d'Ivoire", code: "+225" },
  { name: "Djibouti", code: "+253" },
  { name: "Égypte", code: "+20" },
  { name: "Érythrée", code: "+291" },
  { name: "Eswatini", code: "+268" },
  { name: "Éthiopie", code: "+251" },
  { name: "Gabon", code: "+241" },
  { name: "Gambie", code: "+220" },
  { name: "Ghana", code: "+233" },
  { name: "Guinée", code: "+224" },
  { name: "Guinée équatoriale", code: "+240" },
  { name: "Guinée-Bissau", code: "+245" },
  { name: "Kenya", code: "+254" },
  { name: "Lesotho", code: "+266" },
  { name: "Liberia", code: "+231" },
  { name: "Libye", code: "+218" },
  { name: "Madagascar", code: "+261" },
  { name: "Malawi", code: "+265" },
  { name: "Mali", code: "+223" },
  { name: "Maroc", code: "+212" },
  { name: "Maurice", code: "+230" },
  { name: "Mauritanie", code: "+222" },
  { name: "Mozambique", code: "+258" },
  { name: "Namibie", code: "+264" },
  { name: "Niger", code: "+227" },
  { name: "Nigeria", code: "+234" },
  { name: "Ouganda", code: "+256" },
  { name: "Rwanda", code: "+250" },
  { name: "Sao Tomé-et-Principe", code: "+239" },
  { name: "Sénégal", code: "+221" },
  { name: "Seychelles", code: "+248" },
  { name: "Sierra Leone", code: "+232" },
  { name: "Somalie", code: "+252" },
  { name: "Soudan", code: "+249" },
  { name: "Soudan du Sud", code: "+211" },
  { name: "Tanzanie", code: "+255" },
  { name: "Tchad", code: "+235" },
  { name: "Togo", code: "+228" },
  { name: "Tunisie", code: "+216" },
  { name: "Zambie", code: "+260" },
  { name: "Zimbabwe", code: "+263" }
];

export default function RegisterPage() {
  const { register, updateLanguage } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // School Info
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('Cameroun');
  const [phone, setPhone] = useState('+237');
  const [typeOfSchool, setTypeOfSchool] = useState('');
  const [schoolTypes, setSchoolTypes] = useState([]);
  const [city, setCity] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [currency, setCurrency] = useState('XAF');
  
  // Admin Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lang, setLang] = useState('fr');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleLanguage = (e) => {
    const nextLang = e.target.value;
    setLang(nextLang);
    updateLanguage(nextLang.toUpperCase());
  };

  const handleCountryChange = (e) => {
    const selectedName = e.target.value;
    setCountry(selectedName);
    const selectedCountry = africanCountries.find(c => c.name === selectedName);
    if (selectedCountry) {
      setPhone(selectedCountry.code + ' ');
    }
  };

  const handleTypeToggle = (val) => {
    if (schoolTypes.includes(val)) {
      setSchoolTypes(schoolTypes.filter(t => t !== val));
    } else {
      setSchoolTypes([...schoolTypes, val]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(i18n.language.toUpperCase() === 'EN' ? 'Passwords do not match.' : 'Les mots de passe ne correspondent pas.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const refCode = queryParams.get('ref') || null;

      const payload = {
        schoolName, address, country, phone, typeOfSchool, schoolTypes,
        city, studentCount, currency,
        firstName, lastName, email, password, lang: lang.toUpperCase(),
        ref: refCode
      };
      
      const res = await register(payload);
      
      if (res.requiresVerification) {
        setIsSubmitted(true);
      } else {
        setSuccess(i18n.language.toUpperCase() === 'EN' ? 'Registration successful!' : 'Inscription réussie !');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || (i18n.language.toUpperCase() === 'EN' ? 'Registration error.' : "Erreur lors de l'inscription."));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans selection:bg-amber-500 selection:text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 fixed top-0 left-0 right-0 z-50 shadow-md transition-all">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
            <span className="text-3xl">🎓</span>
            <span className="font-extrabold text-white text-2xl tracking-tight">EduTrack</span>
          </Link>
          <div className="hidden md:flex items-center justify-center space-x-2">
            <Link to="/#features" className="text-slate-300 font-semibold px-4 py-2 rounded-full hover:bg-slate-800 hover:text-amber-500 transition-colors text-sm">Fonctionnalités</Link>
            <Link to="/about" className="text-slate-300 font-semibold px-4 py-2 rounded-full hover:bg-slate-800 hover:text-amber-500 transition-colors text-sm">À propos</Link>
            <Link to="/pricing" className="text-slate-300 font-semibold px-4 py-2 rounded-full hover:bg-slate-800 hover:text-amber-500 transition-colors text-sm">Tarifs</Link>
            <Link to="/contact" className="text-slate-300 font-semibold px-4 py-2 rounded-full hover:bg-slate-800 hover:text-amber-500 transition-colors text-sm">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-amber-500 px-4 py-2 border border-amber-500 rounded-xl font-semibold hover:bg-amber-500 hover:text-slate-900 transition-all hover:-translate-y-0.5 text-sm">Se connecter</Link>
            <Link to="/register" className="hidden md:block bg-amber-500 text-slate-900 px-5 py-2 rounded-xl font-bold shadow-md hover:bg-amber-400 hover:-translate-y-0.5 transition-all text-sm">S'inscrire</Link>
          </div>
        </div>
      </header>

      {/* Floating Language Selector */}
      <div className="fixed bottom-24 right-5 md:bottom-32 md:right-10 z-50 flex items-center justify-center group">
        <select 
          className="appearance-none bg-slate-800 border border-slate-700 text-white rounded-xl px-5 py-3 text-sm font-bold cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center min-w-[80px]"
          value={lang}
          onChange={toggleLanguage}
        >
          <option value="fr">🇫🇷 FR</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12 mt-16 sm:mt-20">
        <div className="w-full max-w-4xl relative">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl -z-10"></div>

          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg">🎓</div>
            <h2 className="text-3xl font-extrabold text-white">Créer mon école</h2>
            <p className="mt-2 text-sm text-slate-400">Commencez gratuitement avec le plan GRATUIT</p>
          </div>

          {isSubmitted ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden p-10 text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Inscription Réussie !</h3>
              <p className="text-slate-300 mb-8 max-w-md mx-auto">
                Votre compte a été créé avec succès. Pour des raisons de sécurité, nous vous avons envoyé un e-mail de confirmation.
                <br /><br />
                Veuillez cliquer sur le lien contenu dans cet e-mail pour activer votre compte.
              </p>
              <Link to="/login" className="inline-block bg-amber-500 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors">
                Aller à la page de connexion
              </Link>
            </div>
          ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 py-8 sm:px-12">
              
              {error && (
                <div className="mb-6 bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-900/30 border border-green-800 rounded-lg p-4 text-green-400 text-sm">
                  {success}
                </div>
              )}

              <form className="space-y-8" onSubmit={handleRegister}>
                {/* Section 1: School Info */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Informations de l'établissement</h3>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-300">Nom de l'établissement<span className="text-red-500 ml-1">*</span></label>
                    <input type="text" required value={schoolName} onChange={e => setSchoolName(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500" placeholder="École Primaire de..." />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-300">Adresse<span className="text-red-500 ml-1">*</span></label>
                    <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500" placeholder="Adresse complète" />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="block text-sm font-medium text-slate-300">Pays *</label>
                    <div className="relative">
                      <select required value={country} onChange={handleCountryChange} className="appearance-none flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer">
                        {africanCountries.map((c, index) => (
                          <option key={index} value={c.name}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Téléphone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500" placeholder="+237 numéro de téléphone" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Secteur d'enseignement *</label>
                      <select required value={typeOfSchool} onChange={e => setTypeOfSchool(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                        <option value="">Sélectionnez le secteur</option>
                        <option value="Public">Public</option>
                        <option value="Privé">Privé</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Niveau d'enseignement * (sélectionnez un ou plusieurs)</label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={schoolTypes.includes('maternelle')} onChange={() => handleTypeToggle('maternelle')} className="rounded border-slate-700 bg-slate-900/50 text-amber-500 shadow-sm focus:ring-amber-500 w-4 h-4 cursor-pointer" />
                        <span className="ml-2 text-sm text-slate-300">Maternelle</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={schoolTypes.includes('primaire')} onChange={() => handleTypeToggle('primaire')} className="rounded border-slate-700 bg-slate-900/50 text-amber-500 shadow-sm focus:ring-amber-500 w-4 h-4 cursor-pointer" />
                        <span className="ml-2 text-sm text-slate-300">Primaire</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={schoolTypes.includes('secondaire')} onChange={() => handleTypeToggle('secondaire')} className="rounded border-slate-700 bg-slate-900/50 text-amber-500 shadow-sm focus:ring-amber-500 w-4 h-4 cursor-pointer" />
                        <span className="ml-2 text-sm text-slate-300">Secondaire</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={schoolTypes.includes('superieur')} onChange={() => handleTypeToggle('superieur')} className="rounded border-slate-700 bg-slate-900/50 text-amber-500 shadow-sm focus:ring-amber-500 w-4 h-4 cursor-pointer" />
                        <span className="ml-2 text-sm text-slate-300">Supérieur</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Ville<span className="text-red-500 ml-1">*</span></label>
                      <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500" placeholder="Ex: Douala" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Nombre d'élèves<span className="text-red-500 ml-1">*</span></label>
                      <input type="number" required min="1" value={studentCount} onChange={e => setStudentCount(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500" placeholder="Ex: 100" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Devise<span className="text-red-500 ml-1">*</span></label>
                      <div className="relative">
                        <select value={currency} onChange={e => setCurrency(e.target.value)} required className="appearance-none flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                          <option value="XAF">FCFA (CEMAC)</option>
                          <option value="XOF">FCFA (UEMOA)</option>
                          <option value="NGN">Naira (NGN)</option>
                          <option value="KES">Shilling Kényan (KES)</option>
                          <option value="ZAR">Rand (ZAR)</option>
                          <option value="MAD">Dirham Marocain (MAD)</option>
                          <option value="CDF">Franc Congolais (CDF)</option>
                          <option value="GHS">Cedi Ghanéen (GHS)</option>
                          <option value="USD">Dollar US ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Logo de l'établissement (optionnel)</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-900/30">
                      <div className="flex justify-center mb-3">
                        <ImageIcon className="h-12 w-12 text-slate-500" />
                      </div>
                      <h3 className="text-base font-medium text-white">Glissez-déposez votre image</h3>
                      <p className="text-sm text-slate-400 mt-1">ou cliquez pour parcourir</p>
                      <p className="text-xs text-slate-500 mt-2">Formats acceptés: JPG, PNG, WebP, GIF<br/>Taille maximale: 5.0MB</p>
                    </div>
                    <div className="text-center mt-4">
                      <button type="button" className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 shadow-sm px-4 py-2.5 text-sm font-medium transition-colors">
                        <Upload className="h-4 w-4 mr-2" /> Parcourir les images
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Admin Info */}
                <div className="space-y-6 pt-6 border-t border-slate-700">
                  <h3 className="text-lg font-medium text-white">Votre compte administrateur</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Prénom<span className="text-red-500 ml-1">*</span></label>
                      <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-300">Nom<span className="text-red-500 ml-1">*</span></label>
                      <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-300">Email<span className="text-red-500 ml-1">*</span></label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-500" placeholder="votre@email.com" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-300">Mot de passe<span className="text-red-500 ml-1">*</span></label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-300">Confirmer le mot de passe<span className="text-red-500 ml-1">*</span></label>
                    <div className="relative">
                      <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Langue préférée</label>
                    <select value={lang} onChange={e => setLang(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                      <option value="fr">Français</option>
                      <option value="en">Anglais</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl h-12 px-4 font-bold transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
                    {loading ? 'Création en cours...' : 'Créer mon école GRATUITEMENT'}
                  </button>
                </div>
                
                <div className="text-xs text-slate-500 text-center space-y-1 mt-4">
                  <p>En créant votre compte, vous acceptez nos conditions d'utilisation</p>
                  <p>Votre email sera vérifié avant l'activation du compte</p>
                </div>
              </form>

              <div className="mt-8 text-center border-t border-slate-700 pt-6">
                <Link to="/login" className="text-sm font-medium text-amber-500 hover:text-amber-400">
                  Vous avez déjà un compte ? Connectez-vous
                </Link>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-center md:text-left relative z-10">
          <div>
            <h4 className="text-lg font-medium mb-4 text-white">EduTrack Solutions</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Une plateforme de gestion scolaire conçue pour les écoles francophones, déployée en premier avec les écoles au Cameroun.</p>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-4 text-white">Liens rapides</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/#demo" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">Démo gratuite</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">Comment ça marche</Link></li>
              <li><Link to="/#features" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">Fonctionnalités</Link></li>
              <li><Link to="/login" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="tel:+237691003392" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">+237 691 00 33 92 / +237 681 62 55 20</a></li>
              <li><a href="mailto:contact@edutrack.com" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">contact@edutrack.com</a></li>
              <li><a href="https://wa.me/237691003392" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 hover:translate-x-1 transition-all inline-block">WhatsApp Direct</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-4 text-white">Nos bureaux</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Yaoundé, Cameroun<br />
              Emana
            </p>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-5 border-t border-slate-800 pt-6 mt-6 text-center text-sm text-slate-500 relative z-10">
          <p className="mb-2">© {new Date().getFullYear()} EduTrack. Tous droits réservés.</p>
          <p className="italic">"Moins de travail manuel. Un suivi scolaire plus clair."</p>
        </div>
      </footer>
    </div>
  );
}
