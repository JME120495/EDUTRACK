import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { apiFetch } from '../../api';

export default function MigrationModal({ isOpen, onClose, classes, onMigrationSuccess }) {
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSourceClassId('');
      setTargetClassId('');
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (sourceClassId) {
      fetchStudents(sourceClassId);
    } else {
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [sourceClassId]);

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      // Fetch students for the selected class
      const data = await apiFetch('/eleves');
      let classStudents = data.filter(s => s.classId === classId && s.status === 'ACTIVE');
      
      // Attempt to fetch annual averages for "Admis" pre-selection
      try {
        // Fetch all annual bulletins to find averages
        const bulletins = await apiFetch(`/bulletins?type=ANNUAL`);
        const averagesMap = {};
        if (bulletins) {
          bulletins.forEach(b => {
            averagesMap[b.eleveId] = b.average;
          });
        }
        
        classStudents = classStudents.map(student => ({
          ...student,
          annualAverage: averagesMap[student.id] !== undefined ? averagesMap[student.id] : null
        }));
      } catch (err) {
        console.error("Could not fetch annual averages for migration", err);
      }

      setStudents(classStudents);
      setSelectedStudentIds([]);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des élèves');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllAdmis = () => {
    const admisIds = students.filter(s => s.annualAverage !== null && s.annualAverage >= 10).map(s => s.id);
    setSelectedStudentIds(admisIds);
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleToggleStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleMigrate = async () => {
    if (!targetClassId || selectedStudentIds.length === 0) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir migrer ${selectedStudentIds.length} élève(s) vers cette classe ?`)) {
      return;
    }

    setMigrating(true);
    try {
      await apiFetch('/eleves/bulk-transfer', {
        method: 'POST',
        body: {
          studentIds: selectedStudentIds,
          targetClassId: targetClassId
        }
      });
      alert('Migration effectuée avec succès !');
      onMigrationSuccess();
      onClose();
    } catch (err) {
      alert(err.message || 'Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-indigo-800 font-outfit">
              Migration de Classe (Passage)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-indigo-200 rounded-lg">
            <X className="h-5 w-5 text-indigo-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Source Class Selection */}
            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-[#1E3A5F] text-sm">1. Classe d'origine</h4>
              <select
                value={sourceClassId}
                onChange={(e) => setSourceClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] outline-none"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-slate-300" />
            </div>

            {/* Target Class Selection */}
            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-[#1E3A5F] text-sm">2. Classe de destination</h4>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] outline-none"
              >
                <option value="">Sélectionner une classe</option>
                {classes.filter(c => c.id !== sourceClassId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {sourceClassId && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h4 className="font-bold text-[#1E3A5F] text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  3. Sélection des élèves ({selectedStudentIds.length} / {students.length})
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllAdmis}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    Sélectionner tous les Admis ({'>='} 10)
                  </button>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Tout {selectedStudentIds.length === students.length ? 'désélectionner' : 'sélectionner'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4 text-slate-500 text-sm">Chargement des élèves...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm italic">Aucun élève dans cette classe.</div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 w-10"></th>
                        <th className="px-4 py-2 font-semibold">Nom de l'élève</th>
                        <th className="px-4 py-2 font-semibold">Matricule</th>
                        <th className="px-4 py-2 font-semibold">Moy. Annuelle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(student => (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedStudentIds.includes(student.id) ? 'bg-indigo-50/50' : ''}`}
                          onClick={() => handleToggleStudent(student.id)}
                        >
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => {}}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{student.matricule}</td>
                          <td className="px-4 py-2">
                            {student.annualAverage !== null ? (
                              <span className={`font-bold ${student.annualAverage >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {student.annualAverage.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Non calculée</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating || selectedStudentIds.length === 0 || !targetClassId}
            className="flex items-center gap-2 px-6 py-2 bg-[#1E3A5F] hover:bg-[#152840] text-white rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? 'Migration en cours...' : 'Valider la Migration'}
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
