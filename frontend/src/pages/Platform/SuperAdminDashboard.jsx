import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { 
  Users, DollarSign, Activity, LogOut, Plus, ShieldCheck, Key
} from 'lucide-react';
import PlatformChangePasswordModal from '../../components/Platform/PlatformChangePasswordModal';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Create Influencer form
  const [activeTab, setActiveTab] = useState('influencers');
  const [showCreate, setShowCreate] = useState(false);
  const [newInf, setNewInf] = useState({ name: '', email: '', password: '', referralCode: '', commissionRate: 30 });
  const [creating, setCreating] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);
  const [newCommissionValue, setNewCommissionValue] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('platform_user') || '{}');

  const fetchData = async () => {
    const token = localStorage.getItem('platform_token');
    if (!token || user.role !== 'SUPER_ADMIN') {
      navigate('/platform/login');
      return;
    }

    try {
      const d = await apiFetch('/platform/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const res = await apiFetch('/platform/admin/influencers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: newInf
      });
      if (res) {
        setShowCreate(false);
        setNewInf({ name: '', email: '', password: '', referralCode: '', commissionRate: 30 });
        fetchData();
      }
    } catch (err) {
      alert(err.message || "Erreur réseau");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCommission = async (id, currentRate) => {
    const newRate = prompt("Nouveau pourcentage de commission (%) :", currentRate);
    if (!newRate || isNaN(newRate) || newRate < 0 || newRate > 100) return;
    
    const token = localStorage.getItem('platform_token');
    try {
      await apiFetch(`/platform/admin/influencers/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: { commissionRate: parseFloat(newRate) }
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteInfluencer = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet influenceur ? Cette action est irréversible.")) return;
    const token = localStorage.getItem('platform_token');
    try {
      await apiFetch(`/platform/admin/influencers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleSchoolStatus = async (id) => {
    const token = localStorage.getItem('platform_token');
    try {
      await apiFetch(`/platform/admin/schools/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert(err.message);
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
      <PlatformChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
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
        <div className="flex items-center gap-6">
          <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium">
            <Key className="h-4 w-4" /> Mot de passe
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-medium">
            <LogOut className="h-5 w-5" /> Déconnexion
          </button>
        </div>
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

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('influencers')}
            className={`pb-4 px-2 font-bold ${activeTab === 'influencers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Influenceurs
          </button>
          <button 
            onClick={() => setActiveTab('schools')}
            className={`pb-4 px-2 font-bold ${activeTab === 'schools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Écoles Inscrites
          </button>
        </div>

        {activeTab === 'influencers' && (
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
                <form onSubmit={handleCreateInfluencer} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nom complet</label>
                    <input type="text" required value={newInf.name} onChange={e => setNewInf({...newInf, name: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Jean Dupont"/>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input type="email" required value={newInf.email} onChange={e => setNewInf({...newInf, email: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="jean@email.com"/>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mot de passe</label>
                    <input type="password" required value={newInf.password} onChange={e => setNewInf({...newInf, password: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="••••••••"/>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Taux (%)</label>
                    <input type="number" required min="0" max="100" value={newInf.commissionRate} onChange={e => setNewInf({...newInf, commissionRate: e.target.value})} className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="30"/>
                  </div>
                  <div className="col-span-1">
                    <button type="submit" disabled={creating} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                      {creating ? '...' : 'Créer'}
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
                    <th className="px-6 py-4 text-center">Taux</th>
                    <th className="px-6 py-4">Code Parrainage</th>
                    <th className="px-6 py-4 text-center">Écoles Apportées</th>
                    <th className="px-6 py-4 text-right">Gains Générés</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.influencers.map(inf => (
                    <tr key={inf.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{inf.name}</div>
                        <div className="text-sm text-slate-500">{inf.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {editingCommission === inf.id ? (
                          <div className="flex items-center gap-2 justify-center">
                            <input 
                              type="number" 
                              className="w-16 p-1 border rounded text-center text-sm" 
                              value={newCommissionValue} 
                              onChange={e => setNewCommissionValue(e.target.value)} 
                            />
                            <button onClick={() => handleUpdateCommission(inf.id)} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded">OK</button>
                            <button onClick={() => setEditingCommission(null)} className="text-xs bg-slate-300 text-slate-700 px-2 py-1 rounded">X</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-indigo-600">{inf.commissionRate}%</span>
                            <button onClick={() => { setEditingCommission(inf.id); setNewCommissionValue(inf.commissionRate); }} className="text-xs text-indigo-500 hover:underline">Modifier</button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 font-mono px-2 py-1 rounded-md text-sm border border-slate-200">{inf.referralCode}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{inf.schoolsCount}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{inf.totalEarned.toLocaleString()} FCFA</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteInfluencer(inf.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                  {data.influencers.length === 0 && (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Aucun influenceur n'est encore enregistré.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Écoles Inscrites sur EduTrack</h3>
            </div>
            <div className="p-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">École</th>
                    <th className="px-6 py-4">Plan & Date</th>
                    <th className="px-6 py-4">Parrainé Par</th>
                    <th className="px-6 py-4 text-right">Statut / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.schools && data.schools.map(school => (
                    <tr key={school.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{school.name}</div>
                        <div className="text-sm text-slate-500">{school.email || 'Aucun email'} • {school.phone || 'Aucun tel'}</div>
                        <div className="text-xs text-slate-400">{school.city || 'Ville inconnue'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md text-xs">{school.subscriptionPlan}</span>
                        <div className="text-xs text-slate-500 mt-1">
                          Inscrite le: {new Date(school.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {school.referredBy ? school.referredBy.name : <span className="text-slate-400 italic">Aucun parrain</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${school.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {school.isActive ? 'ACTIF' : 'BLOQUÉ'}
                          </span>
                          <button 
                            onClick={() => handleToggleSchoolStatus(school.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${school.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            {school.isActive ? 'Bloquer l\'accès' : 'Valider / Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!data.schools || data.schools.length === 0) && (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Aucune école n'est encore enregistrée.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
