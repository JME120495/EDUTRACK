import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { 
  Plus, 
  X, 
  UserPlus, 
  GraduationCap, 
  BookOpen, 
  Link2, 
  Trash2, 
  Search, 
  AlertCircle 
} from 'lucide-react';

export default function TeachersPage() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'assignments'

  // Modal States
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Search filter
  const [search, setSearch] = useState('');

  // Add Teacher Form State
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherSubjectId, setTeacherSubjectId] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Assignment Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [teachersData, classesData, subjectsData, assignmentsData] = await Promise.all([
        apiFetch('/users?role=TEACHER'),
        apiFetch('/classes'),
        apiFetch('/matieres'),
        apiFetch('/matieres/assignments')
      ]);

      setTeachers(teachersData);
      setClasses(classesData);
      setSubjects(subjectsData);
      setAssignments(assignmentsData);

      // Set default form selections
      if (teachersData.length > 0) setSelectedTeacherId(teachersData[0].id);
      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
      if (subjectsData.length > 0) {
        setSelectedMatiereId(subjectsData[0].id);
        setTeacherSubjectId(subjectsData[0].id);
      }
    } catch (e) {
      console.error('Failed to load teachers page data:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!teacherName || !teacherPhone || !teacherPassword) {
      alert('Nom, Téléphone et Mot de passe sont requis');
      return;
    }

    try {
      const emailVal = teacherEmail || `teacher.${teacherPhone.replace('+', '')}@edutrack.com`;
      const newTeacher = await apiFetch('/users', {
        method: 'POST',
        body: {
          name: teacherName,
          email: emailVal,
          password: teacherPassword,
          role: 'TEACHER',
          phone: teacherPhone,
          language: 'FR'
        }
      });

      // Now assign teacher to selected subject and classes
      if (teacherSubjectId && selectedClasses.length > 0) {
        await Promise.all(
          selectedClasses.map(classId => 
            apiFetch('/matieres/affecter', {
              method: 'POST',
              body: {
                teacherId: newTeacher.id,
                matiereId: teacherSubjectId,
                classId
              }
            }).catch(err => {
              console.error(`Failed to assign to class ${classId}:`, err);
            })
          )
        );
      }

      alert('Enseignant créé et affecté avec succès !');
      setTeachers(prev => [newTeacher, ...prev]);
      setAddTeacherModalOpen(false);

      // Reset Form
      setTeacherName('');
      setTeacherPhone('');
      setTeacherPassword('');
      setTeacherEmail('');
      setSelectedClasses([]);
      if (subjects.length > 0) setTeacherSubjectId(subjects[0].id);

      // Refresh data
      loadAllData();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création de l\'enseignant');
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedMatiereId || !selectedClassId) {
      alert('Toutes les sélections sont requises');
      return;
    }

    try {
      const newAssignment = await apiFetch('/matieres/affecter', {
        method: 'POST',
        body: {
          teacherId: selectedTeacherId,
          matiereId: selectedMatiereId,
          classId: selectedClassId
        }
      });

      alert('Enseignant affecté avec succès !');
      setAssignModalOpen(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'affectation de l\'enseignant');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ? Cela supprimera également ses affectations.')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setTeachers(prev => prev.filter(t => t.id !== id));
      setAssignments(prev => prev.filter(a => a.teacherId !== id));
      alert('Enseignant supprimé avec succès.');
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) return;
    try {
      await apiFetch(`/matieres/assignments/${id}`, { method: 'DELETE' });
      setAssignments(prev => prev.filter(a => a.id !== id));
      alert('Affectation retirée avec succès.');
    } catch (err) {
      alert(err.message || 'Erreur lors du retrait de l\'affectation');
    }
  };

  const handleUpdateCoefficient = async (assignmentId, val) => {
    const numericVal = val === '' ? null : parseFloat(val);
    setAssignments(prev => 
      prev.map(a => a.id === assignmentId ? { ...a, coefficient: numericVal } : a)
    );

    try {
      await apiFetch(`/matieres/assignments/${assignmentId}`, {
        method: 'PUT',
        body: { coefficient: numericVal }
      });
    } catch (e) {
      console.error('Failed to update coefficient:', e);
      alert(e.message || 'Erreur lors de la mise à jour du coefficient');
      loadAllData();
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.phone && t.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            Gestion des Enseignants
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Gérez les comptes des enseignants titulaires et vacataires et affectez-les aux matières par classe
          </p>
        </div>

        {activeTab === 'list' ? (
          <button
            onClick={() => setAddTeacherModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md shrink-0"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>Créer Compte Enseignant</span>
          </button>
        ) : (
          <button
            onClick={() => setAssignModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md shrink-0"
          >
            <Link2 className="h-4.5 w-4.5" />
            <span>Affecter Enseignant</span>
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-2.5 text-sm font-black border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-amber-400 text-[#1E3A5F]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📋 Liste des Enseignants
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2.5 text-sm font-black border-b-2 transition-all ${
            activeTab === 'assignments'
              ? 'border-amber-400 text-[#1E3A5F]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🔗 Affectations des Matières ({assignments.length})
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Stats & Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between col-span-1">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Total Enseignants</span>
                <span className="text-xl font-black text-[#1E3A5F] font-outfit">{teachers.length}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center">
                <GraduationCap className="h-5.5 w-5.5" />
              </div>
            </div>

            <div className="relative col-span-2">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou numéro de téléphone..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all bg-white"
              />
            </div>
          </div>

          {/* Teachers List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            {loading ? (
              <div className="py-20 text-center text-slate-400">Chargement de la liste...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nom de l'Enseignant</th>
                      <th className="px-6 py-4">Téléphone (Login)</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Date d'inscription</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                          Aucun enseignant trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map(teacher => (
                        <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{teacher.name}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#1E3A5F]">{teacher.phone || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{teacher.email}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {new Date(teacher.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Supprimer l'Enseignant"
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
        </>
      ) : (
        /* Assignments Tab View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Chargement des affectations...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Enseignant</th>
                    <th className="px-6 py-4">Classe</th>
                    <th className="px-6 py-4">Matière</th>
                    <th className="px-6 py-4">Coefficient</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                        Aucune affectation trouvée. Cliquez sur "Affecter Enseignant" ci-dessus.
                      </td>
                    </tr>
                  ) : (
                    assignments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{a.teacher?.name}</td>
                        <td className="px-6 py-4 font-black text-[#1E3A5F]">{a.class?.name}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700">{a.matiere?.nameFr}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                            {a.matiere?.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-bold">Coef:</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="20"
                              placeholder={a.matiere?.coefficient || 1}
                              value={a.coefficient !== null && a.coefficient !== undefined ? a.coefficient : ''}
                              onChange={(e) => handleUpdateCoefficient(a.id, e.target.value)}
                              className="w-16 px-2 py-1 text-center border border-slate-200 rounded-lg text-xs font-bold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all bg-white"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Retirer l'affectation"
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
      )}

      {/* Add Teacher Modal */}
      {addTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">Créer un Compte Enseignant</h3>
              </div>
              <button onClick={() => setAddTeacherModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Mme. Chantal Atangana"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone (Login)</label>
                  <input
                    type="tel"
                    required
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    placeholder="ex: +237670000002"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email (Optionnel)</label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="enseignant@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Matière Affectée (Optionnel)</label>
                <select
                  value={teacherSubjectId}
                  onChange={(e) => setTeacherSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                >
                  <option value="">-- Aucune matière --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.nameFr} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Classes Affectées (Une ou plusieurs)</label>
                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucune classe disponible</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50 max-h-32 overflow-y-auto">
                    {classes.map(c => {
                      const isChecked = selectedClasses.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:text-[#1E3A5F]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClasses(prev => [...prev, c.id]);
                              } else {
                                setSelectedClasses(prev => prev.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F] border-slate-300"
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTeacherModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">Affecter un Enseignant</h3>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sélectionner Enseignant</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.phone || t.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sélectionner Classe</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sélectionner Matière</label>
                <select
                  value={selectedMatiereId}
                  onChange={(e) => setSelectedMatiereId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.nameFr} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Affecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
