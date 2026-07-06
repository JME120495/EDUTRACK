import React, { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '../../api';
import { BookOpen, Plus, Trash2, Calendar, FileText, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CahierDeTextesPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    matiereId: '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    homeworkDesc: '',
    homeworkDueDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch teacher's assigned subjects/classes to populate dropdowns
      const [entriesRes] = await Promise.all([
        apiFetch('/cahier-textes/teacher')
      ]);
      setEntries(entriesRes);
      
      // In a real scenario we'd fetch EnseignantMatiereClasse
      // For simplicity here, we can fetch all classes and subjects if they are cached, 
      // or we just fetch /classes and /matieres
      const [allClasses, allSubjects] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/matieres')
      ]);
      setClasses(allClasses);
      setSubjects(allSubjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        classId: formData.classId,
        matiereId: formData.matiereId,
        date: formData.date,
        title: formData.title,
        content: formData.content,
      };

      if (formData.homeworkDesc) {
        payload.homework = {
          description: formData.homeworkDesc,
          dueDate: formData.homeworkDueDate || formData.date
        };
      }

      await apiFetch('/cahier-textes', {
        method: 'POST',
        body: payload
      });
      setIsModalOpen(false);
      setFormData({ classId: '', matiereId: '', title: '', content: '', date: new Date().toISOString().split('T')[0], homeworkDesc: '', homeworkDueDate: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    try {
      await apiFetch(`/cahier-textes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cahier de Textes</h1>
            <p className="text-slate-500 text-sm">Gérez l'avancement de vos cours et les devoirs</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Leçon
        </button>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Aucune leçon enregistrée. Cliquez sur "Nouvelle Leçon" pour commencer.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 flex justify-between items-start border-b border-slate-50 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{entry.title}</h3>
                  <div className="flex gap-4 mt-1 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(entry.date).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-700">{entry.class?.name || 'Classe'}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">{entry.matiere?.nameFr || 'Matière'}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(entry.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contenu de la leçon</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{entry.content}</p>
                </div>
                
                {entry.homeworks && entry.homeworks.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Travail à faire
                    </h4>
                    {entry.homeworks.map(hw => (
                      <div key={hw.id} className="text-amber-900 text-sm">
                        <p className="font-medium">{hw.description}</p>
                        <p className="text-xs text-amber-700 mt-1">Pour le : {new Date(hw.dueDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F] font-outfit">Enregistrer une Leçon</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <form onSubmit={handleSubmit} className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Classe *</label>
                    <select required className="w-full border-slate-200 rounded-xl focus:ring-indigo-500" value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}>
                      <option value="">Sélectionner</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Matière *</label>
                    <select required className="w-full border-slate-200 rounded-xl focus:ring-indigo-500" value={formData.matiereId} onChange={e => setFormData({...formData, matiereId: e.target.value})}>
                      <option value="">Sélectionner</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.nameFr}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date du cours *</label>
                    <input type="date" required className="w-full border-slate-200 rounded-xl focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Titre de la leçon *</label>
                    <input type="text" required placeholder="Ex: Chapitre 1..." className="w-full border-slate-200 rounded-xl focus:ring-indigo-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Résumé du cours *</label>
                  <textarea required rows={4} className="w-full border-slate-200 rounded-xl focus:ring-indigo-500" placeholder="Qu'avez-vous enseigné aujourd'hui ?" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Ajouter un Devoir (Optionnel)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Travail demandé</label>
                      <textarea rows={2} className="w-full border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500" placeholder="Ex: Exercices 1 et 2 page 45" value={formData.homeworkDesc} onChange={e => setFormData({...formData, homeworkDesc: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">À rendre pour le</label>
                      <input type="date" className="w-full border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500" value={formData.homeworkDueDate} onChange={e => setFormData({...formData, homeworkDueDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Annuler</button>
                  <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
