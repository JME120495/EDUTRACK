import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { Calendar, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SettingsSequences({ annees }) {
  const { t } = useTranslation();
  const [sequences, setSequences] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  
  const [name, setName] = useState('');
  const [term, setTerm] = useState('1');
  const [coefficient, setCoefficient] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Find the active academic year
  const activeYear = annees?.find(a => a.active);

  useEffect(() => {
    fetchData();
  }, [activeYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/sequences');
      // Sort by term then name
      data.sort((a, b) => {
        if (a.term !== b.term) return a.term - b.term;
        return a.name.localeCompare(b.name);
      });
      setSequences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedSequence(null);
    setName('');
    setTerm('1');
    setCoefficient('1');
    setStartDate('');
    setEndDate('');
    setModalOpen(true);
  };

  const handleOpenEdit = (seq) => {
    setSelectedSequence(seq);
    setName(seq.name);
    setTerm(seq.term.toString());
    setCoefficient((seq.coefficient || 1).toString());
    setStartDate(seq.startDate ? seq.startDate.split('T')[0] : '');
    setEndDate(seq.endDate ? seq.endDate.split('T')[0] : '');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette séquence ? Les notes et bulletins associés risquent d'être supprimés ou de causer des erreurs.")) return;
    try {
      await apiFetch(`/sequences/${id}`, { method: 'DELETE' });
      setSequences(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message || "Erreur de suppression");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeYear) {
      alert("Aucune année scolaire active n'a été trouvée.");
      return;
    }

    try {
      if (selectedSequence) {
        const updated = await apiFetch(`/sequences/${selectedSequence.id}`, {
          method: 'PUT',
          body: { 
            name, 
            term: parseInt(term),
            coefficient: parseFloat(coefficient) || 1,
            startDate: startDate || null,
            endDate: endDate || null
          }
        });
        setSequences(prev => {
          const newArr = prev.map(s => s.id === updated.id ? updated : s);
          newArr.sort((a, b) => {
            if (a.term !== b.term) return a.term - b.term;
            return a.name.localeCompare(b.name);
          });
          return newArr;
        });
      } else {
        const created = await apiFetch('/sequences', {
          method: 'POST',
          body: { 
            name, 
            term: parseInt(term),
            coefficient: parseFloat(coefficient) || 1,
            anneeScolaireId: activeYear.id,
            startDate: startDate || null,
            endDate: endDate || null
          }
        });
        setSequences(prev => {
          const newArr = [...prev, created];
          newArr.sort((a, b) => {
            if (a.term !== b.term) return a.term - b.term;
            return a.name.localeCompare(b.name);
          });
          return newArr;
        });
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
            <Calendar className="h-4.5 w-4.5 text-[#1E3A5F]" />
            <h4 className="font-bold text-[#1E3A5F] text-sm font-outfit">Séquences & Périodes (Année Active)</h4>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={!activeYear}
            className="p-1 text-[#1E3A5F] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            title="Ajouter une séquence"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500" />
          </button>
        </div>
        
        <p className="text-[10px] text-slate-500 font-medium">Configurez les périodes d'évaluation (Séquences) et assignez-les à des trimestres. C'est ce système qui déterminera le regroupement des notes sur le bulletin trimestriel.</p>

        {!activeYear ? (
           <p className="text-xs text-rose-500 italic text-center py-2 font-bold">Veuillez d'abord activer une année scolaire.</p>
        ) : sequences.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">Aucune séquence configurée pour l'année active.</p>
        ) : (
          <ul className="text-xs space-y-2.5 text-slate-600 font-medium">
            {sequences.map((seq) => (
              <li key={seq.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#1E3A5F] block">{seq.name}</span>
                  <span className="text-slate-500 text-[10px]">Trimestre / Semestre {seq.term}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => handleOpenEdit(seq)} className="p-1 rounded bg-white hover:bg-slate-100 text-[#1E3A5F] border border-slate-200 shadow-sm transition-colors"><Edit2 className="h-3 w-3 text-slate-500" /></button>
                  <button type="button" onClick={() => handleDelete(seq.id)} className="p-1 rounded bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 shadow-sm transition-colors"><Trash2 className="h-3 w-3" /></button>
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
                <Calendar className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">
                  {selectedSequence ? 'Modifier' : 'Ajouter'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom (ex: Séquence 1)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Appartient au Trimestre / Semestre (Nombre)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Début (Opt.)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Fin (Opt.)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coefficient (Poids)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
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
