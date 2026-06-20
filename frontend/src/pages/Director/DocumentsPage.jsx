import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { 
  FileText, 
  FileEdit, 
  QrCode, 
  Plus, 
  Download, 
  X, 
  CheckSquare, 
  Square,
  Printer 
} from 'lucide-react';

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(false);

  // Data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Selections
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [customContent, setCustomContent] = useState('');
  
  // Badges state
  const [selectedStudents, setSelectedStudents] = useState({});
  const [parentsList, setParentsList] = useState([]);
  const [selectedParents, setSelectedParents] = useState({});

  // Modals
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('FR');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    loadClasses();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (activeTab === 'cards') {
      loadParents();
    }
  }, [activeTab]);

  useEffect(() => {
    // Sync preloaded template body
    if (selectedTemplateId) {
      const selected = templates.find(temp => temp.id === selectedTemplateId);
      if (selected) {
        setCustomContent(selected.content);
      }
    }
  }, [selectedTemplateId]);

  async function loadClasses() {
    try {
      const data = await apiFetch('/classes');
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load classes:', e);
    }
  }

  async function loadStudents(classId) {
    try {
      const data = await apiFetch(`/eleves?classId=${classId}`);
      // The API returns { data: [...] } or direct array. Let's handle both.
      const arr = Array.isArray(data) ? data : data.data || [];
      setStudents(arr);
      
      // Reset checkboxes
      const checks = {};
      arr.forEach(s => { checks[s.id] = true; }); // Default: select all
      setSelectedStudents(checks);
      
      if (arr.length > 0) {
        setSelectedStudentId(arr[0].id);
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  async function loadTemplates() {
    try {
      const data = await apiFetch('/documents/templates');
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplateId(data[0].id);
        setCustomContent(data[0].content);
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }

  async function loadParents() {
    try {
      const data = await apiFetch('/users?role=PARENT');
      setParentsList(data);
      // Select all by default
      const checks = {};
      data.forEach(p => { checks[p.id] = true; });
      setSelectedParents(checks);
    } catch (e) {
      console.error('Failed to load parents:', e);
    }
  }

  const handleCreateOrUpdateTemplate = async (e) => {
    e.preventDefault();
    setSavingTemplate(true);
    try {
      await apiFetch('/documents/templates', {
        method: 'POST',
        body: {
          id: templateId || undefined,
          title: templateTitle,
          content: templateContent,
          language: templateLanguage
        }
      });
      alert('Template saved successfully!');
      setTemplateModalOpen(false);
      
      // Reset
      setTemplateId('');
      setTemplateTitle('');
      setTemplateContent('');
      
      loadTemplates();
    } catch (err) {
      alert(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleEditTemplate = (temp) => {
    setTemplateId(temp.id);
    setTemplateTitle(temp.title);
    setTemplateContent(temp.content);
    setTemplateLanguage(temp.language);
    setTemplateModalOpen(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await apiFetch(`/documents/templates/${id}`, { method: 'DELETE' });
      alert('Template deleted');
      loadTemplates();
    } catch (err) {
      alert(err.message || 'Failed to delete template');
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !selectedStudentId) {
      return alert('Please select a template and a student.');
    }
    setGeneratingPdf(true);
    try {
      const res = await apiFetch('/documents/generate-certificate', {
        method: 'POST',
        body: {
          templateId: selectedTemplateId,
          studentId: selectedStudentId,
          customContent
        }
      });
      if (res.url) {
        window.open(`http://localhost:5000${res.url}`, '_blank');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate certificate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateStudentCards = async () => {
    const ids = Object.keys(selectedStudents).filter(id => selectedStudents[id]);
    if (ids.length === 0) return alert('Veuillez sélectionner au moins un élève.');
    
    try {
      setGeneratingPdf(true);
      const res = await apiFetch(`/documents/cards/students/${selectedClassId}?studentIds=${ids.join(',')}`);
      if (res.url) {
        window.open(`http://localhost:5000${res.url}`, '_blank');
      }
    } catch (err) {
      alert('Erreur lors de la génération des badges élèves.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateParentCards = async () => {
    const ids = Object.keys(selectedParents).filter(id => selectedParents[id]);
    if (ids.length === 0) return alert('Veuillez sélectionner au moins un parent.');
    
    try {
      setGeneratingPdf(true);
      const res = await apiFetch(`/documents/cards/parents?parentIds=${ids.join(',')}`);
      if (res.url) {
        window.open(`http://localhost:5000${res.url}`, '_blank');
      }
    } catch (err) {
      alert('Erreur lors de la génération des badges parents.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectParent = (id) => {
    setSelectedParents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAllStudents = () => {
    const allChecked = Object.values(selectedStudents).every(v => v);
    const updated = {};
    students.forEach(s => {
      updated[s.id] = !allChecked;
    });
    setSelectedStudents(updated);
  };

  const toggleSelectAllParents = () => {
    const allChecked = Object.values(selectedParents).every(v => v);
    const updated = {};
    parentsList.forEach(p => {
      updated[p.id] = !allChecked;
    });
    setSelectedParents(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
          {t('documents.title') || 'Documents & Badges'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t('documents.subtitle') || 'Impression en masse de cartes scolaires et attestations personnalisables'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'templates', label: t('documents.tabs.templates') || 'Modèles d\'Attestations', icon: FileEdit },
          { id: 'generate', label: t('documents.tabs.generate') || 'Générer Attestation', icon: FileText },
          { id: 'cards', label: t('documents.tabs.cards') || 'Cartes & Badges', icon: QrCode }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200
              ${activeTab === tab.id 
                ? 'border-[#F5A623] text-[#1E3A5F] font-bold bg-slate-50 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 rounded-t-xl'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-200">
        
        {/* TAB 1: CERTIFICATE TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Modèles Disponibles</h3>
              <button
                onClick={() => {
                  setTemplateId('');
                  setTemplateTitle('');
                  setTemplateContent('');
                  setTemplateLanguage('FR');
                  setTemplateModalOpen(true);
                }}
                className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                {t('documents.templates.add') || 'Créer un Modèle'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {templates.length === 0 ? (
                <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 font-semibold shadow-sm">
                  Aucun modèle créé pour le moment.
                </div>
              ) : (
                templates.map(temp => (
                  <div key={temp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-[#1E3A5F] font-outfit">{temp.title}</h4>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                          {temp.language}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-4 font-medium leading-relaxed whitespace-pre-wrap">
                        {temp.content}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleEditTemplate(temp)}
                        className="text-xs font-semibold text-[#1E3A5F] hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(temp.id)}
                        className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 bg-white"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GENERATE CERTIFICATE */}
        {activeTab === 'generate' && (
          <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#1E3A5F] text-lg mb-5 font-outfit">Créer une attestation officielle</h3>
            <form onSubmit={handleGenerateCertificate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('documents.generate.selectTemplate') || 'Choisir un modèle'}
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                  >
                    <option value="">Sélectionner un modèle...</option>
                    {templates.map(temp => (
                      <option key={temp.id} value={temp.id}>{temp.title} ({temp.language})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Classe</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('documents.generate.selectStudent') || 'Choisir un élève'}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                >
                  <option value="">Sélectionner l'élève...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.matricule})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t('documents.generate.customContent') || 'Éditer le Texte Final (facultatif)'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Balises injectées : Nom, Matricule, Classe, Date du jour
                  </span>
                </div>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows="10"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none text-sm font-medium leading-relaxed"
                  placeholder="Le contenu du modèle apparaîtra ici..."
                />
              </div>

              <button
                type="submit"
                disabled={generatingPdf}
                className="w-full bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {generatingPdf ? 'Génération du PDF...' : t('documents.generate.btn') || 'Générer le PDF'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: CARDS & BADGES */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Student Badges */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#1E3A5F]">
                  <QrCode className="h-5 w-5" />
                  <h3 className="font-extrabold text-lg font-outfit">Badges Scolaires Élèves</h3>
                </div>
                <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                  Générez les cartes d'identité des élèves contenant leur nom, matricule, classe, photo et QR code individuel.
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sélectionner la classe</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Élèves de la classe</span>
                    <button
                      onClick={toggleSelectAllStudents}
                      className="text-[10px] font-bold text-[#1E3A5F] hover:underline"
                    >
                      Tout cocher / décocher
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {students.map(s => (
                      <div
                        key={s.id}
                        onClick={() => toggleSelectStudent(s.id)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {selectedStudents[s.id] ? (
                          <CheckSquare className="h-4 w-4 text-[#1E3A5F] shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-700">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateStudentCards}
                disabled={generatingPdf || students.length === 0}
                className="w-full mt-4 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                {generatingPdf ? 'Génération...' : 'Télécharger la Grille de Badges (A4)'}
              </button>
            </div>

            {/* Parent Access Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#1E3A5F]">
                  <QrCode className="h-5 w-5" />
                  <h3 className="font-extrabold text-lg font-outfit">Cartes d'Accès Parents</h3>
                </div>
                <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                  Générez les cartes d'accès de sécurité pour les parents d'élèves, affichant les élèves associés et leur QR code.
                </p>

                <div className="mt-8 border border-slate-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Parents d'élèves</span>
                    <button
                      onClick={toggleSelectAllParents}
                      className="text-[10px] font-bold text-[#1E3A5F] hover:underline"
                    >
                      Tout cocher / décocher
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {parentsList.map(p => (
                      <div
                        key={p.id}
                        onClick={() => toggleSelectParent(p.id)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {selectedParents[p.id] ? (
                          <CheckSquare className="h-4 w-4 text-[#1E3A5F] shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300 shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{p.name}</span>
                          <span className="text-[10px] text-slate-400">{p.phone || 'Pas de numéro'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateParentCards}
                disabled={generatingPdf || parentsList.length === 0}
                className="w-full mt-4 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                {generatingPdf ? 'Génération...' : 'Télécharger la Grille de Badges (A4)'}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F] font-outfit">
                {templateId ? 'Modifier le Modèle' : 'Créer un Modèle d\'Attestation'}
              </h3>
              <button onClick={() => setTemplateModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Titre du Document
                </label>
                <input
                  type="text"
                  required
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="ex: Attestation de Scolarité"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Langue</label>
                <select
                  value={templateLanguage}
                  onChange={(e) => setTemplateLanguage(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold"
                >
                  <option value="FR">FR</option>
                  <option value="EN">EN</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Corps du Texte / Content
                  </label>
                  <span className="text-[9px] text-[#F5A623] font-bold uppercase tracking-wide">
                    Variables supportées
                  </span>
                </div>
                <textarea
                  required
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows="10"
                  placeholder="Je soussigné, Directeur de l'établissement, atteste que l'élève {NOM_ELEVE}, matricule {MATRICULE}, est inscrit en classe de {CLASSE} pour l'année scolaire {ANNEE_SCOLAIRE}..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-medium leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  Insérez les balises exactes : <code className="text-[#1E3A5F] font-bold">{'{NOM_ELEVE}'}</code>, <code className="text-[#1E3A5F] font-bold">{'{MATRICULE}'}</code>, <code className="text-[#1E3A5F] font-bold">{'{CLASSE}'}</code>, <code className="text-[#1E3A5F] font-bold">{'{DATE_NAISSANCE}'}</code>, <code className="text-[#1E3A5F] font-bold">{'{ANNEE_SCOLAIRE}'}</code>, <code className="text-[#1E3A5F] font-bold">{'{DATE_JOUR}'}</code>.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {savingTemplate ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
