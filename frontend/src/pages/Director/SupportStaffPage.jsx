import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { Plus, X, UserPlus, Trash2, Edit2, ShieldCheck, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SupportStaffPage() {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiFetch('/users?role=SUPPORT');
      setStaffList(data);
    } catch (e) {
      console.error('Failed to load support staff:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!name || !phone || (!editMode && !password) || !profession) {
      return alert('Nom, téléphone, poste et mot de passe requis');
    }

    try {
      if (editMode) {
        await apiFetch(`/users/${editingId}`, {
          method: 'PUT',
          body: { name, phone, email: email || '', profession }
        });
        alert('Personnel mis à jour avec succès !');
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: { name, phone, email: email || '', password, role: 'SUPPORT', profession }
        });
        alert('Personnel ajouté avec succès !');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce membre du personnel d'appui ?")) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setEditingId(null);
    setName('');
    setProfession('');
    setPhone('');
    setEmail('');
    setPassword('');
    setModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditMode(true);
    setEditingId(staff.id);
    setName(staff.name);
    setProfession(staff.profession || '');
    setPhone(staff.phone || '');
    setEmail(staff.email || '');
    setPassword(''); // don't edit password here
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">{t('supportStaff.title') || "Personnel d'Appui"}</h1>
          <p className="text-slate-500 text-xs font-semibold">{t('supportStaff.subtitle') || "Gérez les gardiens, femmes de ménage, etc."}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
        >
          <UserPlus className="h-4 w-4" />
          {t('supportStaff.createBtn') || "Ajouter du Personnel"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">{t('supportStaff.table.name') || "Nom"}</th>
                <th className="px-6 py-4">{t('supportStaff.table.profession') || "Profession / Poste"}</th>
                <th className="px-6 py-4">{t('supportStaff.table.phone') || "Contact"}</th>
                <th className="px-6 py-4">{t('supportStaff.table.date') || "Date d'ajout"}</th>
                <th className="px-6 py-4">{t('supportStaff.table.actions') || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">Chargement...</td></tr>
              ) : staffList.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center">{t('supportStaff.empty') || "Aucun personnel d'appui."}</td></tr>
              ) : (
                staffList.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      {s.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {s.profession || "Non spécifié"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {s.phone || '-'}
                      </div>
                      <div className="text-slate-400 text-xs ml-4.5">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => openEditModal(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Modifier">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-[#1E3A5F]">
                {editMode 
                  ? (t('supportStaff.editModal.title') || "Modifier les informations")
                  : (t('supportStaff.addModal.title') || "Ajouter du personnel d'appui")
                }
              </h3>
              <button onClick={() => setModalOpen(false)} className="hover:bg-slate-200 p-1 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('supportStaff.addModal.nameLabel') || "NOM COMPLET"}</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('supportStaff.addModal.professionLabel') || "POSTE (ex: Gardien, Chauffeur)"}</label>
                <input type="text" required value={profession} onChange={e => setProfession(e.target.value)} placeholder="Ex: Gardien de sécurité" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('supportStaff.addModal.phoneLabel') || "TÉLÉPHONE"}</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="6xxxx" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                </div>
                {!editMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('supportStaff.addModal.passwordLabel') || "MOT DE PASSE"}</label>
                    <input type="text" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                  </div>
                )}
              </div>
              {/* Email is auto-generated */}
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-[#1E3A5F] text-[#F5A623] hover:bg-[#152943] rounded-xl font-bold transition-colors">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
