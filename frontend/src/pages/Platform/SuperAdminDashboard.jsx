import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, Activity, LogOut, Plus, ShieldCheck
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Create Influencer form
  const [showCreate, setShowCreate] = useState(false);
  const [newInf, setNewInf] = useState({ name: '', email: '', password: '', referralCode: '' });
  const [creating, setCreating] = useState(false);

  const user = JSON.parse(localStorage.getItem('platform_user') || '{}');

  const fetchData = async () => {
    const token = localStorage.getItem('platform_token');
    if (!token || user.role !== 'SUPER_ADMIN') {
      navigate('/platform/login');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/platform/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      setData(d);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate, user.role]);

  const handleCreateInfluencer = async (e) => {
    e.preventDefault();
    setCreating(true);
    const token = localStorage.getItem('platform_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/platform/admin/influencers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newInf)
      });
      if (res.ok) {
        setShowCreate(false);
        setNewInf({ name: '', email: '', password: '', referralCode: '' });
        fetchData();
      } else {
        const d = await res.json();
        alert(d.message || "Erreur création");
      }
    } catch (err) {
      alert("Erreur réseau");
    } finally {
      setCreating(false);
    }
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
          <div className="bg-slate-800 p-2 rounded-xl text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-outfit">Super-Admin Portal</h1>
            <p className="text-sm text-slate-500">Contrôle global EduTrack</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-medium">
          <LogOut className="h-5 w-5" /> Déconnexion
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Total Influenceurs</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{data.totalInfluencers}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Revenus Générés (Écoles affiliées)</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{data.totalRevenue.toLocaleString()} FCFA</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-purple-100 text-purple-600 p-4 rounded-2xl">
              <DollarSign className="h-8 w-8" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">Commissions Dues / Payées</p>
              <h3 className="text-2xl font-extrabold text-slate-800">{data.totalCommissionsPaid.toLocaleString()} FCFA</h3>
            </div>
          </div>
        </div>

        {/* Influencers Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Réseau d'Influenceurs</h3>
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Nouvel Influenceur
            </button>
          </div>

          {showCreate && (
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <form onSubmit={handleCreateInfluencer} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nom complet</label>
                  <input type="text" required value={newInf.name} onChange={e => setNewInf({...newInf, name: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Jean Dupont"/>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" required value={newInf.email} onChange={e => setNewInf({...newInf, email: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="jean@email.com"/>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mot de passe</label>
                  <input type="password" required value={newInf.password} onChange={e => setNewInf({...newInf, password: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="••••••••"/>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Code Ref (Optionnel)</label>
                  <input type="text" value={newInf.referralCode} onChange={e => setNewInf({...newInf, referralCode: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="CODE123"/>
                </div>
                <div className="col-span-1">
                  <button type="submit" disabled={creating} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                    {creating ? 'Création...' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-0 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Influenceur</th>
                  <th className="px-6 py-4">Code Parrainage</th>
                  <th className="px-6 py-4 text-center">Écoles Apportées</th>
                  <th className="px-6 py-4 text-right">Gains Générés (20%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.influencers.map(inf => (
                  <tr key={inf.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{inf.name}</div>
                      <div className="text-sm text-slate-500">{inf.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 font-mono px-2 py-1 rounded-md text-sm border border-slate-200">{inf.referralCode}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{inf.schoolsCount}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{inf.totalEarned.toLocaleString()} FCFA</td>
                  </tr>
                ))}
                {data.influencers.length === 0 && (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Aucun influenceur n'est encore enregistré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
