const fs = require('fs');

const path = 'frontend/src/pages/SettingsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state
const statePattern = /const \[cOrder, setCOrder\] = useState\(0\);/;
const anneeState = `
  // Annee Scolaire State
  const [annees, setAnnees] = useState([]);
  const [selectedAnnee, setSelectedAnnee] = useState(null);
  const [anneeModalOpen, setAnneeModalOpen] = useState(false);
  const [aLabel, setALabel] = useState('');
  const [aActive, setAActive] = useState(false);
`;
content = content.replace(statePattern, `const [cOrder, setCOrder] = useState(0);\n${anneeState}`);

// 2. Load annees
const loadPattern = /apiFetch\('\/creneaux'\)\.catch\(\(\) => \[\]\)\n\s+\]\);/;
content = content.replace(loadPattern, `apiFetch('/creneaux').catch(() => []),
        apiFetch('/annees').catch(() => [])
      ]);`);

const loadAssignPattern = /if \(creneauxData\) \{\n\s+setCreneaux\(creneauxData\);\n\s+\}/;
content = content.replace(loadAssignPattern, `if (creneauxData) {
        setCreneaux(creneauxData);
      }
      if (arguments[0] && arguments[0][3]) {
        setAnnees(arguments[0][3]);
      }`);
// Wait, arguments[0][3] is wrong. Let's just use the destructured array.
content = content.replace(/const \[schoolData, studentsData, creneauxData\] = await Promise\.all/, 'const [schoolData, studentsData, creneauxData, anneesData] = await Promise.all');
content = content.replace(/if \(creneauxData\) \{\n\s+setCreneaux\(creneauxData\);\n\s+\}/, `if (creneauxData) {
        setCreneaux(creneauxData);
      }
      if (anneesData) {
        setAnnees(anneesData);
      }`);

// 3. Handlers
const handlerPattern = /const handleDeleteCreneau = async \(id\) => \{[\s\S]*?\};/;
const anneeHandlers = `
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
        await apiFetch(\`/annees/\${selectedAnnee.id}\`, {
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
      await apiFetch(\`/annees/\${id}\`, { method: 'DELETE' });
      setAnnees(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };
`;
const match = content.match(handlerPattern);
if (match) {
  content = content.replace(handlerPattern, match[0] + '\n' + anneeHandlers);
}

// 4. Replace Coefficients with Annees
const panelPattern = /<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">\s*<div className="flex items-center gap-2 border-b border-slate-100 pb-3">\s*<BookOpen className="h-4\.5 w-4\.5 text-\[#1E3A5F\]" \/>\s*<h4 className="font-bold text-\[#1E3A5F\] text-sm font-outfit">Coefficients config<\/h4>\s*<\/div>\s*<ul className="text-xs space-y-2 text-slate-600 font-medium">[\s\S]*?<\/ul>\s*<\/div>/;
const anneePanel = `
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
`;
content = content.replace(panelPattern, anneePanel);

// 5. Add Modal for Annee Scolaire
const modalPattern = /\{\/\* Modal Créneau \*\/\}/;
const anneeModal = `
      {/* Modal Annee Scolaire */}
      {anneeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F] font-outfit text-sm">
                {selectedAnnee ? 'Modifier l\\'Année' : 'Ajouter une Année'}
              </h3>
              <button onClick={() => setAnneeModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveAnnee} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Libellé (ex: 2024-2025)</label>
                <input
                  type="text"
                  required
                  value={aLabel}
                  onChange={(e) => setALabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active-annee"
                  checked={aActive}
                  onChange={(e) => setAActive(e.target.checked)}
                  className="w-4 h-4 text-[#1E3A5F] rounded"
                />
                <label htmlFor="active-annee" className="text-sm font-semibold text-slate-700">Définir comme année en cours</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAnneeModalOpen(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Créneau */}
`;
content = content.replace(modalPattern, anneeModal);

fs.writeFileSync(path, content);
console.log('Settings patched for Annees Scolaires');
