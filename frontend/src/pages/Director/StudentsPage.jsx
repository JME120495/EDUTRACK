import React, { useState, useEffect, useRef, useContext } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { AuthContext } from '../../context/AuthContext';
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
  CheckCircle,
  Camera,
  RefreshCw,
  AlertCircle,
  Crown
} from 'lucide-react';
import SanctionsModal from '../../components/Shared/SanctionsModal';

export default function StudentsPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [sanctionsModalOpen, setSanctionsModalOpen] = useState(false);
  const [sanctionStudent, setSanctionStudent] = useState(null);
  
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const isCenseurAllowed = (classObj) => {
    if (user.role === 'DIRECTOR') return true;
    if (user.role === 'CENSEUR') {
      if (!classObj) return false;
      return classObj.censeur?.id === user.id || classObj.censeurId === user.id;
    }
    return false;
  };

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Add Form state
  const [newName, setNewName] = useState('');
  const [newMatricule, setNewMatricule] = useState('');
  const [newGender, setNewGender] = useState('M');
  const [newClassId, setNewClassId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDateOfBirth, setNewDateOfBirth] = useState('');
  const [newPlaceOfBirth, setNewPlaceOfBirth] = useState('');
  const [createPortalAccount, setCreatePortalAccount] = useState(true);
  const [newEmail, setNewEmail] = useState('');

  // Bulk transfer state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkTransferModalOpen, setBulkTransferModalOpen] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState('');

  // Edit Form state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState('');
  const [editName, setEditName] = useState('');
  const [editMatricule, setEditMatricule] = useState('');
  const [editGender, setEditGender] = useState('M');
  const [editClassId, setEditClassId] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editPlaceOfBirth, setEditPlaceOfBirth] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');

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

  // Photo upload
  const photoInputRef = useRef(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

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
    if (!newName || !newClassId) {
      alert('Name and Class are required');
      return;
    }
    try {
      const added = await apiFetch('/eleves', {
        method: 'POST',
        body: {
          name: newName,
          matricule: newMatricule,
          gender: newGender,
          classId: newClassId,
          address: newAddress,
          dateOfBirth: newDateOfBirth || null,
          placeOfBirth: newPlaceOfBirth || null,
          createPortalAccount,
          email: newEmail
        }
      });
      setStudents(prev => [added, ...prev]);
      setAddModalOpen(false);
      setNewName('');
      setNewMatricule('');
      setNewGender('M');
      setNewClassId(classes.length > 0 ? classes[0].id : '');
      setNewAddress('');
      setNewDateOfBirth('');
      setNewPlaceOfBirth('');
      setNewEmail('');
      setCreatePortalAccount(true);
      alert('Student added successfully!');
    } catch (err) {
      alert(err.message || 'Error adding student');
    }
  };

  const openEditStudentModal = (student) => {
    setEditStudentId(student.id);
    setEditName(student.name);
    setEditMatricule(student.matricule);
    setEditGender(student.gender || 'M');
    setEditClassId(student.classId);
    setEditAddress(student.address || '');
    setEditDateOfBirth(student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '');
    setEditPlaceOfBirth(student.placeOfBirth || '');
    setEditStatus(student.status || 'ACTIVE');
    setEditModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editName || !editMatricule || !editClassId) {
      alert('Name, Matricule, and Class are required');
      return;
    }
    try {
      const updated = await apiFetch(`/eleves/${editStudentId}`, {
        method: 'PUT',
        body: {
          name: editName,
          matricule: editMatricule,
          gender: editGender,
          classId: editClassId,
          address: editAddress,
          dateOfBirth: editDateOfBirth || null,
          placeOfBirth: editPlaceOfBirth || null,
          status: editStatus
        }
      });
      setStudents(prev => prev.map(s => s.id === editStudentId ? updated : s));
      setEditModalOpen(false);
      alert('Student updated successfully!');
    } catch (err) {
      alert(err.message || 'Error updating student');
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

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const csv = XLSX.utils.sheet_to_csv(ws);
        setCsvText(csv);
        alert('Fichier Excel importé avec succès ! Vérifiez les données ci-dessous avant de cliquer sur "Import Students".');
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la lecture du fichier Excel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkTransfer = async (e) => {
    e.preventDefault();
    if (!bulkTargetClassId || selectedStudents.length === 0) {
      alert('Veuillez sélectionner une classe de destination et au moins un élève.');
      return;
    }
    try {
      const res = await apiFetch('/eleves/bulk-transfer', {
        method: 'POST',
        body: {
          studentIds: selectedStudents,
          targetClassId: bulkTargetClassId
        }
      });
      alert(res.message);
      setBulkTransferModalOpen(false);
      setSelectedStudents([]);
      loadData();
    } catch (e) {
      alert(e.message || 'Erreur lors du transfert en masse');
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

  // Photo upload handler
  const handleToggleCouncil = async (studentId, currentStatus) => {
    try {
      const updated = await apiFetch(`/eleves/${studentId}/council`, {
        method: 'PATCH',
        body: { isStudentCouncil: !currentStatus }
      });
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
      alert(t('studentCouncil.success'));
    } catch (e) {
      alert(e.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handlePhotoUpload = async (studentId, file) => {
    if (!file) return;
    setUploadingPhotoId(studentId);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const token = localStorage.getItem('edutrack_token');
      const res = await fetch(`/api/eleves/${studentId}/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }
      const updated = await res.json();
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    } catch (e) {
      alert(e.message || 'Failed to upload photo');
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const triggerPhotoInput = (studentId) => {
    setUploadingPhotoId(studentId);
    photoInputRef.current.click();
  };

  // Filter logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.matricule.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass ? s.classId === selectedClass : true;
    const matchesStatus = selectedStatus ? s.status === selectedStatus : true;
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0] && uploadingPhotoId) {
            handlePhotoUpload(uploadingPhotoId, e.target.files[0]);
          }
          e.target.value = '';
        }}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('students.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            {t('students.subtitle')}
          </p>
        </div>

        {activeTab === 'students' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            {user.role === 'DIRECTOR' && (
              <>
                <button
                  onClick={() => setCreateParentModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#1E3A5F]" />
                  <span>{t('students.createParent')}</span>
                </button>
                <button
                  onClick={() => openLinkModal()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <Link2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t('students.linkParent')}</span>
                </button>
              </>
            )}
            {selectedStudents.length > 0 && (
              <button
                onClick={() => setBulkTransferModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md"
              >
                <Users className="h-4 w-4" />
                <span>Transférer ({selectedStudents.length})</span>
              </button>
            )}
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
            {user.role === 'DIRECTOR' && (
              <button
                onClick={() => setCreateParentModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <UserPlus className="h-4.5 w-4.5" />
                <span>{t('students.createParent')}</span>
              </button>
            )}
            {/* Censeur can link parents, but only to their students (handled in modal) */}
            <button
              onClick={() => openLinkModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
            >
              <Link2 className="h-4.5 w-4.5" />
              <span>{t('students.linkParent')}</span>
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
          🎓 {t('students.tabs.students')}
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
          👨‍👩‍👧 {t('students.tabs.parents')}
        </button>
      </div>

      {/* Modals */}
      <SanctionsModal 
        isOpen={sanctionsModalOpen} 
        onClose={() => setSanctionsModalOpen(false)} 
        student={sanctionStudent} 
      />

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
            placeholder={t('students.searchPlaceholder')}
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
            <option value="">{t('students.allClasses')}</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40 shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
          >
            <option value="">{t('students.allStatuses')}</option>
            <option value="ACTIVE">{t('students.table.active') || 'Actifs'}</option>
            <option value="INACTIVE">{t('students.table.inactive') || 'Inactifs'}</option>
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
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(filteredStudents.map(s => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                    />
                  </th>
                  <th className="px-6 py-4">Photo</th>
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
                    <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                      No students found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <input 
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                          className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative group">
                          {student.photoUrl ? (
                            <div className="relative">
                              <img
                                src={student.photoUrl}
                                alt={student.name}
                                className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                              />
                              <button
                                onClick={() => triggerPhotoInput(student.id)}
                                className="absolute -bottom-1 -right-1 bg-[#1E3A5F] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                title="Changer la photo"
                              >
                                <Camera className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => triggerPhotoInput(student.id)}
                              className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-[#1E3A5F] hover:border-[#1E3A5F] transition-all bg-slate-50"
                              title="Ajouter une photo"
                            >
                              {uploadingPhotoId === student.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            {student.name}
                            {student.isStudentCouncil && (
                              <span title={t('studentCouncil.member')} className="text-amber-500">👑</span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-slate-400 italic">
                            {student.user?.email || 'Non généré'}
                          </span>
                        </div>
                      </td>
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
                        {isCenseurAllowed(student.class) && (
                          <>
                            <button
                              onClick={() => { setSanctionStudent(student); setSanctionsModalOpen(true); }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              title="Dossier Disciplinaire"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleCouncil(student.id, student.isStudentCouncil)}
                              className={`p-1.5 rounded-lg transition-colors ${student.isStudentCouncil ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'}`}
                              title={student.isStudentCouncil ? t('studentCouncil.remove') : t('studentCouncil.nominate')}
                            >
                              <Crown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditStudentModal(student)}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Modifier l'élève"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
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
                          </>
                        )}
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Matricule <span className="text-slate-400 lowercase normal-case text-[10px]">(Optionnel)</span></label>
                  <input
                    type="text"
                    value={newMatricule}
                    onChange={(e) => setNewMatricule(e.target.value)}
                    placeholder="Auto-généré si vide"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createPortalAccount}
                      onChange={(e) => setCreatePortalAccount(e.target.checked)}
                      className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
                    />
                    <span className="text-xs font-semibold text-slate-600">Créer compte portail élève</span>
                  </label>
                  {createPortalAccount && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email <span className="text-slate-400 normal-case text-[10px]">(Personnalisé ou généré)</span></label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="prenom.nom@ecole.com"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                      />
                    </div>
                  )}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={newDateOfBirth}
                    onChange={(e) => setNewDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lieu de Naissance</label>
                  <input
                    type="text"
                    value={newPlaceOfBirth}
                    onChange={(e) => setNewPlaceOfBirth(e.target.value)}
                    placeholder="ex: Yaoundé"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
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

      {/* Edit Student Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Modifier l'Élève</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Matricule</label>
                  <input
                    type="text"
                    required
                    value={editMatricule}
                    onChange={(e) => setEditMatricule(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sexe</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Classe Affectée</label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold text-[#1E3A5F]"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date de Naissance</label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lieu de Naissance</label>
                  <input
                    type="text"
                    value={editPlaceOfBirth}
                    onChange={(e) => setEditPlaceOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Statut</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Adresse</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Sauvegarder
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Importer un fichier Excel (.xlsx, .xls) ou coller le CSV
                </label>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleExcelUpload}
                  className="mb-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1E3A5F] file:text-white hover:file:bg-[#152943] transition-all cursor-pointer"
                />
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
      {/* Bulk Transfer Modal */}
      {bulkTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Transférer ({selectedStudents.length}) élèves</h3>
              </div>
              <button onClick={() => setBulkTransferModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleBulkTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Classe de destination</label>
                <select
                  value={bulkTargetClassId}
                  onChange={(e) => setBulkTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none font-bold text-[#1E3A5F]"
                  required
                >
                  <option value="">Sélectionner une classe...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkTransferModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
