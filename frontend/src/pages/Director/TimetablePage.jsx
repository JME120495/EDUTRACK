import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { Calendar, Plus, Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

export default function TimetablePage() {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const isDirector = user?.role === 'DIRECTOR';
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [creneaux, setCreneaux] = useState([]);
  const [timetable, setTimetable] = useState([]);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedCreneauId, setSelectedCreneauId] = useState('');
  
  // Form options
  const [teachers, setTeachers] = useState([]);
  const [matieres, setMatieres] = useState([]);
  
  // Form input values
  const [teacherId, setTeacherId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadTimetable(selectedClassId);
    }
  }, [selectedClassId]);

  async function loadInitialData() {
    try {
      const [classesData, creneauxData, teachersData, matieresData] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/creneaux'),
        apiFetch('/users?role=TEACHER'),
        apiFetch('/matieres')
      ]);
      setClasses(classesData);
      setCreneaux(creneauxData);
      setTeachers(teachersData);
      setMatieres(matieresData);

      if (classesData.length > 0) {
        setSelectedClassId(classesData[0].id);
      }
      if (teachersData.length > 0) setTeacherId(teachersData[0].id);
      if (matieresData.length > 0) setMatiereId(matieresData[0].id);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  }

  async function loadTimetable(classId) {
    try {
      const data = await apiFetch(`/emplois-du-temps/classe/${classId}`);
      setTimetable(data);
    } catch (e) {
      console.error('Failed to load timetable:', e);
    }
  }

  const handleOpenAddModal = (day, creneauId) => {
    setSelectedDay(day);
    setSelectedCreneauId(creneauId);
    setError('');
    setRoom('');
    setModalOpen(true);
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const newSession = await apiFetch('/emplois-du-temps', {
        method: 'POST',
        body: {
          classId: selectedClassId,
          teacherId,
          matiereId,
          creneauId: selectedCreneauId,
          dayOfWeek: selectedDay,
          room
        }
      });
      setTimetable([...timetable, newSession]);
      setModalOpen(false);
    } catch (err) {
      const msg = err.data?.messageFr || err.data?.messageEn || err.message || 'Conflit détecté !';
      setError(msg);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Delete this class session?')) return;
    try {
      await apiFetch(`/emplois-du-temps/${id}`, { method: 'DELETE' });
      setTimetable(timetable.filter(s => s.id !== id));
    } catch (e) {
      alert(e.message || 'Failed to delete session');
    }
  };

  const handleAutoGenerate = async () => {
    const confirmMsg = i18n.language === 'FR' 
      ? "Êtes-vous sûr de vouloir générer automatiquement l'emploi du temps pour TOUTES les classes ? Cela écrasera les emplois du temps existants." 
      : "Are you sure you want to automatically generate the timetable for ALL classes? This will overwrite the existing timetables.";
      
    if (!window.confirm(confirmMsg)) return;

    setGenerating(true);
    try {
      const result = await apiFetch('/timetable/generate', { method: 'POST' });
      alert(i18n.language === 'FR' ? result.messageFr : result.messageEn);
      if (selectedClassId) {
        loadTimetable(selectedClassId);
      }
    } catch (e) {
      const errorMsg = e.data?.messageFr || e.data?.messageEn || e.message || "Failed to generate timetable";
      alert(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  // Find session for a cell
  const getCellSession = (day, creneauId) => {
    return timetable.find(s => s.dayOfWeek === day && s.creneauId === creneauId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('timetable.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Define daily class schedules and manage resource conflicts
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          {isDirector && (
            <button
              onClick={handleAutoGenerate}
              disabled={generating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{i18n.language === 'FR' ? 'Générer Auto' : 'Auto-Generate'}</span>
            </button>
          )}

          {/* Class Selector */}
          <div className="w-full sm:w-48">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none focus:border-transparent font-bold transition-all shadow-sm text-[#1E3A5F]"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden divide-x divide-slate-200 bg-slate-50">
            {/* Header Cell */}
            <div className="p-3 text-center text-xs font-bold text-slate-500 bg-slate-50 uppercase flex items-center justify-center">
              Heures / Day
            </div>
            
            {/* Days header */}
            {DAYS.map(day => (
              <div key={day} className="p-3 text-center text-xs font-bold text-[#1E3A5F] bg-slate-100 uppercase tracking-wider">
                {t(`timetable.days.${day}`)}
              </div>
            ))}

            {/* Time Slot Rows */}
            {creneaux.map((slot) => (
              <React.Fragment key={slot.id}>
                {/* Time slot column */}
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-col justify-center items-center text-center">
                  <span className="font-bold text-[#1E3A5F] font-outfit text-sm">{slot.startTime} - {slot.endTime}</span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">{slot.label}</span>
                </div>

                {/* Days cells */}
                {DAYS.map(day => {
                  const session = getCellSession(day, slot.id);
                  const isPause = slot.label === 'PAUSE';

                  return (
                    <div 
                      key={day} 
                      className={`p-2 border-t border-slate-200 min-h-[100px] flex flex-col justify-between group transition-all relative ${
                        isPause ? 'bg-slate-100/70 border-dashed pattern-dots' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {isPause ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 font-black text-xs uppercase tracking-widest select-none">
                          RECESS
                        </div>
                      ) : session ? (
                        <div className="flex-1 flex flex-col justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs shadow-sm text-blue-900">
                          <div className="space-y-1">
                            <p className="font-black text-[#1E3A5F]">
                              {session.matiere?.nameFr} ({session.matiere?.code})
                            </p>
                            <p className="text-slate-600 font-semibold">{session.teacher?.name || 'Prof. non assigné'}</p>
                            {session.room && (
                              <p className="text-[10px] text-slate-500 font-bold">Room: {session.room}</p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="absolute right-2.5 top-2.5 p-1 rounded-lg text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAddModal(day, slot.id)}
                          className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-350 hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-slate-600 py-6"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Add Session Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Add Timetable Slot</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddSession} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Day</label>
                  <input
                    type="text"
                    disabled
                    value={selectedDay}
                    className="w-full px-3 py-2 text-sm border border-slate-100 bg-slate-100 rounded-xl text-slate-600 font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time Slot</label>
                  <input
                    type="text"
                    disabled
                    value={creneaux.find(s => s.id === selectedCreneauId)?.label || ''}
                    className="w-full px-3 py-2 text-sm border border-slate-100 bg-slate-100 rounded-xl text-slate-600 font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <select
                  value={matiereId}
                  onChange={(e) => setMatiereId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                >
                  {matieres.map(m => (
                    <option key={m.id} value={m.id}>{m.nameFr} ({m.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Teacher</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Classroom / Room</label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Salle 3A, Labo"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
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
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
