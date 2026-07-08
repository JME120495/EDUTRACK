import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { BookOpen, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SettingsMatieres() {
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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette matière ? (Cela supprimera également les notes associées)")) return;
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

  if (loading) return null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-[#1E3A5F]" />
            <h4 className="font-bold text-[#1E3A5F] text-sm font-outfit">Gestion des Matières</h4>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="p-1 text-[#1E3A5F] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
            title="Ajouter une matière"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          </button>
        </div>
        
        <p className="text-[10px] text-slate-500 font-medium">
          Créez les matières globales de votre établissement. Vous pourrez ensuite les assigner aux classes et aux enseignants.
        </p>

        {matieres.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">Aucune matière configurée</p>
        ) : (
          <ul className="text-xs space-y-2.5 text-slate-600 font-medium max-h-64 overflow-y-auto pr-2">
            {matieres.map((mat) => (
              <li key={mat.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#1E3A5F] block">{mat.nameFr} / {mat.nameEn} ({mat.code})</span>
                  <span className="text-slate-500 text-[10px]">
                    Coeff: {mat.coefficient} | Vol. horaire: {mat.volumeHoraire}h
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => handleOpenEdit(mat)} className="p-1 rounded bg-white hover:bg-slate-100 text-[#1E3A5F] border border-slate-200 shadow-sm transition-colors">
                    <Edit2 className="h-3 w-3 text-slate-500" />
                  </button>
                  <button type="button" onClick={() => handleDelete(mat.id)} className="p-1 rounded bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 shadow-sm transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">
                  {selectedMatiere ? 'Modifier' : 'Ajouter'}
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
    </>
  );
}
