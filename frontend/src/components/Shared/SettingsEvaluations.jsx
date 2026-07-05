import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { BookOpen, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SettingsEvaluations() {
  const { t } = useTranslation();
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  
  const [name, setName] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/evaluation-types');
      setEvaluationTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedType(null);
    setName('');
    setCoefficient('1');
    setModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setSelectedType(type);
    setName(type.name);
    setCoefficient(type.coefficient.toString());
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce type d'évaluation ? (Cela pourrait affecter les notes existantes liées)")) return;
    try {
      await apiFetch(`/evaluation-types/${id}`, { method: 'DELETE' });
      setEvaluationTypes(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message || "Erreur de suppression");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedType) {
        const updated = await apiFetch(`/evaluation-types/${selectedType.id}`, {
          method: 'PUT',
          body: { name, coefficient: parseFloat(coefficient) }
        });
        setEvaluationTypes(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await apiFetch('/evaluation-types', {
          method: 'POST',
          body: { name, coefficient: parseFloat(coefficient) }
        });
        setEvaluationTypes(prev => [...prev, created]);
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
            <h4 className="font-bold text-[#1E3A5F] text-sm font-outfit">Types d'Évaluation (Devoir, CC, Examen...)</h4>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="p-1 text-[#1E3A5F] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
            title="Ajouter un type d'évaluation"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          </button>
        </div>
        
        <p className="text-[10px] text-slate-500 font-medium">Configurez les types d'évaluations qui composent une séquence (ex: Devoir Coeff 1, Examen Coeff 2). Si vous ne configurez rien, la note globale par séquence sera utilisée.</p>

        {evaluationTypes.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">Aucun type d'évaluation configuré</p>
        ) : (
          <ul className="text-xs space-y-2.5 text-slate-600 font-medium">
            {evaluationTypes.map((ev) => (
              <li key={ev.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#1E3A5F] block">{ev.name}</span>
                  <span className="text-slate-500 text-[10px]">Coefficient: {ev.coefficient}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => handleOpenEdit(ev)} className="p-1 rounded bg-white hover:bg-slate-100 text-[#1E3A5F] border border-slate-200 shadow-sm transition-colors"><Edit2 className="h-3 w-3 text-slate-500" /></button>
                  <button type="button" onClick={() => handleDelete(ev.id)} className="p-1 rounded bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 shadow-sm transition-colors"><Trash2 className="h-3 w-3" /></button>
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
                  {selectedType ? 'Modifier' : 'Ajouter'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom (ex: Devoir 1, CC)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coefficient</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
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
