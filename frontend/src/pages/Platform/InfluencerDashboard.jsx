import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, Copy, CheckCircle2,
  LogOut, Link as LinkIcon, Building2
} from 'lucide-react';

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const user = JSON.parse(localStorage.getItem('platform_user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('platform_token');
    if (!token || user.role !== 'INFLUENCER') {
      navigate('/platform/login');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/platform/influencer/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate, user.role]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/register?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_user');
    navigate('/platform/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-outfit">Influencer Portal</h1>
            <p className="text-sm text-slate-500">Bienvenue, {user.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-medium">
          <LogOut className="h-5 w-5" /> Déconnexion
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Votre Lien de Parrainage</h2>
            <p className="text-indigo-100 mb-6 max-w-2xl">Partagez ce lien avec des écoles. Lorsqu'elles s'inscrivent et paient leur abonnement, vous recevez automatiquement 20% de commission à vie.</p>
            
            <div className="flex items-center gap-3 max-w-2xl bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-sm">
              <div className="bg-white/20 p-2 rounded-xl">
                <LinkIcon className="h-5 w-5" />
              </div>
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/register?ref=${data.referralCode}`}
                className="bg-transparent border-none text-white font-medium focus:ring-0 w-full outline-none"
              />
              <button 
                onClick={handleCopyLink}
                className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shrink-0"
              >
                {copied ? <><CheckCircle2 className="h-4 w-4" /> Copié</> : <><Copy className="h-4 w-4" /> Copier</>}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl">
              <DollarSign className="h-8 w-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Gains Totaux Générés</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{data.totalEarned.toLocaleString()} FCFA</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Écoles Parrainées</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{data.schoolsCount}</h3>
            </div>
          </div>
        </div>

        {/* History Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Écoles Affiliées</h3>
            </div>
            <div className="p-0 overflow-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="px-6 py-4">École</th>
                    <th className="px-6 py-4">Plan Actuel</th>
                    <th className="px-6 py-4">Inscrite le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.schools.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{s.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{s.subscriptionPlan}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {data.schools.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">Aucune école parrainée pour le moment.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Historique des Gains</h3>
            </div>
            <div className="p-0 overflow-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">École</th>
                    <th className="px-6 py-4 text-right">Commission (20%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.earnings.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{e.school.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">+{e.commission.toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                  {data.earnings.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">Aucun gain enregistré pour le moment.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
