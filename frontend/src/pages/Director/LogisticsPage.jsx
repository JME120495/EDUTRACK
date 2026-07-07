import React, { useState, useEffect } from 'react';
import { Truck, Utensils, Bus, Plus, Trash2, Edit2, Users, Search, AlertCircle, Phone, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';

export default function LogisticsPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language?.toLowerCase().startsWith('fr');

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
      alert(isFr ? "Erreur lors du chargement des données logistiques." : "Error loading logistics data.");
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
      alert(isFr ? "Erreur lors de l'enregistrement de la ligne." : "Error saving route.");
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm(isFr ? "Supprimer cette ligne de transport ? Tous les abonnements liés seront supprimés." : "Delete this transport route? All linked subscriptions will be deleted.")) return;
    try {
      await apiFetch(`/logistics/transport/routes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(isFr ? "Erreur lors de la suppression." : "Error during deletion.");
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
      alert(err.message || (isFr ? "Erreur lors de l'abonnement." : "Error subscribing."));
    }
  };

  const handleDeleteTransportSub = async (id) => {
    if (!window.confirm(isFr ? "Supprimer cet abonnement ?" : "Delete this subscription?")) return;
    try {
      await apiFetch(`/logistics/transport/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(isFr ? "Erreur lors de la suppression." : "Error during deletion.");
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
      alert(err.message || (isFr ? "Erreur lors de l'abonnement." : "Error subscribing."));
    }
  };

  const handleDeleteCanteenSub = async (id) => {
    if (!window.confirm(isFr ? "Supprimer cet abonnement ?" : "Delete this subscription?")) return;
    try {
      await apiFetch(`/logistics/canteen/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(isFr ? "Erreur lors de la suppression." : "Error during deletion.");
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
            {isFr ? "Logistique" : "Logistics"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{isFr ? "Gestion du transport scolaire et de la cantine" : "School transport and canteen management"}</p>
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
          {isFr ? "Transport Scolaire" : "School Transport"}
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
          {isFr ? "Cantine" : "Canteen"}
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
              {isFr ? "Lignes de Bus" : "Bus Routes"}
            </button>
            <button
              onClick={() => setTransportSubTab('subs')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                transportSubTab === 'subs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {isFr ? "Élèves Abonnés" : "Subscribed Students"}
            </button>
          </div>

          {/* LIGNES DE BUS */}
          {transportSubTab === 'routes' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700">{isFr ? "Lignes de Transport configurées" : "Configured Transport Routes"}</h3>
                <button
                  onClick={() => { setEditingRoute(null); setIsRouteModalOpen(true); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> {isFr ? "Nouvelle Ligne" : "New Route"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">{isFr ? "Ligne" : "Route"}</th>
                      <th className="px-6 py-4">{isFr ? "Chauffeur" : "Driver"}</th>
                      <th className="px-6 py-4">{isFr ? "Tarif Mensuel" : "Monthly Fee"}</th>
                      <th className="px-6 py-4 text-center">{isFr ? "Abonnés" : "Subscribers"}</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routes.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{r.name}</div>
                          {r.busNumber && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Bus className="h-3 w-3"/> {isFr ? "Plaque" : "Plate"}: {r.busNumber}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700">{r.driverName || '-'}</div>
                          {r.driverPhone && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone className="h-3 w-3"/> {r.driverPhone}</div>}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{r.fee ? `${r.fee} FCFA` : (isFr ? "Gratuit" : "Free")}</td>
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
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">{isFr ? "Aucune ligne configurée." : "No route configured."}</td></tr>
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
                <h3 className="font-bold text-slate-700">{isFr ? "Abonnements Élèves au Transport" : "Student Transport Subscriptions"}</h3>
                <button
                  onClick={() => { setEditingSub(null); setIsTransportSubModalOpen(true); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> {isFr ? "Ajouter un Abonné" : "Add Subscriber"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">{isFr ? "Élève" : "Student"}</th>
                      <th className="px-6 py-4">{isFr ? "Classe" : "Class"}</th>
                      <th className="px-6 py-4">{isFr ? "Ligne de Bus" : "Bus Route"}</th>
                      <th className="px-6 py-4">{isFr ? "Type / Point de ramassage" : "Type / Pickup point"}</th>
                      <th className="px-6 py-4 text-center">{isFr ? "Statut" : "Status"}</th>
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
                            {s.type === 'MORNING_ONLY' ? (isFr ? 'Matin uniquement' : 'Morning only') : s.type === 'AFTERNOON_ONLY' ? (isFr ? 'Soir uniquement' : 'Afternoon only') : (isFr ? 'Aller - Retour' : 'Round Trip')}
                          </div>
                          {s.pickupPoint && <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {s.pickupPoint}</div>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {s.status === 'ACTIVE' 
                            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle className="h-3 w-3"/> {isFr ? "Actif" : "Active"}</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider"><XCircle className="h-3 w-3"/> {isFr ? "Inactif" : "Inactive"}</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setEditingSub(s); setIsTransportSubModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2"><Edit2 className="h-4 w-4"/></button>
                          <button onClick={() => handleDeleteTransportSub(s.id)} className="text-slate-400 hover:text-rose-600 p-2 ml-1"><Trash2 className="h-4 w-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {transportSubs.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">{isFr ? "Aucun abonnement trouvé." : "No subscription found."}</td></tr>
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
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><Utensils className="h-5 w-5 text-orange-500"/> {isFr ? "Abonnements Cantine" : "Canteen Subscriptions"}</h3>
              <button
                onClick={() => { setEditingSub(null); setIsCanteenSubModalOpen(true); }}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> {isFr ? "Inscrire un Élève" : "Register Student"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">{isFr ? "Élève" : "Student"}</th>
                    <th className="px-6 py-4">{isFr ? "Classe" : "Class"}</th>
                    <th className="px-6 py-4">{isFr ? "Notes Diététiques / Allergies" : "Dietary Notes / Allergies"}</th>
                    <th className="px-6 py-4 text-center">{isFr ? "Statut" : "Status"}</th>
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
                          <span className="text-slate-400 italic text-xs">{isFr ? "Aucune note" : "No notes"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.status === 'ACTIVE' 
                          ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle className="h-3 w-3"/> {isFr ? "Actif" : "Active"}</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider"><XCircle className="h-3 w-3"/> {isFr ? "Inactif" : "Inactive"}</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setEditingSub(s); setIsCanteenSubModalOpen(true); }} className="text-slate-400 hover:text-orange-600 p-2"><Edit2 className="h-4 w-4"/></button>
                        <button onClick={() => handleDeleteCanteenSub(s.id)} className="text-slate-400 hover:text-rose-600 p-2 ml-1"><Trash2 className="h-4 w-4"/></button>
                      </td>
                    </tr>
                  ))}
                  {canteenSubs.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">{isFr ? "Aucun abonné à la cantine." : "No canteen subscribers."}</td></tr>
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
              <h3 className="font-black text-lg text-slate-800">{editingRoute ? (isFr ? 'Modifier la Ligne' : 'Edit Route') : (isFr ? 'Nouvelle Ligne de Transport' : 'New Transport Route')}</h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSaveRoute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Nom de la Ligne *" : "Route Name *"}</label>
                <input required name="name" defaultValue={editingRoute?.name} placeholder={isFr ? "Ex: Ligne 1 - Centre Ville" : "Ex: Route 1 - Downtown"} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all font-medium text-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Plaque d'immatriculation" : "License Plate"}</label>
                  <input name="busNumber" defaultValue={editingRoute?.busNumber} placeholder="Ex: CE 1234 A" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Tarif mensuel (FCFA)" : "Monthly fee (FCFA)"}</label>
                  <input type="number" name="fee" defaultValue={editingRoute?.fee} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Nom du Chauffeur" : "Driver Name"}</label>
                  <input name="driverName" defaultValue={editingRoute?.driverName} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Tél du Chauffeur" : "Driver Phone"}</label>
                  <input name="driverPhone" defaultValue={editingRoute?.driverPhone} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{isFr ? "Annuler" : "Cancel"}</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">{isFr ? "Enregistrer" : "Save"}</button>
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
              <h3 className="font-black text-lg text-slate-800">{editingSub ? (isFr ? "Modifier l'Abonnement" : "Edit Subscription") : (isFr ? "Nouvel Abonnement Transport" : "New Transport Subscription")}</h3>
              <button onClick={() => setIsTransportSubModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSaveTransportSub} className="p-6 space-y-4">
              {!editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Élève *" : "Student *"}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={isFr ? "Rechercher un élève..." : "Search a student..."}
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
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">{isFr ? "Aucun élève trouvé" : "No student found"}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Ligne de Bus *" : "Bus Route *"}</label>
                <select required name="routeId" defaultValue={editingSub?.routeId} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-indigo-700">
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name} - {r.fee} FCFA</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Type de trajet *" : "Trip Type *"}</label>
                  <select required name="type" defaultValue={editingSub?.type || 'BOTH'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm">
                    <option value="BOTH">{isFr ? "Aller et Retour" : "Round Trip"}</option>
                    <option value="MORNING_ONLY">{isFr ? "Matin uniquement" : "Morning Only"}</option>
                    <option value="AFTERNOON_ONLY">{isFr ? "Soir uniquement" : "Afternoon Only"}</option>
                  </select>
                </div>
                {editingSub && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Statut" : "Status"}</label>
                    <select name="status" defaultValue={editingSub?.status} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm">
                      <option value="ACTIVE">{isFr ? "Actif" : "Active"}</option>
                      <option value="INACTIVE">{isFr ? "Inactif" : "Inactive"}</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Point de ramassage (Indicatif)" : "Pickup Point (Indicative)"}</label>
                <input name="pickupPoint" defaultValue={editingSub?.pickupPoint} placeholder={isFr ? "Ex: Carrefour Total, Devant la pharmacie..." : "Ex: Near the library, in front of the pharmacy..."} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsTransportSubModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{isFr ? "Annuler" : "Cancel"}</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">{isFr ? "Enregistrer" : "Save"}</button>
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
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2"><Utensils className="h-5 w-5 text-orange-500"/> {editingSub ? (isFr ? 'Modifier Inscription' : 'Edit Registration') : (isFr ? 'Inscription Cantine' : 'Canteen Registration')}</h3>
              <button onClick={() => setIsCanteenSubModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSaveCanteenSub} className="p-6 space-y-4">
              {!editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Élève *" : "Student *"}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={isFr ? "Rechercher un élève..." : "Search a student..."}
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
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">{isFr ? "Aucun élève trouvé" : "No student found"}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Notes diététiques / Allergies (Optionnel)" : "Dietary notes / Allergies (Optional)"}</label>
                <textarea 
                  name="dietaryNotes" 
                  defaultValue={editingSub?.dietaryNotes} 
                  rows="3" 
                  placeholder={isFr ? "Ex: Allergie aux arachides, Végétarien..." : "Ex: Peanut allergy, Vegetarian..."}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm resize-none" 
                />
              </div>

              {editingSub && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{isFr ? "Statut" : "Status"}</label>
                  <select name="status" defaultValue={editingSub?.status} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm">
                    <option value="ACTIVE">{isFr ? "Actif" : "Active"}</option>
                    <option value="INACTIVE">{isFr ? "Inactif" : "Inactive"}</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCanteenSubModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{isFr ? "Annuler" : "Cancel"}</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors">{isFr ? "Enregistrer" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
