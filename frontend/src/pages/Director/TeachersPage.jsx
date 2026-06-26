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
  AlertCircle,
  Edit2,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeachersPage() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'assignments'
  const [importing, setImporting] = useState(false);

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

  // Edit Teacher Form State
  const [editTeacherModalOpen, setEditTeacherModalOpen] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherPhone, setEditTeacherPhone] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherSubjectId, setEditTeacherSubjectId] = useState('');
  const [editSelectedClasses, setEditSelectedClasses] = useState([]);

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
      const emailVal = teacherEmail || '';
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          alert("Le fichier est vide ou mal formaté.");
          return;
        }

        const usersToImport = jsonData.map(row => {
          return {
            name: row['Nom'] || row['Name'],
            email: row['Email'] || row['Courriel'],
            phone: row['Telephone'] || row['Phone'],
            role: 'TEACHER',
            language: row['Langue'] || row['Language'] || 'FR'
          };
        }).filter(u => u.name); // only keep ones with name

        if (usersToImport.length === 0) {
          alert("Aucun enseignant trouvé. Assurez-vous d'avoir une colonne 'Nom' ou 'Name'.");
          return;
        }

        const res = await apiFetch('/users/bulk', {
          method: 'POST',
          body: { users: usersToImport }
        });

        alert(`${res.count} enseignants importés avec succès !`);
        loadAllData();
      } catch (err) {
        alert(err.message || "Erreur lors de l'import");
      } finally {
        setImporting(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };
  const openEditTeacherModal = (teacher) => {
    setEditTeacherId(teacher.id);
    setEditTeacherName(teacher.name);
    setEditTeacherPhone(teacher.phone || '');
    setEditTeacherEmail(teacher.email || '');
    
    // Find teacher's current assignments
    const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
    if (teacherAssignments.length > 0) {
      setEditTeacherSubjectId(teacherAssignments[0].matiereId);
      setEditSelectedClasses(teacherAssignments.map(a => a.classId));
    } else {
      setEditTeacherSubjectId(subjects.length > 0 ? subjects[0].id : '');
      setEditSelectedClasses([]);
    }
    setEditTeacherModalOpen(true);
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    if (!editTeacherName || !editTeacherPhone) {
      alert('Nom et Téléphone sont requis');
      return;
    }

    try {
      const updatedTeacher = await apiFetch(`/users/${editTeacherId}`, {
        method: 'PUT',
        body: {
          name: editTeacherName,
          phone: editTeacherPhone,
          email: editTeacherEmail
        }
      });

      // Update assignments
      const teacherAssignments = assignments.filter(a => a.teacherId === editTeacherId);
      const currentClassIds = teacherAssignments.map(a => a.classId);
      
      const classesToAdd = editSelectedClasses.filter(id => !currentClassIds.includes(id));
      const assignmentsToRemove = teacherAssignments.filter(a => !editSelectedClasses.includes(a.classId));

      // Remove unchecked classes
      if (assignmentsToRemove.length > 0) {
        await Promise.all(
          assignmentsToRemove.map(a => 
            apiFetch(`/matieres/assignments/${a.id}`, { method: 'DELETE' }).catch(err => console.error(err))
          )
        );
      }

      // Add newly checked classes
      if (editTeacherSubjectId && classesToAdd.length > 0) {
        await Promise.all(
          classesToAdd.map(classId => 
            apiFetch('/matieres/affecter', {
              method: 'POST',
              body: {
                teacherId: editTeacherId,
                matiereId: editTeacherSubjectId,
                classId
              }
            }).catch(err => console.error(err))
          )
        );
      }

      alert('Enseignant mis à jour avec succès !');
      setEditTeacherModalOpen(false);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Erreur lors de la mise à jour de l\'enseignant');
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
            {t('teachers.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            {t('teachers.subtitle')}
          </p>
        </div>

        {activeTab === 'list' ? (
          <div className="flex gap-2 shrink-0">
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50">
              <Upload className="h-4.5 w-4.5" />
              <span>{importing ? "Import..." : "Importer"}</span>
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
            </label>
            <button
              onClick={() => setAddTeacherModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>{t('teachers.createBtn')}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAssignModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md shrink-0"
          >
            <Link2 className="h-4.5 w-4.5" />
            <span>{t('teachers.assignBtn')}</span>
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
          📋 {t('teachers.tabs.list')}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2.5 text-sm font-black border-b-2 transition-all ${
            activeTab === 'assignments'
              ? 'border-amber-400 text-[#1E3A5F]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🔗 {t('teachers.tabs.assignments')} ({assignments.length})
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Stats & Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between col-span-1">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">{t('teachers.total')}</span>
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
                placeholder={t('teachers.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all bg-white"
              />
            </div>
          </div>

          {/* Teachers List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
            {loading ? (
              <div className="py-20 text-center text-slate-400">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{t('teachers.table.name')}</th>
                      <th className="px-6 py-4">{t('teachers.table.phone')}</th>
                      <th className="px-6 py-4">{t('teachers.table.email')}</th>
                      <th className="px-6 py-4">{t('teachers.table.date')}</th>
                      <th className="px-6 py-4 text-right">{t('teachers.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                          {t('teachers.empty')}
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
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditTeacherModal(teacher)}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Modifier l'Enseignant"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
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

              {/* Email is auto-generated by the backend */}

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

      {/* Edit Teacher Modal */}
      {editTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Modifier l'Enseignant</h3>
              </div>
              <button onClick={() => setEditTeacherModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone (Login)</label>
                <input
                  type="text"
                  required
                  value={editTeacherPhone}
                  onChange={(e) => setEditTeacherPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={editTeacherEmail}
                  onChange={(e) => setEditTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Matière Principale</label>
                <select
                  value={editTeacherSubjectId}
                  onChange={(e) => {
                    setEditTeacherSubjectId(e.target.value);
                    setEditSelectedClasses([]);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold text-[#1E3A5F]"
                >
                  <option value="">Sélectionnez une matière...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.nameFr}</option>
                  ))}
                </select>
              </div>

              {editTeacherSubjectId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Classes Affectées (Cochez pour modifier)</label>
                  {classes.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Aucune classe disponible</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                      {classes.map(c => {
                        const isChecked = editSelectedClasses.includes(c.id);
                        return (
                          <label key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSelectedClasses(prev => [...prev, c.id]);
                                } else {
                                  setEditSelectedClasses(prev => prev.filter(id => id !== c.id));
                                }
                              }}
                              className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"
                            />
                            <span className={`text-sm ${isChecked ? 'font-bold text-[#1E3A5F]' : 'text-slate-600'}`}>{c.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTeacherModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Mettre à jour
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
