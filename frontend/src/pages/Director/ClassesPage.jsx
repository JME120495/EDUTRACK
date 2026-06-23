import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { Plus, X, GraduationCap, School, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export default function ClassesPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [className, setClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [classesData, teachersData, yearsData] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/users?role=TEACHER'),
        apiFetch('/sequences/years')
      ]);

      setClasses(classesData);
      setTeachers(teachersData);
      setYears(yearsData);

      // Pre-select active year and first teacher if available
      const activeYear = yearsData.find(y => y.active) || yearsData[0];
      if (activeYear) setSelectedYearId(activeYear.id);
      if (teachersData.length > 0) setSelectedTeacherId(teachersData[0].id);
    } catch (e) {
      console.error('Failed to load class configuration:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!className || !selectedYearId) {
      alert('Class name and Academic year are required');
      return;
    }

    setSaving(true);
    try {
      const newClass = await apiFetch('/classes', {
        method: 'POST',
        body: {
          name: className,
          principalTeacherId: selectedTeacherId || null,
          anneeScolaireId: selectedYearId,
          censeurId: user.role === 'CENSEUR' ? user.id : null // Automatically assign if censeur creates
        }
      });

      // Insert class into list or refresh
      setClasses(prev => [newClass, ...prev]);
      setModalOpen(false);
      // Reset form
      setClassName('');
      if (teachers.length > 0) setSelectedTeacherId(teachers[0].id);
    } catch (err) {
      alert(err.message || 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('classes.title') || "Gestion des Classes"}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Define, register, and configure school classes and assign form teachers
          </p>
        </div>

        {user.role === 'DIRECTOR' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{t('classes.addBtn') || "Créer une classe"}</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total Classes</span>
            <span className="text-2xl font-black text-[#1E3A5F] font-outfit">{classes.length}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center">
            <School className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Form Teachers Assigned</span>
            <span className="text-2xl font-black text-amber-500 font-outfit">
              {classes.filter(c => c.principalTeacher).length}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading classes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Class Name</th>
                  <th className="px-6 py-4">Academic Year</th>
                  <th className="px-6 py-4">Form Teacher</th>
                  <th className="px-6 py-4">Demographics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                      No classes configured. Use the button above to add classes.
                    </td>
                  </tr>
                ) : (
                  classes.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-800 text-base">{c.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {c.anneeScolaire?.label || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1E3A5F]">
                        {c.principalTeacher?.name || (
                          <span className="text-slate-400 font-semibold text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold">
                            M: {c.boysCount || 0}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-100 text-[10px] font-bold">
                            F: {c.girlsCount || 0}
                          </span>
                          {(c.sickCount > 0 || c.disabledCount > 0) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold">
                              Santé: {(c.sickCount || 0) + (c.disabledCount || 0)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Create New Class</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. 6ème A, 3ème B, Terminale C"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Year</label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                >
                  {years.map(y => (
                    <option key={y.id} value={y.id}>{y.label} {y.active ? '(Active)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Form Teacher (Principal Teacher)</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-medium"
                >
                  <option value="">-- No form teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
