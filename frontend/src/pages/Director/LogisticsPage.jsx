import React, { useState, useEffect } from 'react';
import { Truck, Utensils, Bus, Plus, Trash2, Edit2, Users, Search, AlertCircle, Phone, FileText, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../../api';

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('transport'); // 'transport' or 'canteen'
  const [transportSubTab, setTransportSubTab] = useState('routes'); // 'routes' or 'subs'
  
  // Data state
  const [routes, setRoutes] = useState([]);
  const [transportSubs, setTransportSubs] = useState([]);
  const [canteenSubs, setCanteenSubs] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isTransportSubModalOpen, setIsTransportSubModalOpen] = useState(false);
  const [isCanteenSubModalOpen, setIsCanteenSubModalOpen] = useState(false);

  // Forms state
  const [editingRoute, setEditingRoute] = useState(null);
  const [editingSub, setEditingSub] = useState(null);

  // Search states for transport/canteen modals
  const [transportSearch, setTransportSearch] = useState('');
  const [selectedTransportEleveId, setSelectedTransportEleveId] = useState('');
  const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);

  const [canteenSearch, setCanteenSearch] = useState('');
  const [selectedCanteenEleveId, setSelectedCanteenEleveId] = useState('');
  const [isCanteenDropdownOpen, setIsCanteenDropdownOpen] = useState(false);

  // Reset search states on modal open/close
  useEffect(() => {
    if (!isTransportSubModalOpen) {
      setTransportSearch('');
      setSelectedTransportEleveId('');
      setIsTransportDropdownOpen(false);
    }
  }, [isTransportSubModalOpen]);

  useEffect(() => {
    if (!isCanteenSubModalOpen) {
      setCanteenSearch('');
      setSelectedCanteenEleveId('');
      setIsCanteenDropdownOpen(false);
    }
  }, [isCanteenSubModalOpen]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, tsRes, csRes, eRes] = await Promise.all([
        apiFetch('/logistics/transport/routes'),
        apiFetch('/logistics/transport/subscriptions'),
        apiFetch('/logistics/canteen/subscriptions'),
        apiFetch('/eleves')
      ]);
      setRoutes(rRes || []);
      setTransportSubs(tsRes || []);
      setCanteenSubs(csRes || []);
      setEleves(eRes || []);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des données logistiques.");
    } finally {
      setLoading(false);
    }
  };

  // --- TRANSPORT ROUTES ACTIONS ---
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      if (editingRoute) {
        await apiFetch(`/logistics/transport/routes/${editingRoute.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/logistics/transport/routes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsRouteModalOpen(false);
      setEditingRoute(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la ligne.");
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm("Supprimer cette ligne de transport ? Tous les abonnements liés seront supprimés.")) return;
    try {
      await apiFetch(`/logistics/transport/routes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  // --- TRANSPORT SUBS ACTIONS ---
  const handleSaveTransportSub = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      if (editingSub) {
        await apiFetch(`/logistics/transport/subscriptions/${editingSub.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/logistics/transport/subscriptions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsTransportSubModalOpen(false);
      setEditingSub(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Erreur lors de l'abonnement.");
    }
  };

  const handleDeleteTransportSub = async (id) => {
    if (!window.confirm("Supprimer cet abonnement ?")) return;
    try {
      await apiFetch(`/logistics/transport/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  // --- CANTEEN SUBS ACTIONS ---
  const handleSaveCanteenSub = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    try {
      if (editingSub) {
        await apiFetch(`/logistics/canteen/subscriptions/${editingSub.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/logistics/canteen/subscriptions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsCanteenSubModalOpen(false);
      setEditingSub(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Erreur lors de l'abonnement.");
    }
  };

  const handleDeleteCanteenSub = async (id) => {
    if (!window.confirm("Supprimer cet abonnement ?")) return;
    try {
      await apiFetch(`/logistics/canteen/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1E3A5F] flex items-center gap-3">
            <Truck className="h-7 w-7 text-indigo-500" />
            Logistique
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestion du transport scolaire et de la cantine</p>
        </div>
      </div>

      {/* MAIN TABS */}
      <div className="flex bg-slate-100/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('transport')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'transport' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bus className="h-4 w-4" />
          Transport Scolaire
        </button>
        <button
          onClick={() => setActiveTab('canteen')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'canteen' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Utensils className="h-4 w-4" />
          Cantine
        </button>
      </div>

      {/* -------------------- TRANSPORT TAB -------------------- */}
      {activeTab === 'transport' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subtabs for Transport */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTransportSubTab('routes')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                transportSubTab === 'routes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Lignes de Bus
            </button>
            <button
              onClick={() => setTransportSubTab('subs')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                transportSubTab === 'subs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Élèves Abonnés
            </button>
          </div>

          {/* LIGNES DE BUS */}
          {transportSubTab === 'routes' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700">Lignes de Transport configurées</h3>
                <button
                  onClick={() => { setEditingRoute(null); setIsRouteModalOpen(true); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Nouvelle Ligne
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">Ligne</th>
                      <th className="px-6 py-4">Chauffeur</th>
                      <th className="px-6 py-4">Tarif Mensuel</th>
                      <th className="px-6 py-4 text-center">Abonnés</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routes.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{r.name}</div>
                          {r.busNumber && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Bus className="h-3 w-3"/> Plaque: {r.busNumber}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700">{r.driverName || '-'}</div>
                          {r.driverPhone && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone className="h-3 w-3"/> {r.driverPhone}</div>}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{r.fee ? `${r.fee} FCFA` : 'Gratuit'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                            <Users className="h-3.5 w-3.5" />
                            {r._count?.subscriptions || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setEditingRoute(r); setIsRouteModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2"><Edit2 className="h-4 w-4"/></button>
                          <button onClick={() => handleDeleteRoute(r.id)} className="text-slate-400 hover:text-rose-600 p-2 ml-1"><Trash2 className="h-4 w-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {routes.length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Aucune ligne configurée.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABONNÉS AU BUS */}
          {transportSubTab === 'subs' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700">Abonnements Élèves au Transport</h3>
                <button
                  onClick={() => { setEditingSub(null); setIsTransportSubModalOpen(true); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Ajouter un Abonné
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">Élève</th>
                      <th className="px-6 py-4">Classe</th>
                      <th className="px-6 py-4">Ligne de Bus</th>
                      <th className="px-6 py-4">Type / Point de ramassage</th>
                      <th className="px-6 py-4 text-center">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transportSubs.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{s.eleve.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.eleve.matricule}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{s.eleve.class.name}</td>
                        <td className="px-6 py-4 font-bold text-indigo-700">{s.route.name}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-700">
                            {s.type === 'MORNING_ONLY' ? 'Matin uniquement' : s.type === 'AFTERNOON_ONLY' ? 'Soir uniquement' : 'Aller - Retour'}
                          </div>
                          {s.pickupPoint && <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {s.pickupPoint}</div>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.status === 'ACTIVE' 
                            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle className="h-3 w-3"/> Actif</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider"><XCircle className="h-3 w-3"/> Inactif</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setEditingSub(s); setIsTransportSubModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2"><Edit2 className="h-4 w-4"/></button>
                          <button onClick={() => handleDeleteTransportSub(s.id)} className="text-slate-400 hover:text-rose-600 p-2 ml-1"><Trash2 className="h-4 w-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {transportSubs.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Aucun abonnement trouvé.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- CANTINE TAB -------------------- */}
      {activeTab === 'canteen' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><Utensils className="h-5 w-5 text-orange-500"/> Abonnements Cantine</h3>
              <button
                onClick={() => { setEditingSub(null); setIsCanteenSubModalOpen(true); }}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Inscrire un Élève
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Élève</th>
                    <th className="px-6 py-4">Classe</th>
                    <th className="px-6 py-4">Notes Diététiques / Allergies</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canteenSubs.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{s.eleve.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.eleve.matricule}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{s.eleve.class.name}</td>
                      <td className="px-6 py-4">
                        {s.dietaryNotes ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                            <AlertCircle className="h-4 w-4" />
                            {s.dietaryNotes}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Aucune note</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.status === 'ACTIVE' 
                          ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle className="h-3 w-3"/> Actif</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider"><XCircle className="h-3 w-3"/> Inactif</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setEditingSub(s); setIsCanteenSubModalOpen(true); }} className="text-slate-400 hover:text-orange-600 p-2"><Edit2 className="h-4 w-4"/></button>
                        <button onClick={() => handleDeleteCanteenSub(s.id)} className="text-slate-400 hover:text-rose-600 p-2 ml-1"><Trash2 className="h-4 w-4"/></button>
                      </td>
                    </tr>
                  ))}
                  {canteenSubs.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Aucun abonné à la cantine.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* -------------------- MODALS -------------------- */}
      
      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-800">{editingRoute ? 'Modifier la Ligne' : 'Nouvelle Ligne de Transport'}</h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSaveRoute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom de la Ligne *</label>
                <input required name="name" defaultValue={editingRoute?.name} placeholder="Ex: Ligne 1 - Centre Ville" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all font-medium text-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Plaque d'immatriculation</label>
                  <input name="busNumber" defaultValue={editingRoute?.busNumber} placeholder="Ex: CE 1234 A" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tarif mensuel (FCFA)</label>
                  <input type="number" name="fee" defaultValue={editingRoute?.fee} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom du Chauffeur</label>
                  <input name="driverName" defaultValue={editingRoute?.driverName} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tél du Chauffeur</label>
                  <input name="driverPhone" defaultValue={editingRoute?.driverPhone} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transport Subscription Modal */}
      {isTransportSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-800">{editingSub ? "Modifier l'Abonnement" : "Nouvel Abonnement Transport"}</h3>
              <button onClick={() => setIsTransportSubModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSaveTransportSub} className="p-6 space-y-4">
              {!editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Élève *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Rechercher un élève..." 
                      value={transportSearch}
                      onChange={(e) => {
                        setTransportSearch(e.target.value);
                        setIsTransportDropdownOpen(true);
                      }}
                      onFocus={() => setIsTransportDropdownOpen(true)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                    <input type="hidden" name="eleveId" value={selectedTransportEleveId} required />
                    
                    {isTransportDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsTransportDropdownOpen(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-50">
                          {eleves
                            .filter(e => {
                              const q = transportSearch.toLowerCase();
                              return e.name.toLowerCase().includes(q) || (e.matricule && e.matricule.toLowerCase().includes(q)) || (e.class.name && e.class.name.toLowerCase().includes(q));
                            })
                            .map(e => (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTransportEleveId(e.id);
                                  setTransportSearch(`${e.name} (${e.class.name})`);
                                  setIsTransportDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{e.name}</span>
                                  <span className="text-xs text-slate-500 ml-1.5">({e.class.name})</span>
                                </div>
                                {e.matricule && <span className="text-[10px] font-mono text-slate-400">{e.matricule}</span>}
                              </button>
                            ))}
                          {eleves.filter(e => {
                            const q = transportSearch.toLowerCase();
                            return e.name.toLowerCase().includes(q) || (e.matricule && e.matricule.toLowerCase().includes(q)) || (e.class.name && e.class.name.toLowerCase().includes(q));
                          }).length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">Aucun élève trouvé</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ligne de Bus *</label>
                <select required name="routeId" defaultValue={editingSub?.routeId} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-indigo-700">
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name} - {r.fee} FCFA</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type de trajet *</label>
                  <select required name="type" defaultValue={editingSub?.type || 'BOTH'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm">
                    <option value="BOTH">Aller et Retour</option>
                    <option value="MORNING_ONLY">Matin uniquement</option>
                    <option value="AFTERNOON_ONLY">Soir uniquement</option>
                  </select>
                </div>
                {editingSub && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Statut</label>
                    <select name="status" defaultValue={editingSub?.status} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm">
                      <option value="ACTIVE">Actif</option>
                      <option value="INACTIVE">Inactif</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Point de ramassage (Indicatif)</label>
                <input name="pickupPoint" defaultValue={editingSub?.pickupPoint} placeholder="Ex: Carrefour Total, Devant la pharmacie..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsTransportSubModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canteen Subscription Modal */}
      {isCanteenSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Utensils className="h-5 w-5 text-orange-500"/> {editingSub ? 'Modifier Inscription' : 'Inscription Cantine'}</h3>
              <button onClick={() => setIsCanteenSubModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSaveCanteenSub} className="p-6 space-y-4">
              {!editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Élève *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Rechercher un élève..." 
                      value={canteenSearch}
                      onChange={(e) => {
                        setCanteenSearch(e.target.value);
                        setIsCanteenDropdownOpen(true);
                      }}
                      onFocus={() => setIsCanteenDropdownOpen(true)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm font-medium"
                    />
                    <input type="hidden" name="eleveId" value={selectedCanteenEleveId} required />
                    
                    {isCanteenDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsCanteenDropdownOpen(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-50">
                          {eleves
                            .filter(e => {
                              const q = canteenSearch.toLowerCase();
                              return e.name.toLowerCase().includes(q) || (e.matricule && e.matricule.toLowerCase().includes(q)) || (e.class.name && e.class.name.toLowerCase().includes(q));
                            })
                            .map(e => (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCanteenEleveId(e.id);
                                  setCanteenSearch(`${e.name} (${e.class.name})`);
                                  setIsCanteenDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{e.name}</span>
                                  <span className="text-xs text-slate-500 ml-1.5">({e.class.name})</span>
                                </div>
                                {e.matricule && <span className="text-[10px] font-mono text-slate-400">{e.matricule}</span>}
                              </button>
                            ))}
                          {eleves.filter(e => {
                            const q = canteenSearch.toLowerCase();
                            return e.name.toLowerCase().includes(q) || (e.matricule && e.matricule.toLowerCase().includes(q)) || (e.class.name && e.class.name.toLowerCase().includes(q));
                          }).length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">Aucun élève trouvé</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes diététiques / Allergies (Optionnel)</label>
                <textarea 
                  name="dietaryNotes" 
                  defaultValue={editingSub?.dietaryNotes} 
                  rows="3" 
                  placeholder="Ex: Allergie aux arachides, Végétarien..." 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm resize-none" 
                />
              </div>

              {editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Statut</label>
                  <select name="status" defaultValue={editingSub?.status} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm">
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCanteenSubModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
