import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { Calendar, Users, CheckCircle, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch teacher's timetable
        const timetableData = await apiFetch(`/emplois-du-temps/teacher/${user.userId}`);
        setTimetable(timetableData);

        // Fetch classes taught by this teacher (using the /classes endpoint which filters by teacher if logged in as teacher)
        const classesData = await apiFetch('/classes');
        setClasses(classesData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Today's schedule
  const DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
  const todayDayName = DAYS[new Date().getDay()];
  const todaysClasses = timetable.filter(s => s.dayOfWeek === todayDayName);

  const formattedDate = new Date().toLocaleDateString(
    user?.language === 'EN' ? 'en-US' : 'fr-FR', 
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold font-outfit">
            Espace Enseignant - Bienvenue, {user?.name}
          </h1>
          <p className="text-blue-200 text-sm font-medium">
            {formattedDate} | Professeur
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-slate-800 font-outfit">{classes.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classes assignées</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-slate-800 font-outfit">{todaysClasses.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cours aujourd'hui</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-[#1E3A5F] text-sm uppercase tracking-wider">Actions Rapides</h3>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => navigate('/absences')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-sm">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-rose-900 text-sm">Faire l'appel</p>
                    <p className="text-xs text-rose-600 font-medium">Marquer les absences</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/grades')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white text-emerald-500 flex items-center justify-center shadow-sm">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-emerald-900 text-sm">Saisir les Notes</p>
                    <p className="text-xs text-emerald-600 font-medium">Évaluations et devoirs</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#1E3A5F] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Mon Emploi du Temps d'Aujourd'hui ({todayDayName})
          </h3>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="p-10 text-center text-slate-400">Chargement...</div>
            ) : todaysClasses.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Clock className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-bold text-slate-500">Aucun cours prévu aujourd'hui !</p>
                <p className="text-sm">Profitez de votre journée.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todaysClasses
                  // sort by start time (assuming HH:mm format)
                  .sort((a, b) => a.creneau.startTime.localeCompare(b.creneau.startTime))
                  .map(session => (
                  <div key={session.id} className="p-4 flex items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="bg-[#1E3A5F]/10 text-[#1E3A5F] p-3 rounded-xl text-center shrink-0 w-24">
                      <p className="font-black font-outfit">{session.creneau.startTime}</p>
                      <p className="text-xs font-bold opacity-70">{session.creneau.endTime}</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-lg">{session.matiere.nameFr}</h4>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" /> Classe: {session.class.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                        Salle: {session.room || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
