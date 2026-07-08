import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { BookOpen, Plus, Edit2, Trash2, X, Search } from 'lucide-react';

export default function MatieresPage() {
  const { t } = useTranslation();
  const [matieres, setMatieres] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [code, setCode] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [volumeHoraire, setVolumeHoraire] = useState('0');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/matieres');
      setMatieres(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedMatiere(null);
    setNameFr('');
    setNameEn('');
    setCode('');
    setCoefficient('1');
    setVolumeHoraire('0');
    setModalOpen(true);
  };

  const handleOpenEdit = (matiere) => {
    setSelectedMatiere(matiere);
    setNameFr(matiere.nameFr);
    setNameEn(matiere.nameEn);
    setCode(matiere.code);
    setCoefficient(matiere.coefficient.toString());
    setVolumeHoraire((matiere.volumeHoraire || 0).toString());
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette matière ? (Cela supprimera également les affectations associées)")) return;
    try {
      await apiFetch(`/matieres/${id}`, { method: 'DELETE' });
      setMatieres(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || "Erreur de suppression");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedMatiere) {
        const updated = await apiFetch(`/matieres/${selectedMatiere.id}`, {
          method: 'PUT',
          body: { 
            nameFr, 
            nameEn, 
            code, 
            coefficient: parseFloat(coefficient),
            volumeHoraire: parseInt(volumeHoraire, 10)
          }
        });
        setMatieres(prev => prev.map(m => m.id === updated.id ? updated : m));
      } else {
        const created = await apiFetch('/matieres', {
          method: 'POST',
          body: { 
            nameFr, 
            nameEn, 
            code, 
            coefficient: parseFloat(coefficient),
            volumeHoraire: parseInt(volumeHoraire, 10)
          }
        });
        setMatieres(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || "Erreur lors de la sauvegarde");
    }
  };

  const filteredMatieres = matieres.filter(m => 
    m.nameFr?.toLowerCase().includes(search.toLowerCase()) || 
    m.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
    m.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            Gestion des Matières
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Créez et configurez le catalogue des matières de votre établissement
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Ajouter une matière</span>
        </button>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between col-span-1">
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Total Matières</span>
            <span className="text-xl font-black text-[#1E3A5F] font-outfit">{matieres.length}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center">
            <BookOpen className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="relative col-span-2">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une matière..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Matière (Fr/En)</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-center">Coefficient (Défaut)</th>
                  <th className="px-6 py-4 text-center">Vol. Horaire</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatieres.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                      Aucune matière trouvée
                    </td>
                  </tr>
                ) : (
                  filteredMatieres.map(mat => (
                    <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#1E3A5F] block">{mat.nameFr}</span>
                        <span className="text-slate-400 text-xs font-semibold">{mat.nameEn}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-500 uppercase">{mat.code}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{mat.coefficient}</td>
                      <td className="px-6 py-4 text-center text-slate-500">{mat.volumeHoraire}h</td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(mat)}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">
                  {selectedMatiere ? 'Modifier Matière' : 'Ajouter Matière'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom (Français)</label>
                <input
                  type="text"
                  required
                  value={nameFr}
                  onChange={(e) => setNameFr(e.target.value)}
                  placeholder="ex: Mathématiques"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom (Anglais)</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="ex: Mathematics"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ex: MATH"
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={coefficient}
                    onChange={(e) => setCoefficient(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Volume Horaire (Heures/Semaine)</label>
                <input
                  type="number"
                  min="0"
                  value={volumeHoraire}
                  onChange={(e) => setVolumeHoraire(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
