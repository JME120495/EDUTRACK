import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch, API_BASE } from '../api';
import { AuthContext } from '../context/AuthContext';
import { Settings, Save, Clock, BookOpen, CheckCircle, Plus, Edit2, Trash2, X, Palette, Calendar, Upload, Shield, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import SettingsEvaluations from '../components/Shared/SettingsEvaluations';
import SettingsSequences from '../components/Shared/SettingsSequences';

export default function SettingsPage() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || 'XAF';

  const { t } = useTranslation();
  const { updateLanguage } = useContext(AuthContext);

  const [school, setSchool] = useState({
    name: 'Collège Saint-Michel de Yaoundé',
    logo: '',
    defaultLanguage: 'FR',
    phone: '+237222334455',
    address: 'Nlongkak, Yaoundé, Cameroun',
    email: 'contact@saintmichel.edutrack.com',
    pdfTheme: 'NAVY',
    pdfPrimaryColor: '#1E3A5F',
    pdfSecondaryColor: '#F5A623',
    pdfShowBorder: true
  });
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Creneaux state
  const [creneaux, setCreneaux] = useState([]);
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [creneauModalOpen, setCreneauModalOpen] = useState(false);

  // Creneau Form State
  const [cLabel, setCLabel] = useState('');
  const [cStartTime, setCStartTime] = useState('');
  const [cEndTime, setCEndTime] = useState('');
  const [cOrder, setCOrder] = useState(0);

  // Annee Scolaire State
  const [annees, setAnnees] = useState([]);
  const [selectedAnnee, setSelectedAnnee] = useState(null);
  const [anneeModalOpen, setAnneeModalOpen] = useState(false);
  const [aLabel, setALabel] = useState('');
  const [aActive, setAActive] = useState(false);

  // Classes State
  const [classesList, setClassesList] = useState([]);
  const [importClassId, setImportClassId] = useState('');

  // Import State
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importPhase, setImportPhase] = useState('');
  const [importLogs, setImportLogs] = useState([]);

  // Chunked import logic — parse Excel client-side, send JSON chunks
  const CHUNK_SIZE = 200;
  const SHEET_ORDER = ['classes', 'enseignants', 'matieres', 'eleves', 'notes', 'absences', 'paiements'];
  const SHEET_LABELS = {
    classes: 'Classes', enseignants: 'Enseignants', matieres: 'Matières',
    eleves: 'Élèves & Parents', notes: 'Notes', absences: 'Absences', paiements: 'Paiements'
  };

  async function handleChunkedImport(file) {
    setIsImporting(true);
    setImportProgress(0);
    setImportPhase('Lecture du fichier...');
    setImportLogs([]);
    setImportResult(null);

    try {
      // 1. Parse Excel client-side
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

      const normalizeStr = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const findSheet = (possibleNames) => wb.SheetNames.find(n => possibleNames.includes(normalizeStr(n)));

      // 2. Build ordered list of sheets with their data
      const sheetWork = [];
      for (const sheetKey of SHEET_ORDER) {
        const possibleNames = sheetKey === 'classes' ? ['classes', 'classe']
          : sheetKey === 'enseignants' ? ['enseignants', 'enseignant']
          : sheetKey === 'matieres' ? ['matieres', 'matiere']
          : sheetKey === 'eleves' ? ['eleves', 'eleve']
          : sheetKey === 'notes' ? ['notes', 'note']
          : sheetKey === 'absences' ? ['absences', 'absence']
          : ['paiements', 'paiement'];

        const sheetName = findSheet(possibleNames);
        if (!sheetName) continue;

        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        if (rows.length === 0) continue;

        // Split rows into chunks
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          sheetWork.push({
            sheet: sheetKey,
            data: rows.slice(i, i + CHUNK_SIZE),
            label: SHEET_LABELS[sheetKey],
            rowStart: i,
            rowEnd: Math.min(i + CHUNK_SIZE, rows.length),
            totalRows: rows.length
          });
        }
      }

      if (sheetWork.length === 0) {
        setIsImporting(false);
        setImportResult({ success: false, error: 'Aucune feuille valide trouvée dans le fichier Excel.' });
        return;
      }

      // 3. Send chunks sequentially
      const token = localStorage.getItem('edutrack_token');
      const totalChunks = sheetWork.length;
      const allLogs = [];
      const totalStats = { classes: 0, enseignants: 0, matieres: 0, eleves: 0, notes: 0, absences: 0, paiements: 0 };
      let errors = [];

      for (let i = 0; i < totalChunks; i++) {
        const work = sheetWork[i];
        const pct = Math.round(((i) / totalChunks) * 100);
        setImportProgress(pct);
        setImportPhase(`${work.label} (lignes ${work.rowStart + 1}-${work.rowEnd} / ${work.totalRows})`);

        try {
          const res = await fetch(`${API_BASE}/import/chunk`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sheet: work.sheet,
              data: work.data,
              chunkIndex: i,
              totalChunks,
              ...(importClassId ? { classId: importClassId } : {})
            })
          });

          const result = await res.json();
          if (res.ok) {
            if (result.logs) allLogs.push(...result.logs);
            if (result.stats) {
              Object.entries(result.stats).forEach(([k, v]) => { totalStats[k] = (totalStats[k] || 0) + v; });
            }
          } else {
            errors.push(`${work.label} chunk ${i+1}: ${result.error || 'Erreur inconnue'}`);
            allLogs.push(`❌ Erreur ${work.label} (lignes ${work.rowStart+1}-${work.rowEnd}): ${result.error}`);
          }
        } catch (fetchErr) {
          errors.push(`${work.label} chunk ${i+1}: ${fetchErr.message}`);
          allLogs.push(`❌ Erreur réseau ${work.label}: ${fetchErr.message}`);
        }

        setImportLogs([...allLogs]);
      }

      setImportProgress(100);
      setImportPhase('Terminé !');
      setIsImporting(false);

      if (errors.length > 0 && Object.values(totalStats).every(v => v === 0)) {
        setImportResult({ success: false, error: errors.join('\n') });
      } else {
        setImportResult({
          success: true,
          data: {
            message: errors.length > 0
              ? `Importation terminée avec ${errors.length} erreur(s) sur ${totalChunks} chunks.`
              : 'Importation globale terminée avec succès.',
            stats: totalStats,
            logs: allLogs
          }
        });
      }
    } catch (err) {
      setIsImporting(false);
      setImportResult({ success: false, error: `Erreur de lecture du fichier: ${err.message}` });
    }
  }


  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const [schoolData, studentsData, creneauxData, anneesData, classesData] = await Promise.all([
        apiFetch('/schools'),
        apiFetch('/eleves'),
        apiFetch('/creneaux').catch(() => []),
        apiFetch('/annees').catch(() => []),
        apiFetch('/classes').catch(() => [])
      ]);
      if (schoolData) {
        setSchool(schoolData);
      }
      if (studentsData) {
        setStudentCount(studentsData.length);
      }
      if (creneauxData) {
        setCreneaux(creneauxData);
      }
      if (anneesData) {
        setAnnees(anneesData);
      }
      if (classesData) {
        setClassesList(classesData);
      }
      if (arguments[0] && arguments[0][3]) {
        setAnnees(arguments[0][3]);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddCreneau = () => {
    setSelectedCreneau(null);
    setCLabel('');
    setCStartTime('');
    setCEndTime('');
    setCOrder(creneaux.length + 1);
    setCreneauModalOpen(true);
  };

  const handleOpenEditCreneau = (c) => {
    setSelectedCreneau(c);
    setCLabel(c.label || '');
    setCStartTime(c.startTime);
    setCEndTime(c.endTime);
    setCOrder(c.order || 0);
    setCreneauModalOpen(true);
  };

  const handleSaveCreneau = async (e) => {
    e.preventDefault();
    if (!cStartTime || !cEndTime || !cLabel) {
      alert('Label, Heure de début et de fin sont requis');
      return;
    }

    try {
      if (selectedCreneau) {
        // Edit mode
        await apiFetch(`/creneaux/${selectedCreneau.id}`, {
          method: 'PUT',
          body: {
            label: cLabel,
            startTime: cStartTime,
            endTime: cEndTime,
            order: parseInt(cOrder)
          }
        });
        alert('Créneau horaire mis à jour avec succès !');
      } else {
        // Add mode
        await apiFetch('/creneaux', {
          method: 'POST',
          body: {
            label: cLabel,
            startTime: cStartTime,
            endTime: cEndTime,
            order: parseInt(cOrder)
          }
        });
        alert('Créneau horaire ajouté avec succès !');
      }
      setCreneauModalOpen(false);
      
      // Reload creneaux
      const creneauxData = await apiFetch('/creneaux');
      setCreneaux(creneauxData);
    } catch (err) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteCreneau = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ? Les cours affectés à cette heure seront également impactés.')) return;
    try {
      await apiFetch(`/creneaux/${id}`, { method: 'DELETE' });
      setCreneaux(prev => prev.filter(c => c.id !== id));
      alert('Créneau horaire supprimé avec succès.');
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleGenerateDefaultCreneaux = async () => {
    if (!window.confirm('Voulez-vous générer les créneaux standards par défaut (M1 à M8) ?\nAttention : cela ne fonctionne que si vous n\'avez aucun créneau.')) return;
    try {
      setSaving(true);
      const data = await apiFetch('/creneaux/generate-default', { method: 'POST' });
      setCreneaux(data.creneaux);
      alert(data.message);
    } catch (err) {
      alert(err.message || 'Erreur lors de la génération des créneaux.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddAnnee = () => {
    setSelectedAnnee(null);
    setALabel('');
    setAActive(false);
    setAnneeModalOpen(true);
  };

  const handleOpenEditAnnee = (a) => {
    setSelectedAnnee(a);
    setALabel(a.label);
    setAActive(a.active);
    setAnneeModalOpen(true);
  };

  const handleSaveAnnee = async (e) => {
    e.preventDefault();
    if (!aLabel) return;
    try {
      if (selectedAnnee) {
        await apiFetch(`/annees/${selectedAnnee.id}`, {
          method: 'PUT',
          body: { label: aLabel, active: aActive }
        });
      } else {
        await apiFetch('/annees', {
          method: 'POST',
          body: { label: aLabel, active: aActive }
        });
      }
      setAnneeModalOpen(false);
      const data = await apiFetch('/annees');
      setAnnees(data);
    } catch (err) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteAnnee = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette année scolaire ?')) return;
    try {
      await apiFetch(`/annees/${id}`, { method: 'DELETE' });
      setAnnees(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setSchool(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("L'image est trop volumineuse. Veuillez choisir un fichier de moins de 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSchool(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleThemeChange = (e) => {
    const theme = e.target.value;
    let primary = '#1E3A5F';
    let secondary = '#F5A623';
    
    if (theme === 'GREEN') {
      primary = '#065F46';
      secondary = '#F5A623';
    } else if (theme === 'CRIMSON') {
      primary = '#7F1D1D';
      secondary = '#94A3B8';
    } else if (theme === 'CHARCOAL') {
      primary = '#1E293B';
      secondary = '#3B82F6';
    }
    
    setSchool(prev => ({
      ...prev,
      pdfTheme: theme,
      ...(theme !== 'CUSTOM' ? { pdfPrimaryColor: primary, pdfSecondaryColor: secondary } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await apiFetch('/schools/settings', {
        method: 'PUT',
        body: school
      });
      // Sync local context language if changed
      updateLanguage(school.defaultLanguage);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading school configurations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
          {t('settings.title')}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          Configure default bilingual formats, contact information, and terms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Settings className="h-5 w-5 text-[#1E3A5F]" />
            <h3 className="font-bold text-[#1E3A5F] font-outfit">Institution Profile</h3>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
              <span>{t('settings.title')} updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">School Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={school.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Default Language</label>
                <select
                  name="defaultLanguage"
                  value={school.defaultLanguage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                >
                  <option value="FR">French (FR)</option>
                  <option value="EN">English (EN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Devise / Currency</label>
                <select
                  name="currency"
                  value={school.currency || 'XAF'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                >
                  <option value="XAF">FCFA (CEMAC)</option>
                  <option value="XOF">FCFA (UEMOA)</option>
                  <option value="NGN">Naira (NGN)</option>
                  <option value="KES">Shilling Kényan (KES)</option>
                  <option value="ZAR">Rand (ZAR)</option>
                  <option value="MAD">Dirham Marocain (MAD)</option>
                  <option value="CDF">Franc Congolais (CDF)</option>
                  <option value="GHS">Cedi Ghanéen (GHS)</option>
                  <option value="USD">Dollar US ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={school.phone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={school.email || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Physical Address</label>
              <input
                type="text"
                name="address"
                value={school.address || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Logo de l'école (School Logo)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: File Upload */}
                <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:border-[#1E3A5F] transition-colors bg-slate-50/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Télécharger depuis votre appareil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500
                      file:mr-4 file:py-1.5 file:px-3
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-blue-50 file:text-[#1E3A5F]
                      hover:file:bg-blue-100 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-400">PNG, JPG, JPEG ou GIF, max 2Mo</span>
                </div>

                {/* Option 2: Image Link */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-center gap-2 bg-slate-50/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ou coller un lien d'image (URL)</span>
                  <input
                    type="text"
                    name="logo"
                    value={school.logo && !school.logo.startsWith('data:') ? school.logo : ''}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Logo Preview & Reset */}
              {school.logo && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <img src={school.logo} alt="Preview Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-200 bg-white" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-[#1E3A5F]">Aperçu du Logo</p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[200px]">
                      {school.logo.startsWith('data:') ? 'Image importée (Base64)' : school.logo}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSchool(prev => ({ ...prev, logo: '' }))}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-250 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* PDF Theme & Color Customization Panel */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <Palette className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Personnalisation Visuelle des Bulletins (PDF)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Modèle de Thème</label>
                  <select
                    name="pdfTheme"
                    value={school.pdfTheme || 'NAVY'}
                    onChange={handleThemeChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-700"
                  >
                    <option value="NAVY">Bleu Classique / Navy 🔵🟡</option>
                    <option value="GREEN">Vert Académique / Green 🟢🟡</option>
                    <option value="CRIMSON">Prestige Royal / Crimson 🔴⚪</option>
                    <option value="CHARCOAL">Gris Moderne / Charcoal ⚫🔵</option>
                    <option value="CUSTOM">Couleurs Personnalisées 🎨</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Couleur Principale</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      name="pdfPrimaryColor"
                      disabled={school.pdfTheme !== 'CUSTOM'}
                      value={school.pdfPrimaryColor || '#1E3A5F'}
                      onChange={handleChange}
                      className="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">{school.pdfPrimaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Couleur Secondaire</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      name="pdfSecondaryColor"
                      disabled={school.pdfTheme !== 'CUSTOM'}
                      value={school.pdfSecondaryColor || '#F5A623'}
                      onChange={handleChange}
                      className="h-9 w-12 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 uppercase">{school.pdfSecondaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pdfShowBorder"
                  name="pdfShowBorder"
                  checked={school.pdfShowBorder !== false}
                  onChange={(e) => setSchool(prev => ({ ...prev, pdfShowBorder: e.target.checked }))}
                  className="h-4 w-4 text-[#1E3A5F] border-slate-300 rounded focus:ring-[#1E3A5F] cursor-pointer"
                />
                <label htmlFor="pdfShowBorder" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Afficher la double bordure décorative sur le contour du bulletin
                </label>
              </div>

              {/* Live Preview Container Mockup */}
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">Aperçu en direct de l'en-tête du Bulletin</span>
                
                <div 
                  className="bg-white p-4 rounded-xl relative overflow-hidden transition-all duration-300 shadow-sm"
                  style={{
                    border: school.pdfShowBorder ? `3px double ${school.pdfSecondaryColor}` : '1px solid #E2E8F0',
                  }}
                >
                  {/* Outer borders simulation */}
                  {school.pdfShowBorder && (
                    <div 
                      className="absolute inset-0.5 border pointer-events-none" 
                      style={{ borderColor: school.pdfPrimaryColor }}
                    />
                  )}
                  
                  <div className="flex justify-between items-start gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      {school.logo ? (
                        <img src={school.logo} alt="Mockup Logo" className="h-9 w-9 object-contain rounded border border-slate-200" />
                      ) : (
                        <div className="h-9 w-9 rounded bg-slate-100 flex items-center justify-center border border-slate-200 font-bold text-slate-400 text-[10px]">LOGO</div>
                      )}
                      <div>
                        <p 
                          className="font-black text-xs transition-colors duration-300 tracking-wide"
                          style={{ color: school.pdfPrimaryColor }}
                        >
                          {school.name.toUpperCase()}
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold tracking-tight">{school.address || 'Adresse de l\'établissement'}</p>
                      </div>
                    </div>
                    
                    <div 
                      className="px-3 py-1.5 rounded text-[8px] text-white font-black transition-all duration-300 uppercase tracking-widest"
                      style={{ backgroundColor: school.pdfPrimaryColor }}
                    >
                      SÉQUENCE 1 (2025-2026)
                    </div>
                  </div>
                  
                  {/* Table simulation preview */}
                  <div className="mt-4 border rounded-lg overflow-hidden" style={{ borderColor: school.pdfPrimaryColor }}>
                    <div className="grid grid-cols-4 text-[7px] font-black text-white p-1 px-2.5" style={{ backgroundColor: school.pdfPrimaryColor }}>
                      <span>Matière / Subject</span>
                      <span className="text-center">Note / Grade</span>
                      <span className="text-center">Moy. Cl / Class Avg</span>
                      <span className="text-right">Appréciation</span>
                    </div>
                    <div className="grid grid-cols-4 text-[7px] font-bold text-slate-600 p-1 px-2.5 bg-slate-50 border-t border-slate-100">
                      <span>Mathématiques / Math</span>
                      <span className="text-center font-extrabold" style={{ color: school.pdfPrimaryColor }}>18.50 / 20</span>
                      <span className="text-center">12.30</span>
                      <span className="text-right text-emerald-600">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{t('settings.save')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Panels */}
        <div className="space-y-6">
          {/* Data & Compliance Panel */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Shield className="h-24 w-24" />
            </div>
            
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-100" />
                <h3 className="font-black tracking-wide text-lg text-white">Conformité RGPD / Loi 2024</h3>
              </div>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                Téléchargez le registre des traitements et des consentements parentaux pour prouver la conformité légale de votre établissement.
              </p>
            </div>

            <div className="relative z-10 pt-2 border-t border-indigo-400/30">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('edutrack_token');
                    const res = await fetch(`${API_BASE}/consents/export`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'registre_traitements_consentement.csv';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error(err);
                    alert('Failed to export register');
                  }
                }}
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 transition-all py-2 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter le Registre (CSV)
              </button>
            </div>
          </div>

          {/* Cache & Performance Panel */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Settings className="h-24 w-24" />
            </div>
            
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-100" />
                <h3 className="font-black tracking-wide text-lg text-white">Maintenance & Cache</h3>
              </div>
              <p className="text-xs text-amber-100 font-medium leading-relaxed">
                Si l'application devient lente, videz le cache manuellement. Le nettoyage automatique est actif en arrière-plan.
              </p>
            </div>

            <div className="relative z-10 pt-2 border-t border-amber-400/30">
              <button
                onClick={async () => {
                  try {
                    const { forceFullCleanup } = await import('../utils/cacheBuster');
                    await forceFullCleanup();
                    alert('✅ Cache nettoyé avec succès ! L\'application va se recharger.');
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert('Erreur lors du nettoyage du cache');
                  }
                }}
                className="w-full bg-white text-amber-600 hover:bg-amber-50 hover:scale-[1.02] active:scale-95 transition-all py-2 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Vider tout le cache maintenant
              </button>
            </div>
          </div>
          {/* Global Import Panel */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <BookOpen className="h-24 w-24" />
            </div>
            
            <div className="border-b border-white/20 pb-3 relative z-10">
              <h4 className="font-bold text-sm font-outfit text-emerald-50">Importation Globale (Excel)</h4>
              <p className="text-[10px] text-emerald-100 font-semibold mt-0.5">Importez classes, élèves, professeurs en 1 clic</p>
            </div>
            
            <div className="relative z-10 space-y-3">
              <div className="text-[10px] text-emerald-50 leading-relaxed bg-black/10 p-2.5 rounded-lg border border-white/10">
                <p>1. Téléchargez le modèle Excel.</p>
                <p>2. Remplissez les différentes feuilles.</p>
                <p>3. Importez le fichier complété.</p>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('edutrack_token');
                      const res = await fetch(`${API_BASE}/import/template`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (!res.ok) {
                        const errText = await res.text().catch(() => '');
                        throw new Error(`Erreur ${res.status}: ${errText || res.statusText}`);
                      }
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = "EduTrack_Import_Template.xlsx";
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                  className="w-full py-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Télécharger le Modèle
                </button>
                
                <div className="w-full relative">
                  <select
                    value={importClassId}
                    onChange={(e) => setImportClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none font-semibold mb-3"
                  >
                    <option value="" className="text-slate-800">Toutes les classes (Global)</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id} className="text-slate-800">Importer pour : {c.name}</option>
                    ))}
                  </select>
                </div>
                
                <label className="w-full py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center cursor-pointer shadow-sm flex items-center justify-center gap-2 relative">
                  <Upload className="h-4 w-4" />
                  Importer le Fichier Rempli
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="hidden"
                    disabled={isImporting}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      handleChunkedImport(file);
                      e.target.value = null;
                    }}
                  />
                </label>

                {/* Progressive Import Progress Bar */}
                {isImporting && (
                  <div className="mt-2 space-y-2 bg-black/10 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin flex-shrink-0" />
                      <span className="text-[11px] text-white font-bold truncate">{importPhase}</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white/80 to-emerald-200 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-emerald-100 font-semibold text-center">
                      {importProgress}% — {importLogs.length > 0 ? importLogs[importLogs.length - 1] : 'Préparation...'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time slot manager panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-[#1E3A5F]" />
                <h4 className="font-bold text-[#1E3A5F] text-sm font-outfit font-black">Configuration des Heures</h4>
              </div>
              <div className="flex items-center gap-2">
                {creneaux.length === 0 && (
                  <button
                    type="button"
                    onClick={handleGenerateDefaultCreneaux}
                    disabled={saving}
                    className="p-1 px-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center text-xs font-bold whitespace-nowrap"
                    title="Générer les créneaux par défaut"
                  >
                    Générer par défaut
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenAddCreneau}
                  className="p-1 text-[#1E3A5F] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                  title="Ajouter un créneau"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                </button>
              </div>
            </div>
            {creneaux.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">Aucun créneau configuré</p>
            ) : (
              <ul className="text-xs space-y-2.5 text-slate-600 font-medium">
                {creneaux.map((c) => (
                  <li key={c.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#1E3A5F] block">{c.label}</span>
                      <span className="text-slate-500 text-[10px]">{c.startTime} - {c.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCreneau(c)}
                        className="p-1 rounded bg-white hover:bg-slate-100 text-[#1E3A5F] border border-slate-200 shadow-sm transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-3 w-3 text-slate-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCreneau(c.id)}
                        className="p-1 rounded bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 shadow-sm transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subjects coefficients metadata panel */}
          <SettingsEvaluations />

          {/* Sequences & Terms configuration */}
          <SettingsSequences annees={annees} />
          
          {/* Annees Scolaires metadata panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-[#1E3A5F]" />
                <h4 className="font-bold text-[#1E3A5F] text-sm font-outfit">Années Scolaires</h4>
              </div>
              <button
                type="button"
                onClick={handleOpenAddAnnee}
                className="p-1 text-[#1E3A5F] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                title="Ajouter une année"
              >
                <Plus className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              </button>
            </div>
            {annees.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">Aucune année configurée</p>
            ) : (
              <ul className="text-xs space-y-2.5 text-slate-600 font-medium">
                {annees.map((a) => (
                  <li key={a.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#1E3A5F] block">{a.label}</span>
                      {a.active && <span className="text-[9px] text-emerald-600 font-bold uppercase">Actif</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => handleOpenEditAnnee(a)} className="p-1 rounded bg-white hover:bg-slate-100 text-[#1E3A5F] border border-slate-200 shadow-sm transition-colors"><Edit2 className="h-3 w-3 text-slate-500" /></button>
                      <button type="button" onClick={() => handleDeleteAnnee(a.id)} className="p-1 rounded bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 shadow-sm transition-colors"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>


          {/* Pricing & Billing Plan Info Panel */}
          <div className="bg-[#1E3A5F] text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-amber-400 text-slate-900 text-[9px] font-black rounded-bl-xl uppercase tracking-wider">
              {studentCount <= 300 ? 'Essentiel' : studentCount <= 800 ? 'Pro' : studentCount <= 2000 ? 'Premium' : 'Entreprise'}
            </div>
            
            <div className="border-b border-white/20 pb-3">
              <h4 className="font-bold text-sm font-outfit text-[#F5A623]">{t('billing.title') || "Abonnement & Licence"}</h4>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">EduTrack SaaS Commercial Plan</p>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Active Students:</span>
                <span className="font-bold">{studentCount} Students</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Monthly License:</span>
                <span className="font-black text-[#F5A623]">
                  {studentCount <= 300 ? '25 000 FCFA / mois' : studentCount <= 800 ? '54 000 FCFA / mois' : studentCount <= 2000 ? '99 000 FCFA / mois' : 'Sur Devis'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[10px] text-slate-300 leading-relaxed space-y-1">
              <p className="font-bold text-white uppercase text-[8px] tracking-wider text-[#F5A623]">Pricing Matrix / Grille de Prix :</p>
              <ul className="space-y-1 mt-1 opacity-90">
                <li className="flex justify-between"><span>Essentiel (0-300)</span><span className="text-white font-bold">25 000 FCFA / mo</span></li>
                <li className="flex justify-between"><span>Pro (301-800)</span><span className="text-white font-bold">54 000 FCFA / mo</span></li>
                <li className="flex justify-between"><span>Premium (801-2000)</span><span className="text-white font-bold">99 000 FCFA / mo</span></li>
                <li className="flex justify-between"><span>Entreprise (&gt;2000)</span><span className="text-white font-bold">Sur Devis</span></li>
              </ul>
            </div>
            
            {studentCount > 2000 && (
              <button className="w-full mt-2 py-1.5 bg-[#F5A623] hover:bg-amber-500 text-slate-900 rounded-xl text-[10px] font-black tracking-wide uppercase transition-colors">
                Contact EduTrack Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Creneau Modal */}
      {creneauModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">
                  {selectedCreneau ? 'Modifier le Créneau' : 'Ajouter un Créneau'}
                </h3>
              </div>
              <button onClick={() => setCreneauModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveCreneau} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Libellé (ex: M1, PAUSE, A1)</label>
                <input
                  type="text"
                  required
                  value={cLabel}
                  onChange={(e) => setCLabel(e.target.value)}
                  placeholder="ex: M1 ou PAUSE"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Heure de Début</label>
                  <input
                    type="text"
                    required
                    value={cStartTime}
                    onChange={(e) => setCStartTime(e.target.value)}
                    placeholder="ex: 08:00"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Heure de Fin</label>
                  <input
                    type="text"
                    required
                    value={cEndTime}
                    onChange={(e) => setCEndTime(e.target.value)}
                    placeholder="ex: 10:00"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ordre d'affichage</label>
                <input
                  type="number"
                  required
                  value={cOrder}
                  onChange={(e) => setCOrder(e.target.value)}
                  placeholder="ex: 1"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreneauModalOpen(false)}
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
      {/* Annee Modal */}
      {anneeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit font-black">
                  {selectedAnnee ? 'Modifier Année' : 'Ajouter Année'}
                </h3>
              </div>
              <button onClick={() => setAnneeModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Année Scolaire</label>
                <input
                  type="text"
                  required
                  value={aLabel}
                  onChange={(e) => setALabel(e.target.value)}
                  placeholder="ex: 2025-2026"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeAnnee"
                  checked={aActive}
                  onChange={(e) => setAActive(e.target.checked)}
                  className="w-4 h-4 text-[#1E3A5F] border-slate-300 rounded focus:ring-[#1E3A5F]"
                />
                <label htmlFor="activeAnnee" className="text-sm font-semibold text-slate-700">
                  Définir comme année en cours
                </label>
              </div>
              <p className="text-xs text-slate-500 italic">Attention: Activer cette année désactivera automatiquement l'année précédente.</p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAnneeModalOpen(false)}
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
      
      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className={`px-6 py-4 border-b flex items-center justify-between ${importResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                {importResult.success ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
                <h3 className={`font-bold font-outfit font-black ${importResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                  {importResult.success ? 'Importation Réussie' : 'Erreur d\'Importation'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setImportResult(null);
                  if (importResult.success) window.location.reload();
                }} 
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {importResult.success ? (
                <>
                  <p className="text-slate-700 font-semibold">{importResult.data.message}</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(importResult.data.stats || {}).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <div className="text-2xl font-black text-[#1E3A5F]">{val}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide capitalize">{key}</div>
                      </div>
                    ))}
                  </div>

                  {/* Logs */}
                  {importResult.data.logs && importResult.data.logs.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-2">Détails d'exécution :</h4>
                      <div className="bg-slate-900 text-slate-300 text-xs font-mono p-3 rounded-xl overflow-x-auto max-h-48 whitespace-pre-wrap">
                        {importResult.data.logs.map((log, i) => (
                          <div key={i} className={log.includes('Erreur') ? 'text-red-400' : 'text-emerald-400'}>
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-red-600 font-semibold p-4 bg-red-50 rounded-xl border border-red-100">
                  {importResult.error}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setImportResult(null);
                  if (importResult.success) window.location.reload();
                }}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md ${
                  importResult.success ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {importResult.success ? 'Continuer' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
