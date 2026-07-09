import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { Save, Calendar, Check, AlertCircle, Clock, UserX } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export default function AbsencesPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  
  const canManageTeachers = ['DIRECTOR', 'CENSEUR', 'SURVEILLANT'].includes(user.role);
  
  const [activeTab, setActiveTab] = useState('STUDENTS'); // STUDENTS or TEACHERS

  const [classes, setClasses] = useState([]);
  const [sequences, setSequences] = useState([]);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSequenceId, setSelectedSequenceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance State (Students)
  const [students, setStudents] = useState([]);
  const [absencesState, setAbsencesState] = useState({}); // studentId -> { isAbsent: bool, isLateness: bool, hours: number, reason: string }
  const [teacherHoursForClass, setTeacherHoursForClass] = useState(2);
  
  // Attendance State (Teachers)
  const [teachers, setTeachers] = useState([]);
  const [teacherAbsencesState, setTeacherAbsencesState] = useState({}); // teacherId -> { isAbsent: bool, hours: number, reason: string }
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadFilters();
    if (canManageTeachers) {
      loadTeachers();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'STUDENTS' && selectedClassId && selectedSequenceId && selectedDate) {
      loadAttendance(selectedClassId, selectedSequenceId, selectedDate);
    } else if (activeTab === 'TEACHERS' && selectedDate && canManageTeachers) {
      loadTeacherAttendance(selectedDate);
    }
  }, [activeTab, selectedClassId, selectedSequenceId, selectedDate]);

  async function loadFilters() {
    try {
      const [classesData, sequencesData] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/sequences')
      ]);
      setClasses(classesData);
      setSequences(sequencesData);

      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
      if (sequencesData.length > 0) setSelectedSequenceId(sequencesData.find(s => s.active)?.id || sequencesData[0].id);
    } catch (e) {
      console.error('Failed to load filters:', e);
    }
  }

  async function loadTeachers() {
    try {
      const data = await apiFetch('/users?role=TEACHER');
      setTeachers(data);
    } catch (e) {
      console.error('Failed to load teachers:', e);
    }
  }

  async function loadAttendance(classId, sequenceId, dateString) {
    try {
      setLoading(true);
      setSuccessMsg('');
      
      const rawStudents = await apiFetch(`/eleves?classId=${classId}`);
      const studentsData = rawStudents.data || rawStudents;
      setStudents(studentsData);
      const absencesData = await apiFetch(`/absences/classe/${classId}/date/${dateString}?sequenceId=${sequenceId}`);
      
      let currentTeacherHours = 2;
      if (user.role === 'TEACHER') {
        try {
          const timetable = await apiFetch(`/timetable/teacher/${user.id}`);
          const dateObj = new Date(dateString);
          const days = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
          const dayOfWeek = days[dateObj.getDay()];
          const slots = timetable.filter(t => t.classId === classId && t.dayOfWeek === dayOfWeek);
          if (slots.length > 0) {
            let total = 0;
            slots.forEach(slot => {
               if (slot.creneau && slot.creneau.startTime && slot.creneau.endTime) {
                  const start = parseInt(slot.creneau.startTime.split(':')[0]);
                  const end = parseInt(slot.creneau.endTime.split(':')[0]);
                  total += Math.max(1, end - start);
               }
            });
            if (total > 0) currentTeacherHours = total;
          }
        } catch (e) { console.error('Failed to calculate teacher hours from timetable', e); }
      }
      setTeacherHoursForClass(currentTeacherHours);

      const initialAbsences = {};
      studentsData.forEach(student => {
        const found = absencesData.find(a => a.eleveId === student.id);
        initialAbsences[student.id] = {
          isAbsent: !!found,
          isLateness: found ? (found.isLateness || false) : false,
          hours: found ? found.hours : currentTeacherHours,
          reason: found ? (found.reason || '') : ''
        };
      });
      setAbsencesState(initialAbsences);
    } catch (e) {
      console.error('Failed to load attendance registry:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeacherAttendance(dateString) {
    try {
      setLoading(true);
      setSuccessMsg('');
      
      const absencesData = await apiFetch(`/absences/teachers?dateString=${dateString}`);
      
      const initialAbsences = {};
      teachers.forEach(teacher => {
        const found = absencesData.find(a => a.teacherId === teacher.id);
        initialAbsences[teacher.id] = {
          isAbsent: !!found,
          hours: found ? found.hours : 2,
          reason: found ? (found.reason || '') : ''
        };
      });
      setTeacherAbsencesState(initialAbsences);
    } catch (e) {
      console.error('Failed to load teacher attendance registry:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (studentId, status) => {
    setAbsencesState(prev => {
      const current = prev[studentId] || { isAbsent: false, isLateness: false, hours: teacherHoursForClass, reason: '' };
      if (status === 'PRESENT') {
        return { ...prev, [studentId]: { ...current, isAbsent: false, isLateness: false } };
      } else if (status === 'RETARD') {
        return { ...prev, [studentId]: { ...current, isAbsent: true, isLateness: true, hours: 0 } };
      } else {
        return { ...prev, [studentId]: { ...current, isAbsent: true, isLateness: false, hours: teacherHoursForClass } };
      }
    });
  };

  const handleHoursChange = (studentId, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setAbsencesState(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { isAbsent: true, reason: '' }), hours: num }
    }));
  };

  const handleReasonChange = (studentId, val) => {
    setAbsencesState(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { isAbsent: true, hours: teacherHoursForClass }), reason: val }
    }));
  };

  const handleSaveRollCall = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const payloadAbsences = Object.keys(absencesState)
        .filter(studentId => absencesState[studentId].isAbsent)
        .map(studentId => ({
          eleveId: studentId,
          hours: absencesState[studentId].hours,
          reason: absencesState[studentId].reason,
          isLateness: absencesState[studentId].isLateness
        }));

      await apiFetch('/absences/bulk', {
        method: 'POST',
        body: {
          classId: selectedClassId,
          sequenceId: selectedSequenceId,
          date: selectedDate,
          absences: payloadAbsences
        }
      });

      setSuccessMsg(t('absences.saveSuccess') || 'Roll call successfully saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadAttendance(selectedClassId, selectedSequenceId, selectedDate);
    } catch (e) {
      alert(e.message || 'Failed to save attendance registry');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTeacherAbsent = (teacherId) => {
    setTeacherAbsencesState(prev => {
      const current = prev[teacherId] || { isAbsent: false, hours: 2, reason: '' };
      return { ...prev, [teacherId]: { ...current, isAbsent: !current.isAbsent } };
    });
  };

  const handleTeacherHoursChange = (teacherId, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setTeacherAbsencesState(prev => ({
      ...prev,
      [teacherId]: { ...(prev[teacherId] || { isAbsent: true, reason: '' }), hours: num }
    }));
  };

  const handleTeacherReasonChange = (teacherId, val) => {
    setTeacherAbsencesState(prev => ({
      ...prev,
      [teacherId]: { ...(prev[teacherId] || { isAbsent: true, hours: 2 }), reason: val }
    }));
  };

  const handleSaveTeacherRollCall = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const payloadAbsences = Object.keys(teacherAbsencesState)
        .filter(teacherId => teacherAbsencesState[teacherId].isAbsent)
        .map(teacherId => ({
          teacherId,
          hours: teacherAbsencesState[teacherId].hours,
          reason: teacherAbsencesState[teacherId].reason
        }));

      await apiFetch('/absences/teachers/bulk', {
        method: 'POST',
        body: {
          date: selectedDate,
          absences: payloadAbsences
        }
      });

      setSuccessMsg('Appel des enseignants sauvegardé avec succès !');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadTeacherAttendance(selectedDate);
    } catch (e) {
      alert(e.message || 'Failed to save teacher attendance registry');
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const totalStudents = students.length;
  const absentCount = Object.keys(absencesState).filter(id => absencesState[id]?.isAbsent).length;
  const presentCount = totalStudents - absentCount;

  const totalTeachers = teachers.length;
  const absentTeacherCount = Object.keys(teacherAbsencesState).filter(id => teacherAbsencesState[id]?.isAbsent).length;
  const presentTeacherCount = totalTeachers - absentTeacherCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
          {t('absences.title') || "Registre des Absences & Appel"}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          Prenez l'appel, marquez les absences et justifiez-les
        </p>
      </div>

      {canManageTeachers && (
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'STUDENTS' 
                ? 'border-[#F5A623] text-[#1E3A5F]' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Absences Élèves
          </button>
          <button
            onClick={() => setActiveTab('TEACHERS')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'TEACHERS' 
                ? 'border-[#F5A623] text-[#1E3A5F]' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Absences Enseignants
          </button>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTab === 'STUDENTS' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Classe</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Séquence</label>
              <select
                value={selectedSequenceId}
                onChange={(e) => setSelectedSequenceId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all"
              >
                {sequences.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.active ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className={activeTab === 'TEACHERS' ? "md:col-span-3" : ""}>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-[#1E3A5F] font-outfit mt-0.5">{activeTab === 'STUDENTS' ? totalStudents : totalTeachers}</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Présent(s)</p>
          <p className="text-2xl font-black text-emerald-700 font-outfit mt-0.5">{activeTab === 'STUDENTS' ? presentCount : presentTeacherCount}</p>
        </div>
        <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 text-center animate-in fade-in duration-300">
          <p className="text-rose-600 text-[10px] font-bold uppercase tracking-wider">Absent(s)</p>
          <p className="text-2xl font-black text-rose-700 font-outfit mt-0.5">{activeTab === 'STUDENTS' ? absentCount : absentTeacherCount}</p>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <Check className="h-4.5 w-4.5 text-emerald-600" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Chargement...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{activeTab === 'STUDENTS' ? 'Élève' : 'Enseignant'}</th>
                    <th className="px-6 py-4">{activeTab === 'STUDENTS' ? 'Matricule' : 'Contact'}</th>
                    <th className="px-6 py-4 text-center w-32">Statut</th>
                    <th className="px-6 py-4 w-32">Heures d'absence</th>
                    <th className="px-6 py-4">Motif / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTab === 'STUDENTS' ? (
                    students.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                          Aucun élève dans cette classe.
                        </td>
                      </tr>
                    ) : (
                      students.map(student => {
                        const state = absencesState[student.id] || { isAbsent: false, hours: 2, reason: '' };
                        return (
                          <tr 
                            key={student.id} 
                            className={`transition-colors duration-150 ${
                              state.isAbsent ? 'bg-rose-50/20 hover:bg-rose-50/30' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                              {state.isAbsent && <UserX className="h-4 w-4 text-rose-500 shrink-0" />}
                              <span>{student.name}</span>
                            </td>
                            <td className="px-6 py-4 font-mono font-semibold text-slate-500 text-xs">
                              {student.matricule}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <select
                                value={state.isAbsent ? (state.isLateness ? 'RETARD' : 'ABSENT') : 'PRESENT'}
                                onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                className={`px-2 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 outline-none ${
                                  state.isAbsent 
                                    ? (state.isLateness ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-rose-100 text-rose-700 border border-rose-300')
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                                }`}
                              >
                                <option value="PRESENT">Présent</option>
                                <option value="RETARD">Retard</option>
                                <option value="ABSENT">Absent</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                min="1"
                                max="8"
                                disabled={!state.isAbsent || user.role === 'TEACHER'}
                                value={state.isAbsent ? state.hours : ''}
                                onChange={(e) => handleHoursChange(student.id, e.target.value)}
                                placeholder="-"
                                className="w-20 px-2.5 py-1 text-center font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 transition-all"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                disabled={!state.isAbsent || user.role === 'TEACHER'}
                                value={state.isAbsent ? state.reason : ''}
                                onChange={(e) => handleReasonChange(student.id, e.target.value)}
                                placeholder={state.isAbsent ? "ex: Maladie" : "Non absent"}
                                className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none disabled:bg-slate-55 disabled:text-slate-450 disabled:border-slate-100 transition-all"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : (
                    teachers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                          Aucun enseignant trouvé.
                        </td>
                      </tr>
                    ) : (
                      teachers.map(teacher => {
                        const state = teacherAbsencesState[teacher.id] || { isAbsent: false, hours: 2, reason: '' };
                        return (
                          <tr 
                            key={teacher.id} 
                            className={`transition-colors duration-150 ${
                              state.isAbsent ? 'bg-rose-50/20 hover:bg-rose-50/30' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                              {state.isAbsent && <UserX className="h-4 w-4 text-rose-500 shrink-0" />}
                              <span>{teacher.name}</span>
                            </td>
                            <td className="px-6 py-4 font-mono font-semibold text-slate-500 text-xs">
                              {teacher.phone || '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleTeacherAbsent(teacher.id)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                                  state.isAbsent 
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-100'
                                }`}
                              >
                                {state.isAbsent ? 'Absent' : 'Présent'}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                disabled={!state.isAbsent}
                                value={state.isAbsent ? state.hours : ''}
                                onChange={(e) => handleTeacherHoursChange(teacher.id, e.target.value)}
                                placeholder="-"
                                className="w-20 px-2.5 py-1 text-center font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 transition-all"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                disabled={!state.isAbsent}
                                value={state.isAbsent ? state.reason : ''}
                                onChange={(e) => handleTeacherReasonChange(teacher.id, e.target.value)}
                                placeholder={state.isAbsent ? "ex: Maladie, Retard" : "Non absent"}
                                className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none disabled:bg-slate-55 disabled:text-slate-450 disabled:border-slate-100 transition-all"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Save Button Bar */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={activeTab === 'STUDENTS' ? handleSaveRollCall : handleSaveTeacherRollCall}
                disabled={saving || (activeTab === 'STUDENTS' ? students.length === 0 : teachers.length === 0)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{t('absences.saveBtn') || "Sauvegarder l'Appel"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
