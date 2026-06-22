import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import MessageInbox from '../../components/MessageInbox';
import SendMessageModal from '../../components/Shared/SendMessageModal';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Calendar, 
  Wallet,
  CheckCircle,
  Clock,
  User,
  Bell,
  Send
} from 'lucide-react';

export default function StudentPortal() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'profile'
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  // Detailed Data
  const [grades, setGrades] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [payments, setPayments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [creneaux, setCreneaux] = useState([]);

  useEffect(() => {
    loadStudentProfile();
  }, []);

  async function loadStudentProfile() {
    try {
      setLoading(true);
      const studentData = await apiFetch('/eleves/me/profile');
      setStudent(studentData);
      
      if (studentData) {
        await loadRelatedData(studentData);
      }
    } catch (e) {
      console.error('Failed to load student profile:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelatedData(studentData) {
    const childId = studentData.id;
    const classId = studentData.classId || '';
    
    // Load grades
    try {
      const gradesData = await apiFetch(`/notes?eleveId=${childId}`);
      // Filter out drafts: only show validated evaluations
      const validatedGrades = gradesData.filter(g => !g.isDraft);
      setGrades(validatedGrades);
    } catch (e) {
      console.error('Failed to load grades:', e);
      setGrades([]);
    }

    // Load bulletins
    try {
      const bulletinsData = await apiFetch(`/bulletins?eleveId=${childId}`);
      setBulletins(bulletinsData);
    } catch (e) {
      console.error('Failed to load bulletins:', e);
      setBulletins([]);
    }

    // Load timetable
    try {
      if (classId) {
        const timetableData = await apiFetch(`/emplois-du-temps/classe/${classId}`);
        setTimetable(timetableData);
      }
    } catch (e) {
      console.error('Failed to load timetable:', e);
      setTimetable([]);
    }

    // Load creneaux
    try {
      const creneauxData = await apiFetch('/creneaux');
      setCreneaux(creneauxData);
    } catch (e) {
      console.error('Failed to load creneaux:', e);
      setCreneaux([]);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading student portal...</div>;
  }

  if (!student) {
    return (
      <div className="py-20 text-center text-slate-500">
        <h2 className="text-2xl font-bold text-rose-500 mb-2">Profil Introuvable</h2>
        <p>Votre compte n'est lié à aucun profil élève. Veuillez contacter l'administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SendMessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} />

      {/* Top Nav */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeView === 'dashboard'
                ? 'border-amber-400 text-[#1E3A5F] bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GraduationCap className="h-4 w-4 inline-block mr-2" />
            Mon Tableau de Bord
          </button>
          <button
            onClick={() => setActiveView('profile')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeView === 'profile'
                ? 'border-amber-400 text-[#1E3A5F] bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="h-4 w-4 inline-block mr-2" />
            Mon Profil
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setMessageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 mb-1 bg-[#1E3A5F] text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:bg-[#152943]"
          >
            <Send className="h-4 w-4" />
            Nouveau Message
          </button>
        </div>
      </div>

      {activeView === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A5288] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20 shadow-md">
                    <User className="h-8 w-8 text-white/50" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-extrabold font-outfit text-white tracking-tight">{student.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-xs font-bold text-amber-300 backdrop-blur-sm border border-white/5">
                      {student.matricule}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-xs font-bold text-sky-300 backdrop-blur-sm border border-white/5 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {student.class?.name || 'Sans Classe'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#1E3A5F]">
                  <BookOpen className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Dernières Notes</h3>
                </div>
              </div>
              <div className="space-y-3">
                {grades.length === 0 ? (
                  <div className="text-sm text-slate-400 py-4 text-center">Aucune note validée pour le moment.</div>
                ) : (
                  grades.slice(0, 5).map(g => (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{g.matiere?.name}</div>
                        <div className="text-xs text-slate-500">{g.sequence?.name}</div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-[#1E3A5F]">{g.value}</span>
                        <span className="text-xs font-bold text-slate-400">/ 20</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bulletins */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#1E3A5F]">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Bulletins</h3>
                </div>
              </div>
              <div className="space-y-3">
                {bulletins.length === 0 ? (
                  <div className="text-sm text-slate-400 py-4 text-center">Aucun bulletin disponible.</div>
                ) : (
                  bulletins.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{b.term}</div>
                          <div className="text-xs text-slate-500">Moyenne: <span className="font-bold text-indigo-600">{b.average}/20</span></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Timetable */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
              <div className="flex items-center gap-2 text-[#1E3A5F] mb-4">
                <Calendar className="h-5 w-5" />
                <h3 className="font-bold text-lg">Emploi du temps - Aujourd'hui</h3>
              </div>
              <div className="overflow-x-auto pb-2 custom-scrollbar">
                {timetable.length === 0 ? (
                  <div className="text-sm text-slate-400 py-4 text-center w-full">Aucun cours aujourd'hui.</div>
                ) : (
                  <div className="flex gap-4">
                    {timetable
                      .filter(t => t.dayOfWeek === new Date().getDay()) // only today
                      .map(session => {
                        const creneau = creneaux.find(c => c.id === session.creneauId);
                        return (
                          <div key={session.id} className="shrink-0 w-64 border border-slate-100 rounded-xl p-4 bg-slate-50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold bg-white text-[#1E3A5F] px-2 py-1 rounded-md shadow-sm border border-slate-100 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {creneau ? `${creneau.startTime} - ${creneau.endTime}` : '??:?? - ??:??'}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-base mb-1">{session.matiere?.name}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>{session.teacher?.name || 'Prof. non assigné'}</span>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sanctions & Absences */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
              <div className="flex items-center gap-2 text-[#1E3A5F] mb-4">
                <Bell className="h-5 w-5" />
                <h3 className="font-bold text-lg">{t('portal.student.discipline')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-600">{t('portal.student.absences')} ({student.absences?.length || 0})</h4>
                  {student.absences?.slice(0, 3).map(a => (
                     <div key={a.id} className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-rose-700">{new Date(a.date).toLocaleDateString()}</span>
                          <span className="block text-rose-600/70">{a.justified ? t('portal.student.justified') : t('portal.student.unjustified')}</span>
                        </div>
                     </div>
                  ))}
                  {student.absences?.length === 0 && <span className="text-xs text-slate-400">{t('portal.student.noAbsences')}</span>}
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-600">{t('portal.student.sanctions')} ({student.sanctions?.length || 0})</h4>
                  {student.sanctions?.slice(0, 3).map(s => (
                     <div key={s.id} className="p-2 bg-orange-50 border border-orange-100 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-orange-700">{s.type}</span>
                          <span className="block text-orange-600/70">{s.motif}</span>
                        </div>
                     </div>
                  ))}
                  {student.sanctions?.length === 0 && <span className="text-xs text-slate-400">{t('portal.student.noSanctions')}</span>}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeView === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-[#1E3A5F] mb-6">Informations Personnelles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Nom Complet</label>
              <div className="mt-1 font-semibold text-slate-800">{student.name}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Matricule</label>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-200">{student.matricule}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Date de Naissance</label>
              <div className="mt-1 font-semibold text-slate-800">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Lieu de Naissance</label>
              <div className="mt-1 font-semibold text-slate-800">{student.placeOfBirth || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Sexe</label>
              <div className="mt-1 font-semibold text-slate-800">{student.gender === 'M' ? 'Masculin' : 'Féminin'}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Adresse</label>
              <div className="mt-1 font-semibold text-slate-800">{student.address || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
