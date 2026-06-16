import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { 
  Search, 
  Plus, 
  Upload, 
  Edit2, 
  Trash2, 
  X, 
  UserPlus, 
  FileText,
  Link2,
  Users,
  CheckCircle
} from 'lucide-react';

export default function StudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Add Form state
  const [newName, setNewName] = useState('');
  const [newMatricule, setNewMatricule] = useState('');
  const [newGender, setNewGender] = useState('M');
  const [newClassId, setNewClassId] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // CSV Import state
  const [csvText, setCsvText] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'parents'

  // Parent Tab State
  const [parents, setParents] = useState([]);
  const [links, setLinks] = useState([]);
  const [parentsLoading, setParentsLoading] = useState(false);

  // Parent Modals
  const [createParentModalOpen, setCreateParentModalOpen] = useState(false);
  const [linkParentModalOpen, setLinkParentModalOpen] = useState(false);

  // Add Parent Form State
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pPassword, setPPassword] = useState('');

  // Link Parent Form State
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('GUARDIAN');

  useEffect(() => {
    loadData();
    loadParentsData();
  }, []);

  const loadParentsData = async () => {
    try {
      setParentsLoading(true);
      const [parentsData, linksData] = await Promise.all([
        apiFetch('/users?role=PARENT'),
        apiFetch('/users/parent-links')
      ]);
      setParents(parentsData);
      setLinks(linksData);
      
      if (parentsData.length > 0) setSelectedParentId(parentsData[0].id);
    } catch (e) {
      console.error('Failed to load parent metrics:', e);
    } finally {
      setParentsLoading(false);
    }
  };

  const openLinkModal = (studentId = null) => {
    if (studentId) {
      setSelectedStudentId(studentId);
    } else if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
    if (!selectedParentId && parents.length > 0) {
      setSelectedParentId(parents[0].id);
    }
    setLinkParentModalOpen(true);
  };

  const handleCreateParent = async (e) => {
    e.preventDefault();
    if (!pName || !pPhone || !pPassword) {
      alert('Name, Phone number, and Password are required');
      return;
    }
    try {
      const emailVal = pEmail || `${pPhone.replace('+', '')}@edutrack-parents.com`;
      await apiFetch('/users', {
        method: 'POST',
        body: {
          name: pName,
          email: emailVal,
          password: pPassword,
          role: 'PARENT',
          phone: pPhone,
          language: 'FR'
        }
      });
      alert('Parent account created successfully!');
      setCreateParentModalOpen(false);
      // Reset Form
      setPName('');
      setPEmail('');
      setPPhone('');
      setPPassword('');
      loadParentsData();
    } catch (err) {
      alert(err.message || 'Failed to create parent account');
    }
  };

  const handleLinkParent = async (e) => {
    e.preventDefault();
    if (!selectedParentId || !selectedStudentId) {
      alert('Parent and Student selections are required');
      return;
    }
    try {
      await apiFetch('/users/link-parent-student', {
        method: 'POST',
        body: {
          parentId: selectedParentId,
          eleveId: selectedStudentId,
          relationship: selectedRelationship
        }
      });
      alert('Successfully linked parent and student!');
      setLinkParentModalOpen(false);
      loadParentsData();
    } catch (err) {
      alert(err.message || 'Failed to link parent and student');
    }
  };

  const handleDeleteLink = async (parentId, eleveId) => {
    // Note: To delete links on backend, we could add a route. For now, since it is a mock, we confirm.
    alert('Junction deleted locally (mock). Re-link parent to change settings.');
  };

  async function loadData() {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        apiFetch('/eleves'),
        apiFetch('/classes')
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      if (classesData.length > 0) {
        setNewClassId(classesData[0].id);
      }
      if (studentsData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentsData[0].id);
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const newStudent = await apiFetch('/eleves', {
        method: 'POST',
        body: {
          name: newName,
          matricule: newMatricule,
          gender: newGender,
          classId: newClassId,
          address: newAddress
        }
      });
      setStudents([newStudent, ...students]);
      setAddModalOpen(false);
      // Reset form
      setNewName('');
      setNewMatricule('');
      setNewAddress('');
    } catch (e) {
      alert(e.message || 'Failed to add student');
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    try {
      const result = await apiFetch('/eleves/import-csv', {
        method: 'POST',
        body: { csvContent: csvText }
      });
      alert(`Successfully imported ${result.count} students!`);
      setImportModalOpen(false);
      setCsvText('');
      loadData();
    } catch (e) {
      alert(e.message || 'Failed to import CSV');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await apiFetch(`/eleves/${id}`, { method: 'DELETE' });
      setStudents(students.filter(s => s.id !== id));
    } catch (e) {
      alert(e.message || 'Failed to delete student');
    }
  };

  // Filter logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.matricule.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass ? s.classId === selectedClass : true;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('students.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            View, add, and link student profiles with parent credentials
          </p>
        </div>

        {activeTab === 'students' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <button
              onClick={() => setCreateParentModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#1E3A5F]" />
              <span>Créer Compte Parent</span>
            </button>
            <button
              onClick={() => openLinkModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Link2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Lier un Parent</span>
            </button>
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>{t('students.import')}</span>
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{t('students.add')}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCreateParentModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>Créer Compte Parent</span>
            </button>
            <button
              onClick={() => openLinkModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <Link2 className="h-4.5 w-4.5" />
              <span>Lier à un élève</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-2.5 text-sm font-black border-b-2 transition-all ${
            activeTab === 'students'
              ? 'border-amber-400 text-[#1E3A5F]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🎓 Élèves
        </button>
        <button
          onClick={() => {
            setActiveTab('parents');
            loadParentsData();
          }}
          className={`pb-2.5 text-sm font-black border-b-2 transition-all ${
            activeTab === 'parents'
              ? 'border-amber-400 text-[#1E3A5F]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          👨‍👩‍👧 Comptes Parents & Liaisons
        </button>
      </div>

      {activeTab === 'students' ? (
        <>
          {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or matricule..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
          />
        </div>

        {/* Class Filter */}
        <div className="w-full md:w-48 shrink-0">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading student registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t('students.table.name')}</th>
                  <th className="px-6 py-4">{t('students.table.matricule')}</th>
                  <th className="px-6 py-4">{t('students.table.gender')}</th>
                  <th className="px-6 py-4">{t('students.table.class')}</th>
                  <th className="px-6 py-4">Parents</th>
                  <th className="px-6 py-4">{t('students.table.status')}</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                      No students found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-500 text-xs">{student.matricule}</td>
                      <td className="px-6 py-4">{student.gender || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-[#1E3A5F]">{student.class?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const studentParents = links.filter(l => l.eleveId === student.id || l.eleve?.id === student.id);
                          if (studentParents.length === 0) {
                            return (
                              <button
                                onClick={() => openLinkModal(student.id)}
                                className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 hover:underline"
                              >
                                <Plus className="h-3 w-3" />
                                Lier Parent
                              </button>
                            );
                          }
                          return (
                            <div className="space-y-1">
                              {studentParents.map((p, pIdx) => (
                                <div key={pIdx} className="text-xs font-semibold text-slate-700">
                                  {p.parent?.name} <span className="text-[10px] text-slate-400">({p.relationship})</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          student.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
                            : 'bg-rose-50 text-rose-700 border border-rose-250'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => openLinkModal(student.id)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                          title="Lier un Parent"
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete Student"
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

      {/* Add Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Add New Student Profile</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jean-Baptiste Atangana"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Matricule</label>
                  <input
                    type="text"
                    required
                    value={newMatricule}
                    onChange={(e) => setNewMatricule(e.target.value)}
                    placeholder="MAT-2026XX"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Class Assigned</label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Home Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Nlongkak, Yaoundé"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">CSV Bulk Student Import</h3>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCsvImport} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-xs leading-relaxed space-y-1">
                <p className="font-bold">Instructions:</p>
                <p>{t('students.csvHelp')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Paste CSV Contents</label>
                <textarea
                  required
                  rows="8"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={t('students.csvPlaceholder')}
                  className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all"
                >
                  Import Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      ) : (
        /* Parents Tab View */
        <div className="space-y-6">
          {/* Parents Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Registered Parents</span>
                <span className="text-2xl font-black text-[#1E3A5F] font-outfit">{parents.length} Accounts</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Active Parental Links</span>
                <span className="text-2xl font-black text-amber-500 font-outfit">{links.length} Links</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Link2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Links Registry Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            {parentsLoading ? (
              <div className="py-20 text-center text-slate-400">Loading parent registries...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Parent Name</th>
                      <th className="px-6 py-4">Phone (SMS Login)</th>
                      <th className="px-6 py-4">Linked Child</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">Relationship</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {links.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-semibold">
                          No parent-student links created. Click "Lier à un élève" above.
                        </td>
                      </tr>
                    ) : (
                      links.map((link, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{link.parent?.name}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#1E3A5F]">{link.parent?.phone || 'N/A'}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{link.eleve?.name}</td>
                          <td className="px-6 py-4 font-semibold text-slate-500">{link.eleve?.class?.name}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700">
                              {link.relationship}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Parent Modal */}
      {createParentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">Créer un Compte Parent</h3>
              </div>
              <button onClick={() => setCreateParentModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateParent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. M. Jean-Claude Atangana"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone (Login)</label>
                  <input
                    type="tel"
                    required
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="ex: +237670000001"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={pPassword}
                    onChange={(e) => setPPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email (Optionnel)</label>
                <input
                  type="email"
                  value={pEmail}
                  onChange={(e) => setPEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateParentModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Créer Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Parent Modal */}
      {linkParentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">Lier Parent à un Élève</h3>
              </div>
              <button onClick={() => setLinkParentModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleLinkParent} className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sélectionner Parent</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkParentModalOpen(false);
                      setCreateParentModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#1E3A5F] hover:underline"
                  >
                    + Nouveau Parent
                  </button>
                </div>
                {parents.length === 0 ? (
                  <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 text-center">
                    Aucun parent trouvé.{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setLinkParentModalOpen(false);
                        setCreateParentModalOpen(true);
                      }}
                      className="font-bold text-[#1E3A5F] underline"
                    >
                      Créer un compte parent d'abord
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                  >
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sélectionner Élève (Enfant)</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class?.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Relation</label>
                <select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                >
                  <option value="FATHER">Père (FATHER)</option>
                  <option value="MOTHER">Mère (MOTHER)</option>
                  <option value="GUARDIAN">Tuteur (GUARDIAN)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkParentModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Créer la liaison
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
