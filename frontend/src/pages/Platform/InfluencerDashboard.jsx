import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { 
  Building2, DollarSign, Activity, LogOut, Copy, CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ schoolsCount: 0, totalEarned: 0, referralCode: '', schools: [], earnings: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/platform/influencer/dashboard', { usePlatformToken: true });
      setData(res);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleLogout();
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_user');
    navigate('/platform/login');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>;
  }

  // Monthly earnings data for chart (mock up based on history)
  // We will just display the earnings history in a table since date grouping might be complex.

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-inter">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                ET
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Espace Partenaire</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Connecté en tant que Affilié</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut size={16} /> Quitter
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome & Code Section */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 mb-8 border border-indigo-500/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue dans votre Espace Partenaire</h1>
            <p className="text-indigo-200 text-lg">Partagez EduTrack et gagnez des commissions sur chaque école abonnée.</p>
          </div>
          <div className="bg-black/20 p-5 rounded-2xl border border-white/10 backdrop-blur-sm min-w-[300px]">
            <p className="text-sm text-indigo-200 font-medium mb-2 uppercase tracking-wider">Votre Code de Parrainage</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900 px-4 py-3 rounded-xl font-mono text-xl text-white font-bold border border-indigo-500/30">
                {data.referralCode}
              </div>
              <button 
                onClick={copyCode}
                className="p-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white transition-colors"
                title="Copier le code"
              >
                {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Gains Totaux</p>
                <h3 className="text-4xl font-bold text-white mt-2">{(data.totalEarned || 0).toLocaleString()} FCFA</h3>
              </div>
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <DollarSign size={32} />
              </div>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Écoles Parrainées</p>
                <h3 className="text-4xl font-bold text-white mt-2">{data.schoolsCount || 0}</h3>
              </div>
              <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Building2 size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schools List */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 size={20} className="text-indigo-400"/> Vos Écoles
              </h2>
            </div>
            <div className="p-0">
              {data.schools && data.schools.length > 0 ? (
                <ul className="divide-y divide-slate-700">
                  {data.schools.map((school) => (
                    <li key={school.id} className="p-5 hover:bg-slate-700/20 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{school.name}</p>
                        <p className="text-sm text-slate-400 mt-1">Inscrite le {new Date(school.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
                        {school.subscriptionPlan}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Vous n'avez pas encore parrainé d'école.</p>
                  <p className="text-sm mt-1">Partagez votre code {data.referralCode} !</p>
                </div>
              )}
            </div>
          </div>

          {/* Earnings History */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity size={20} className="text-emerald-400"/> Historique des Commissions
              </h2>
            </div>
            <div className="p-0">
              {data.earnings && data.earnings.length > 0 ? (
                <ul className="divide-y divide-slate-700">
                  {data.earnings.map((earning) => (
                    <li key={earning.id} className="p-5 hover:bg-slate-700/20 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">Paiement de {earning.school?.name}</p>
                        <p className="text-sm text-slate-400 mt-1">{new Date(earning.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">+{earning.commission.toLocaleString()} FCFA</p>
                        <p className="text-xs text-slate-500 mt-1">Payé: {earning.amountPaid.toLocaleString()} FCFA</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Aucune commission enregistrée pour l'instant.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
