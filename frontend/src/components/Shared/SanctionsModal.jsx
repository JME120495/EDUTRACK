import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../api';

export default function SanctionsModal({ isOpen, onClose, student }) {
  const [sanctions, setSanctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [type, setType] = useState('AVERTISSEMENT');
  const [motif, setMotif] = useState('');
  const [duration, setDuration] = useState('');
  const [durationType, setDurationType] = useState('DAYS');
  const [isLateness, setIsLateness] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadSanctions();
      setType('AVERTISSEMENT');
      setMotif('');
      setDuration('');
      setDurationType('DAYS');
      setIsLateness(false);
    }
  }, [isOpen, student]);

  const loadSanctions = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/discipline?eleveId=${student.id}`);
      setSanctions(data);
    } catch (err) {
      console.error('Failed to load sanctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSanction = async (e) => {
    e.preventDefault();
    if (!motif) return;

    setSaving(true);
    try {
      const payload = { eleveId: student.id, type, motif, isLateness };
      if (type === 'EXCLUSION_TEMP') {
        payload.duration = duration ? parseInt(duration) : null;
        payload.durationType = durationType;
      }
      
      const newSanction = await apiFetch('/discipline', {
        method: 'POST',
        body: payload
      });
      setSanctions([newSanction, ...sanctions]);
      setMotif('');
      setDuration('');
      setIsLateness(false);
      alert('Sanction ajoutée et parent notifié !');
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout de la sanction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette sanction ?")) return;
    try {
      await apiFetch(`/discipline/${id}`, { method: 'DELETE' });
      setSanctions(sanctions.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="font-bold text-rose-800 font-outfit">
              Dossier Disciplinaire : {student.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-rose-200 rounded-lg">
            <X className="h-5 w-5 text-rose-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50">
          {/* Add Form */}
          <form onSubmit={handleAddSanction} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-[#1E3A5F] text-sm">Nouvelle Sanction</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="col-span-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] outline-none"
              >
                <option value="AVERTISSEMENT">Avertissement</option>
                <option value="BLAME">Blâme</option>
                <option value="EXCLUSION_TEMP">Exclusion Temporaire</option>
                <option value="EXCLUSION_DEF">Exclusion Définitive</option>
              </select>
              <input
                type="text"
                required
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Motif de la sanction..."
                className="col-span-1 md:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] outline-none"
              />
            </div>
            {type === 'EXCLUSION_TEMP' && (
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  required
                  value={duration || ''}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Durée..."
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] outline-none"
                />
                <select
                  value={durationType}
                  onChange={(e) => setDurationType(e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] outline-none"
                >
                  <option value="DAYS">Jours</option>
                  <option value="HOURS">Heures</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="lateness"
                checked={isLateness}
                onChange={(e) => setIsLateness(e.target.checked)}
                className="h-4 w-4 rounded text-[#1E3A5F] focus:ring-[#1E3A5F] border-slate-300"
              />
              <label htmlFor="lateness" className="text-sm text-slate-700 font-medium">L'élève est venu en retard</label>
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={saving || !motif}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                <span>Sanctionner et Notifier le Parent</span>
              </button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#1E3A5F] text-sm">Historique des Sanctions</h4>
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : sanctions.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Aucune sanction enregistrée pour cet élève.</p>
            ) : (
              sanctions.map(s => (
                <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wide">
                        {s.type} {s.duration && s.durationType ? `(${s.duration} ${s.durationType === 'DAYS' ? 'Jours' : 'Heures'})` : ''}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                      {s.isLateness && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                          Retard
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{s.motif}</p>
                    <p className="text-xs text-slate-400 mt-1">Sanctionné par: {s.censeur?.name || 'Inconnu'}</p>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
