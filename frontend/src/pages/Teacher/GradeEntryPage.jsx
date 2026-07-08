import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { Save, CheckSquare, RefreshCw, AlertTriangle, Wifi, WifiOff, Plus, X, FileDown, FileUp, Book, PenTool, MessageSquare } from 'lucide-react';
import * as XLSX from 'xlsx';

const BEHAVIOR_PRESETS = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Très bon comportement', label: 'Très bon comportement' },
  { value: 'Se comporte bien', label: 'Se comporte bien' },
  { value: 'Calme', label: 'Calme' },
  { value: 'Distrait', label: 'Distrait' },
  { value: 'Bavard', label: 'Bavard' },
  { value: 'Turbulent', label: 'Turbulent' },
  { value: 'Désordonné', label: 'Désordonné' }
];

export default function GradeEntryPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);

  // Selections
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSequenceId, setSelectedSequenceId] = useState('');
  const [selectedEvalTypeId, setSelectedEvalTypeId] = useState('null'); // 'null' string represents overall/default evaluation

  // Grades table data
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({}); // studentId -> gradeValue
  const [originalGrades, setOriginalGrades] = useState({});
  const [remarks, setRemarks] = useState({}); // studentId -> behavior remarks
  const [originalRemarks, setOriginalRemarks] = useState({});
  const [customActive, setCustomActive] = useState({}); // studentId -> boolean (for custom inputs)
  const [draftStatus, setDraftStatus] = useState({}); // studentId -> boolean (isDraft)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importingSubjects, setImportingSubjects] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Subject Modal states
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubNameFr, setNewSubNameFr] = useState('');
  const [newSubNameEn, setNewSubNameEn] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCoef, setNewSubCoef] = useState('1.0');
  const [newSubVolume, setNewSubVolume] = useState('0');

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSelectors();
    
    // Sync online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId && selectedSequenceId && selectedEvalTypeId !== undefined) {
      loadGradesTable(selectedClassId, selectedSubjectId, selectedSequenceId, selectedEvalTypeId);
    }
  }, [selectedClassId, selectedSubjectId, selectedSequenceId, selectedEvalTypeId]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubNameFr || !newSubNameEn || !newSubCode) {
      alert('French name, English name, and Code are required');
      return;
    }
    try {
      const created = await apiFetch('/matieres', {
        method: 'POST',
        body: {
          nameFr: newSubNameFr,
          nameEn: newSubNameEn,
          code: newSubCode,
          coefficient: parseFloat(newSubCoef) || 1.0,
          volumeHoraire: parseInt(newSubVolume, 10) || 0,
          classId: selectedClassId
        }
      });
      alert('Subject successfully created and linked to this class!');
      
      // Refresh subjects list
      const subjectsData = await apiFetch('/matieres');
      setSubjects(subjectsData);
      setSelectedSubjectId(created.id);
      
      // Close modal and reset
      setSubjectModalOpen(false);
      setNewSubNameFr('');
      setNewSubNameEn('');
      setNewSubCode('');
      setNewSubCoef('1.0');
      setNewSubVolume('0');
    } catch (err) {
      alert(err.message || 'Failed to create subject');
    }
  };

  const handleImportSubjects = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportingSubjects(true);
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

        const subjectsToImport = jsonData.map(row => {
          return {
            nameFr: row['Nom (FR)'] || row['Name'] || row['Nom'],
            nameEn: row['Nom (EN)'] || row['Name'] || row['Nom'],
            code: row['Code'] || row['CODE'],
            coefficient: row['Coefficient'] || row['Coef'],
            volumeHoraire: row['Volume'] || row['Heures']
          };
        }).filter(s => s.nameFr || s.nameEn);

        if (subjectsToImport.length === 0) {
          alert("Aucune matière trouvée. Assurez-vous d'avoir une colonne 'Nom (FR)' ou 'Nom'.");
          return;
        }

        const res = await apiFetch('/matieres/bulk', {
          method: 'POST',
          body: { subjects: subjectsToImport }
        });

        alert(`${res.count} matières importées avec succès !`);
        const subjectsData = await apiFetch('/matieres');
        setSubjects(subjectsData);
      } catch (err) {
        alert(err.message || "Erreur lors de l'import des matières");
      } finally {
        setImportingSubjects(false);
        e.target.value = null; // reset input
      }
    };
    reader.readAsBinaryString(file);
  };

  async function loadSelectors() {
    try {
      const [classesData, subjectsData, sequencesData, evalsData] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/matieres'),
        apiFetch('/sequences'),
        apiFetch('/evaluation-types')
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
      setSequences(sequencesData);
      setEvaluationTypes(evalsData || []);

      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
      if (subjectsData.length > 0) setSelectedSubjectId(subjectsData[0].id);
      if (sequencesData.length > 0) setSelectedSequenceId(sequencesData.find(s => s.active)?.id || sequencesData[0].id);
    } catch (e) {
      console.error('Failed to load filters:', e);
    }
  }

  async function loadGradesTable(classId, subjectId, sequenceId, evalTypeId) {
    try {
      setLoading(true);
      // Fetch students in this class
      const studentsData = await apiFetch(`/eleves?classId=${classId}`);
      setStudents(studentsData);

      // Fetch grades for this class, subject, sequence and evaluation type
      let url = `/notes?classId=${classId}&matiereId=${subjectId}&sequenceId=${sequenceId}`;
      if (evalTypeId && evalTypeId !== 'null') {
        url += `&evaluationTypeId=${evalTypeId}`;
      } else {
        url += `&evaluationTypeId=null`;
      }
      const gradesData = await apiFetch(url);
      
      const newGrades = {};
      const newOriginalGrades = {};
      const newDraftStatus = {};
      const newRemarks = {};
      const newOriginalRemarks = {};
      
      const offlineKey = `offline_grades_${classId}_${subjectId}_${sequenceId}_${evalTypeId}`;
      const offlineDataStr = localStorage.getItem(offlineKey);
      let offlineGrades = null;
      let offlineRemarks = null;
      if (offlineDataStr) {
        try {
          const parsed = JSON.parse(offlineDataStr);
          if (parsed && typeof parsed === 'object') {
            if (parsed.grades === undefined) {
              offlineGrades = parsed; // Old format
              offlineRemarks = {};
            } else {
              offlineGrades = parsed.gradesObj || parsed.grades || {};
              offlineRemarks = parsed.remarksObj || parsed.remarks || {};
            }
          }
        } catch (e) {
          console.error("Failed to parse offline data", e);
        }
      }
      
      let loadedOffline = false;

      studentsData.forEach(student => {
        const found = gradesData.find(g => g.eleveId === student.id);
        const serverVal = found ? found.value : '';
        const serverRem = found ? (found.remarks || '') : '';
        
        let finalVal = serverVal;
        let finalRem = serverRem;
        
        if (offlineGrades && offlineGrades[student.id] !== undefined) {
          finalVal = offlineGrades[student.id];
          if (finalVal !== serverVal) loadedOffline = true;
        }
        if (offlineRemarks && offlineRemarks[student.id] !== undefined) {
          finalRem = offlineRemarks[student.id];
          if (finalRem !== serverRem) loadedOffline = true;
        }

        newGrades[student.id] = finalVal;
        newOriginalGrades[student.id] = serverVal;
        newDraftStatus[student.id] = found ? found.isDraft : true; // default is draft
        newRemarks[student.id] = finalRem;
        newOriginalRemarks[student.id] = serverRem;
      });

      setGrades(newGrades);
      setOriginalGrades(newOriginalGrades);
      setDraftStatus(newDraftStatus);
      setRemarks(newRemarks);
      setOriginalRemarks(newOriginalRemarks);
      setHasUnsavedChanges(loadedOffline);
    } catch (e) {
      console.error('Failed to load grades:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleGradeChange = (studentId, val) => {
    setHasUnsavedChanges(true);
    // Clamp values between 0 and 20, allowing empty strings
    if (val === '') {
      setGrades(prev => ({ ...prev, [studentId]: '' }));
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 20) {
      setGrades(prev => ({ ...prev, [studentId]: num }));
    }
  };

  const handleClassChange = (val) => {
    if (hasUnsavedChanges && !window.confirm('Vous avez des modifications non sauvegardées. Changer de classe annulera ces changements. Confirmer ?')) {
      return;
    }
    setSelectedClassId(val);
    setHasUnsavedChanges(false);
  };

  const handleSubjectChange = (val) => {
    if (hasUnsavedChanges && !window.confirm('Vous avez des modifications non sauvegardées. Changer de matière annulera ces changements. Confirmer ?')) {
      return;
    }
    setSelectedSubjectId(val);
    setHasUnsavedChanges(false);
  };

  const handleSequenceChange = (val) => {
    if (hasUnsavedChanges && !window.confirm('Vous avez des modifications non sauvegardées. Changer de séquence annulera ces changements. Confirmer ?')) {
      return;
    }
    setSelectedSequenceId(val);
    setHasUnsavedChanges(false);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const gradesPayload = Object.keys(grades)
        .filter(studentId => grades[studentId] !== originalGrades[studentId] || remarks[studentId] !== originalRemarks[studentId])
        .map(studentId => ({
          eleveId: studentId,
          value: grades[studentId] === '' ? 0 : parseFloat(grades[studentId]),
          isDraft: true,
          remarks: remarks[studentId] || ''
        }));

      // Offline mode handling
      if (!isOnline) {
        localStorage.setItem(`offline_grades_${selectedClassId}_${selectedSubjectId}_${selectedSequenceId}_${selectedEvalTypeId}`, JSON.stringify({ 
          gradesObj: grades, 
          remarksObj: remarks,
          classId: selectedClassId,
          matiereId: selectedSubjectId,
          sequenceId: selectedSequenceId,
          evaluationTypeId: selectedEvalTypeId,
          grades: gradesPayload 
        }));
        
        // Remove manual alert and silently save, showing toast or indicator.
        // Alert can be kept short, but the background sync will take over when online.
        setHasUnsavedChanges(false);
        setSaving(false);
        return;
      }



      if (gradesPayload.length === 0) {
        setSaving(false);
        setHasUnsavedChanges(false);
        return;
      }

      await apiFetch('/notes/bulk', {
        method: 'POST',
        body: {
          classId: selectedClassId,
          matiereId: selectedSubjectId,
          sequenceId: selectedSequenceId,
          evaluationTypeId: selectedEvalTypeId === 'null' ? null : selectedEvalTypeId,
          grades: gradesPayload
        }
      });

      localStorage.removeItem(`offline_grades_${selectedClassId}_${selectedSubjectId}_${selectedSequenceId}_${selectedEvalTypeId}`);
      alert(t('grades.draftSaved'));
      loadGradesTable(selectedClassId, selectedSubjectId, selectedSequenceId, selectedEvalTypeId);
    } catch (e) {
      alert(e.message || 'Failed to save drafts');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateLock = async () => {
    if (!window.confirm('Are you sure you want to validate and lock these grades? Once locked, only the School Director can unlock them.')) return;
    setSaving(true);
    try {
      const gradesPayload = Object.keys(grades)
        .filter(studentId => draftStatus[studentId] !== false || grades[studentId] !== originalGrades[studentId] || remarks[studentId] !== originalRemarks[studentId])
        .map(studentId => ({
          eleveId: studentId,
          value: grades[studentId] === '' ? 0 : parseFloat(grades[studentId]),
          isDraft: false, // validated
          remarks: remarks[studentId] || ''
        }));

      if (!isOnline) {
        localStorage.setItem(`offline_grades_${selectedClassId}_${selectedSubjectId}_${selectedSequenceId}_${selectedEvalTypeId}`, JSON.stringify({ 
          gradesObj: grades, 
          remarksObj: remarks,
          classId: selectedClassId,
          matiereId: selectedSubjectId,
          sequenceId: selectedSequenceId,
          evaluationTypeId: selectedEvalTypeId,
          grades: gradesPayload 
        }));
        setHasUnsavedChanges(false);
        setSaving(false);
        return;
      }

      if (gradesPayload.length === 0) {
        setSaving(false);
        setHasUnsavedChanges(false);
        return;
      }

      await apiFetch('/notes/bulk', {
        method: 'POST',
        body: {
          classId: selectedClassId,
          matiereId: selectedSubjectId,
          sequenceId: selectedSequenceId,
          evaluationTypeId: selectedEvalTypeId === 'null' ? null : selectedEvalTypeId,
          grades: gradesPayload
        }
      });

      localStorage.removeItem(`offline_grades_${selectedClassId}_${selectedSubjectId}_${selectedSequenceId}_${selectedEvalTypeId}`);
      alert(t('grades.validated'));
      loadGradesTable(selectedClassId, selectedSubjectId, selectedSequenceId, selectedEvalTypeId);
    } catch (e) {
      alert(e.message || 'Failed to validate grades');
    } finally {
      setSaving(false);
    }
  };

  const handleExportTemplate = () => {
    if (students.length === 0) {
      alert("Aucun élève dans cette classe. Impossible de générer le modèle.");
      return;
    }

    const wsData = [
      ["Matricule", "Noms & Prénoms", "Note (sur 20)", "Remarque"]
    ];

    students.forEach(student => {
      wsData.push([
        student.matricule,
        student.name,
        grades[student.id] !== undefined ? grades[student.id] : '',
        remarks[student.id] || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Styling column widths
    ws['!cols'] = [
      { wch: 15 }, // Matricule
      { wch: 35 }, // Noms
      { wch: 15 }, // Note
      { wch: 30 }  // Remarque
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    
    const cls = classes.find(c => c.id === selectedClassId)?.name || "Classe";
    const sub = subjects.find(s => s.id === selectedSubjectId)?.nameFr || "Matiere";
    
    XLSX.writeFile(wb, `Modele_Notes_${cls}_${sub}.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let changesCount = 0;
        const newGrades = { ...grades };
        const newRemarks = { ...remarks };
        const newCustomActive = { ...customActive };

        data.forEach(row => {
          const matricule = row["Matricule"];
          const noteRaw = row["Note (sur 20)"];
          const remRaw = row["Remarque"] || '';

          if (!matricule) return;

          const student = students.find(s => s.matricule === matricule);
          if (student) {
            let noteStr = '';
            if (noteRaw !== undefined && noteRaw !== null) {
               // Handle comma decimals
               noteStr = String(noteRaw).replace(',', '.');
            }
            
            const num = parseFloat(noteStr);
            if (!isNaN(num) && num >= 0 && num <= 20) {
              newGrades[student.id] = num;
            } else if (noteStr === '') {
              newGrades[student.id] = '';
            }

            newRemarks[student.id] = remRaw;
            
            // Activate custom input if remark is not empty and not in presets
            const isPreset = BEHAVIOR_PRESETS.some(p => p.value === remRaw);
            if (remRaw !== '' && !isPreset) {
              newCustomActive[student.id] = true;
            } else {
              newCustomActive[student.id] = false;
            }
            
            changesCount++;
          }
        });

        if (changesCount > 0) {
          setGrades(newGrades);
          setRemarks(newRemarks);
          setCustomActive(newCustomActive);
          setHasUnsavedChanges(true);
          alert(`${changesCount} ligne(s) importée(s) avec succès. N'oubliez pas d'enregistrer !`);
        } else {
          alert("Aucune donnée valide trouvée pour les élèves de cette classe.");
        }
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Grade stats
  const totalStudents = students.length;
  const gradedCount = Object.keys(grades).filter(id => grades[id] !== '').length;
  const progressPercent = totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0;
  const isReadOnly = user?.role === 'CENSEUR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('grades.entryTitle') || t('grades.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            {t('grades.entrySubtitle')}
          </p>
        </div>

        {/* Top Actions & Offline Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
          {hasUnsavedChanges && (
            <span className="text-xs font-black text-rose-500 animate-pulse bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
              Modifications non sauvegardées
            </span>
          )}
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
              : 'bg-amber-50 text-amber-700 border border-amber-250 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{isOnline ? t('grades.status.online') : t('grades.modeOffline')}</span>
          </div>

          {!isReadOnly && (
            <>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                ref={fileInputRef} 
                onChange={handleImportExcel} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={handleExportTemplate}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-500" />
                <span className="hidden sm:inline">Modèle Excel</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FileUp className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Importer Notes</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 text-amber-500" />
                <span>{t('grades.btn.saveDraft')}</span>
              </button>
              
              <button
                type="button"
                onClick={handleValidateLock}
                disabled={saving || !isOnline}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                <CheckSquare className="h-3.5 w-3.5 text-white" />
                <span>{t('grades.btn.submitFinal')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('grades.filters.class')}</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all font-bold text-slate-700"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('grades.filters.subject')}</label>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider focus:outline-none transition-colors cursor-pointer disabled:opacity-50">
                {importingSubjects ? "IMPORT..." : "IMPORT"}
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportSubjects} disabled={importingSubjects} />
              </label>
              <button
                type="button"
                onClick={() => setSubjectModalOpen(true)}
                className="text-[10px] font-black text-[#1E3A5F] hover:text-[#F5A623] uppercase tracking-wider focus:outline-none transition-colors"
              >
                {t('grades.filters.add')}
              </button>
            </div>
          </div>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all font-bold text-slate-700"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.nameFr} ({s.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('grades.filters.sequence')}</label>
          <select
            value={selectedSequenceId}
            onChange={(e) => handleSequenceChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all font-bold text-slate-700"
          >
            {sequences.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.active ? '(Active)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>{t('grades.progress.title')}</span>
          <span>{gradedCount} / {totalStudents} {t('grades.progress.graded')} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-[#1E3A5F] h-full rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grades Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading evaluation registry...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t('grades.table.student')}</th>
                    <th className="px-6 py-4">{t('grades.table.matricule')}</th>
                    <th className="px-6 py-4 w-40">{t('grades.table.grade')}</th>
                    <th className="px-6 py-4 w-60">{t('grades.table.remarks')}</th>
                    <th className="px-6 py-4 text-center">{t('grades.table.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                        No students enrolled in this class.
                      </td>
                    </tr>
                  ) : (
                    students.map(student => {
                      const isDraft = draftStatus[student.id] !== false;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">{student.matricule}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              disabled={!isDraft || isReadOnly}
                              value={grades[student.id] ?? ''}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              placeholder="0.00"
                              className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none focus:border-transparent text-center font-bold text-slate-800 disabled:bg-slate-55 disabled:text-slate-400 transition-all"
                            />
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const remarkVal = remarks[student.id] || '';
                              const isPreset = BEHAVIOR_PRESETS.some(p => p.value === remarkVal);
                              const showTextInput = customActive[student.id] || (remarkVal !== '' && !isPreset);
                              return (
                                <div className="flex flex-col gap-1.5 w-full">
                                  <select
                                    disabled={!isDraft || isReadOnly}
                                    value={showTextInput ? 'custom' : remarkVal}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'custom') {
                                        setCustomActive(prev => ({ ...prev, [student.id]: true }));
                                      } else {
                                        setCustomActive(prev => ({ ...prev, [student.id]: false }));
                                        setRemarks(prev => ({ ...prev, [student.id]: val }));
                                        setHasUnsavedChanges(true);
                                      }
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-xs"
                                  >
                                    <option value="">{t('grades.table.chooseRemark')}</option>
                                    {BEHAVIOR_PRESETS.map(p => (
                                      <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                    <option value="custom">✍️ Personnalisé...</option>
                                  </select>
                                  {showTextInput && (
                                    <input
                                      type="text"
                                      disabled={!isDraft || isReadOnly}
                                      value={remarkVal}
                                      onChange={(e) => {
                                        setRemarks(prev => ({ ...prev, [student.id]: e.target.value }));
                                        setHasUnsavedChanges(true);
                                      }}
                                      placeholder="Saisir remarque..."
                                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-semibold text-[#1E3A5F] disabled:bg-slate-50 disabled:text-slate-400 transition-all text-xs"
                                    />
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isDraft 
                                ? 'bg-amber-50 text-amber-700 border border-amber-250' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                            }`}>
                              <span className={`h-2.5 w-2.5 rounded-full ${isDraft ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                              {isDraft ? t('grades.statusLabel.draft') : t('grades.validated')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions Bar */}
            {!isReadOnly && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  <Save className="h-4 w-4 text-amber-500" />
                  <span>{t('grades.saveDraft')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleValidateLock}
                  disabled={saving || !isOnline}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                >
                  <CheckSquare className="h-4 w-4 text-white" />
                  <span>{t('grades.validate')}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Subject Modal */}
      {subjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Add Subject / Ajouter une Matière</h3>
              </div>
              <button type="button" onClick={() => setSubjectModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Name (FR)</label>
                <input
                  type="text"
                  required
                  value={newSubNameFr}
                  onChange={(e) => setNewSubNameFr(e.target.value)}
                  placeholder="e.g. Allemand, Informatique"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Name (EN)</label>
                <input
                  type="text"
                  required
                  value={newSubNameEn}
                  onChange={(e) => setNewSubNameEn(e.target.value)}
                  placeholder="e.g. German, Computer Science"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GERM, COMP"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coefficient</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    required
                    value={newSubCoef}
                    onChange={(e) => setNewSubCoef(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Volume Horaire (h/semaine)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="40"
                    required
                    value={newSubVolume}
                    onChange={(e) => setNewSubVolume(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold text-slate-800 text-center"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Add & Link Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
