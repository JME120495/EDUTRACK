import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { 
  Building2, Users, DollarSign, Activity, Settings, LogOut, 
  CheckCircle, XCircle, Search, Edit2, Trash2, Plus, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ schools: [], influencers: [], totalRevenue: 0, totalCommissionsPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals state
  const [showInfModal, setShowInfModal] = useState(false);
  const [newInf, setNewInf] = useState({ name: '', email: '', password: '', commissionRate: 30 });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/platform/admin/dashboard', { usePlatformToken: true });
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

  const toggleSchoolStatus = async (id) => {
    if (!window.confirm("Voulez-vous vraiment changer le statut de cette école ?")) return;
    try {
      await apiFetch(`/platform/admin/schools/${id}/toggle-status`, { 
        method: 'PUT',
        usePlatformToken: true 
      });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const changeSchoolPlan = async (id, plan) => {
    try {
      await apiFetch(`/platform/admin/schools/${id}/plan`, {
        method: 'PUT',
        body: { subscriptionPlan: plan },
        usePlatformToken: true
      });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteSchool = async (id) => {
    if (!window.confirm("ATTENTION: Cela supprimera l'école et toutes ses données ! Continuer ?")) return;
    try {
      await apiFetch(`/platform/admin/schools/${id}`, {
        method: 'DELETE',
        usePlatformToken: true
      });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const createInfluencer = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/platform/admin/influencers', {
        method: 'POST',
        body: newInf,
        usePlatformToken: true
      });
      setShowInfModal(false);
      setNewInf({ name: '', email: '', password: '', commissionRate: 30 });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteInfluencer = async (id) => {
    if (!window.confirm("Supprimer cet influenceur ?")) return;
    try {
      await apiFetch(`/platform/admin/influencers/${id}`, {
        method: 'DELETE',
        usePlatformToken: true
      });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>;
  }

  // Stats for charts
  const schoolPlansData = [
    { name: 'Essential', count: data.schools.filter(s => s.subscriptionPlan === 'ESSENTIAL').length },
    { name: 'Standard', count: data.schools.filter(s => s.subscriptionPlan === 'STANDARD').length },
    { name: 'Premium', count: data.schools.filter(s => s.subscriptionPlan === 'PREMIUM').length },
    { name: 'Custom', count: data.schools.filter(s => s.subscriptionPlan === 'CUSTOM').length }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-inter">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700 shadow-xl z-20">
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            ET
          </div>
          <span className="font-bold text-xl text-white tracking-tight">EduTrack SaaS</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <Activity size={20} /> Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab('schools')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'schools' ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <Building2 size={20} /> Écoles ({data.schools.length})
          </button>
          <button 
            onClick={() => setActiveTab('influencers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'influencers' ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <Users size={20} /> Influenceurs ({data.influencers?.length || 0})
          </button>
        </nav>
        
        <div className="absolute bottom-0 left-0 w-full p-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Espace SuperAdmin</h1>
            <p className="text-slate-400 mt-1">Gérez la plateforme EduTrack, les écoles et les abonnements.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800 px-5 py-2.5 rounded-full border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 font-bold">A</div>
            <span className="font-medium">Admin Principal</span>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Revenu Total</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{data.totalRevenue.toLocaleString()} FCFA</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <DollarSign size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Commissions Payées</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{data.totalCommissionsPaid.toLocaleString()} FCFA</h3>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                    <ArrowUpRight size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Écoles Actives</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{data.schools.filter(s => s.isActive).length}</h3>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Building2 size={24} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Influenceurs</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{data.totalInfluencers}</h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                    <Users size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96">
                <h3 className="text-lg font-medium text-white mb-6">Répartition des Forfaits</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={schoolPlansData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96 overflow-hidden flex flex-col">
                <h3 className="text-lg font-medium text-white mb-4">Dernières Écoles Inscrites</h3>
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-3">
                    {data.schools.slice(0, 5).map(school => (
                      <div key={school.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{school.name}</span>
                          <span className="text-sm text-slate-400">{school.city || 'Ville non précisée'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-md">
                            {school.subscriptionPlan}
                          </span>
                          <span className="text-sm text-slate-400">
                            {new Date(school.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Gestion des Écoles</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher une école..." 
                  className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nom de l'école</th>
                    <th className="px-6 py-4 font-medium">Contact</th>
                    <th className="px-6 py-4 font-medium">Forfait</th>
                    <th className="px-6 py-4 font-medium">Statut</th>
                    <th className="px-6 py-4 font-medium">Affilié par</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {data.schools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{school.name}</div>
                        <div className="text-sm text-slate-400">{school.city || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{school.email || '-'}</div>
                        <div className="text-sm text-slate-400">{school.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={school.subscriptionPlan}
                          onChange={(e) => changeSchoolPlan(school.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                        >
                          <option value="ESSENTIAL">Essential</option>
                          <option value="STANDARD">Standard</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSchoolStatus(school.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                            school.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {school.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {school.isActive ? 'Actif' : 'Bloqué'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {school.referredBy?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteSchool(school.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Supprimer l'école"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.schools.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                        Aucune école inscrite pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'influencers' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Influenceurs / Apporteurs d'affaires</h2>
              <button 
                onClick={() => setShowInfModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Plus size={18} /> Nouvel Influenceur
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Influenceur</th>
                    <th className="px-6 py-4 font-medium">Code Parrainage</th>
                    <th className="px-6 py-4 font-medium">Commission (%)</th>
                    <th className="px-6 py-4 font-medium">Écoles Référées</th>
                    <th className="px-6 py-4 font-medium">Gains Totaux</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {data.influencers?.map((inf) => (
                    <tr key={inf.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{inf.name}</div>
                        <div className="text-sm text-slate-400">{inf.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-slate-900 px-2 py-1 rounded text-indigo-300 border border-slate-700">
                          {inf.referralCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {inf.commissionRate}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-slate-400" />
                          <span className="font-medium">{inf.schoolsCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-medium">{(inf.totalEarned || 0).toLocaleString()} FCFA</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteInfluencer(inf.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data.influencers || data.influencers.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                        Aucun influenceur trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nouvel Influenceur */}
      {showInfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Ajouter un Influenceur</h2>
              <button onClick={() => setShowInfModal(false)} className="text-slate-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={createInfluencer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nom complet</label>
                <input 
                  type="text" 
                  required
                  value={newInf.name}
                  onChange={e => setNewInf({...newInf, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={newInf.email}
                  onChange={e => setNewInf({...newInf, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe temporaire</label>
                <input 
                  type="password" 
                  required
                  value={newInf.password}
                  onChange={e => setNewInf({...newInf, password: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Taux de Commission (%)</label>
                <input 
                  type="number" 
                  required
                  min="0" max="100"
                  value={newInf.commissionRate}
                  onChange={e => setNewInf({...newInf, commissionRate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowInfModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Créer l'influenceur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
