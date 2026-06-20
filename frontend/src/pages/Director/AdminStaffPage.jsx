import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { Plus, X, UserPlus, Trash2, Edit2, ShieldAlert, BookOpen } from 'lucide-react';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CENSEUR'); // CENSEUR or INTENDANT
  const [editingStaffId, setEditingStaffId] = useState(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [censeurs, intendants, classes] = await Promise.all([
        apiFetch('/users?role=CENSEUR'),
        apiFetch('/users?role=INTENDANT'),
        apiFetch('/classes')
      ]);
      setStaffList([...censeurs, ...intendants]);
      setClassesList(classes);
    } catch (e) {
      console.error('Failed to load admin staff:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!name || !phone) return alert('Nom et téléphone requis');
    try {
      const emailVal = email || '';
      if (editingStaffId) {
        await apiFetch(`/users/${editingStaffId}`, {
          method: 'PUT',
          body: { name, phone, email: emailVal, role }
        });
        alert('Personnel modifié avec succès !');
      } else {
        if (!password) return alert('Mot de passe requis pour un nouveau compte');
        await apiFetch('/users', {
          method: 'POST',
          body: { name, phone, email: emailVal, password, role }
        });
        alert('Personnel ajouté avec succès !');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setPhone(staff.phone || '');
    setEmail(staff.email || '');
    setRole(staff.role);
    setPassword('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce membre du personnel administratif ?')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleOpenAssignModal = (staff) => {
    setSelectedStaff(staff);
    const assignedIds = classesList.filter(c => c.censeur?.id === staff.id || c.censeurId === staff.id).map(c => c.id);
    setSelectedClassIds(assignedIds);
    setAssignModalOpen(true);
  };

  const handleAssignClasses = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/users/${selectedStaff.id}/classes`, {
        method: 'PUT',
        body: { classIds: selectedClassIds }
      });
      alert('Classes assignées avec succès !');
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'assignation des classes');
    }
  };

  const toggleClassSelection = (classId) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">Personnel Administratif</h1>
          <p className="text-slate-500 text-xs font-semibold">Gérez les profils Censeur et Intendant</p>
        </div>
        <button
          onClick={() => {
            setEditingStaffId(null);
            setName(''); setPhone(''); setEmail(''); setPassword(''); setRole('CENSEUR');
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter du personnel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-2 items-center text-sm font-semibold text-amber-600 bg-amber-50">
          <ShieldAlert className="h-4 w-4" />
          Ces rôles donnent accès à des données sensibles (Pédagogie ou Finances).
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Assignations</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">Chargement...</td></tr>
              ) : staffList.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">Aucun membre du personnel administratif.</td></tr>
              ) : (
                staffList.map(s => {
                  const assignedClasses = classesList.filter(c => c.censeur?.id === s.id || c.censeurId === s.id);
                  return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.role === 'CENSEUR' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-semibold">{s.phone || '-'}</div>
                      <div className="text-slate-400 text-xs">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {s.role === 'CENSEUR' ? (
                        assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClasses.map(c => (
                              <span key={c.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{c.name}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-500 text-xs font-semibold">Aucune classe assignée</span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs italic">Non applicable</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {s.role === 'CENSEUR' && (
                        <button onClick={() => handleOpenAssignModal(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Assigner des classes">
                          <BookOpen className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleEditStaff(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between">
              <h3 className="font-bold text-[#1E3A5F]">{editingStaffId ? 'Modifier le Personnel' : 'Ajouter du Personnel'}</h3>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">RÔLE</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]">
                  <option value="CENSEUR">Censeur (Pédagogie)</option>
                  <option value="INTENDANT">Intendant (Finances & RH)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">NOM COMPLET</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">TÉLÉPHONE</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="6xxxx" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">MOT DE PASSE {editingStaffId && '(Laisser vide si inchangé)'}</label>
                  <input type="text" required={!editingStaffId} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#1E3A5F] text-[#F5A623] rounded-xl font-bold">Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {assignModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Assigner des Classes : {selectedStaff.name}</h3>
              <button onClick={() => setAssignModalOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleAssignClasses} className="p-6 space-y-4">
              <p className="text-sm text-slate-500 mb-4">Sélectionnez les classes que ce Censeur va gérer :</p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {classesList.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedClassIds.includes(c.id)}
                      onChange={() => toggleClassSelection(c.id)}
                      className="w-5 h-5 text-[#1E3A5F] rounded focus:ring-[#1E3A5F] cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">
                        {c.censeur?.id && c.censeur.id !== selectedStaff.id ? 
                          `Gérée actuellement par ${c.censeur.name}` : ''}
                      </div>
                    </div>
                  </label>
                ))}
                {classesList.length === 0 && <p className="text-slate-500 text-sm italic">Aucune classe disponible.</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#1E3A5F] text-[#F5A623] hover:bg-[#152943] rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
