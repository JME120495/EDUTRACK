import React, { useContext, useEffect, useState } from 'react';
import { useTranslation as useI18n } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import SendMessageModal from '../../components/Shared/SendMessageModal';
import { 
  Users, 
  GraduationCap, 
  Percent, 
  Coins, 
  AlertTriangle, 
  Send, 
  ArrowRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DirectorDashboard() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || 'XAF';
  const { t } = useI18n();
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    collectionRate: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const data = await apiFetch('/stats/dashboard');
        
        setStats(data.stats);
        setChartData(data.chartData);
        setAlerts(data.alerts);
        setAcademicYears(data.academicYears || []);
        setActiveYear(data.activeYear || null);

      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleChangeAcademicYear = async (e) => {
    const selectedYearId = e.target.value;
    if (!selectedYearId) return;
    
    const confirmChange = window.confirm("Attention : Le changement de l'année scolaire active modifiera l'affichage des données pour tout l'établissement. Voulez-vous continuer ?");
    if (!confirmChange) return;

    try {
      setLoading(true);
      await apiFetch(`/sequences/years/${selectedYearId}/activate`, { method: 'POST' });
      // Reload page to ensure all contexts get the new year (or just reload dashboard data)
      window.location.reload();
    } catch (err) {
      alert("Erreur lors du changement de l'année scolaire: " + err.message);
      setLoading(false);
    }
  };

  const sendSmsReminder = async (alertId, phone, name) => {
    setSendingReminder(alertId);
    try {
      const result = await apiFetch('/paiements/send-reminder', {
        method: 'POST',
        body: { phone, message: `EduTrack: Cher parent, la scolarité de ${name} est impayée. Merci de régulariser rapidement.` }
      });
      // V-019 FIX: Indicate internal messaging
      if (result.internalMessageSent) {
        alert(`Relance effectuée ! Une notification interne a été envoyée sur le portail Parent de ${name}.`);
      } else {
        alert(`Relance effectuée (Notification interne non envoyée car aucun compte parent n'est lié à ce numéro).`);
      }
    } catch (err) {
      alert('Erreur lors de la relance: ' + err.message);
    } finally {
      setSendingReminder(null);
    }
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <SendMessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} />

      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-[#1E3A5F] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold font-outfit">
            {t('dashboard.welcome')} {user?.name || ''}
          </h1>
          <p className="text-slate-300 text-sm font-medium">
            {formattedDate} | {user?.schoolName || 'Mon Établissement'}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs font-semibold bg-white/10 border border-white/20 px-3 py-1.5 rounded-full shrink-0">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <span>Active Academic Year: </span>
          <select 
            className="bg-transparent text-white font-bold outline-none cursor-pointer border-none appearance-none pr-4"
            value={activeYear?.id || ''}
            onChange={handleChangeAcademicYear}
          >
            {academicYears.map(year => (
              <option key={year.id} value={year.id} className="text-slate-800">
                {year.label} {year.active ? '(Actuelle)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => setMessageModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shrink-0 backdrop-blur-md"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Envoyer un message</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: t('dashboard.stats.students'), value: stats.studentsCount, icon: Users, color: 'from-blue-500 to-indigo-600' },
          { label: t('dashboard.stats.teachers'), value: stats.teachersCount, icon: GraduationCap, color: 'from-purple-500 to-indigo-700' },
          { label: t('dashboard.stats.paymentRate'), value: `${stats.collectionRate}%`, icon: Percent, color: 'from-emerald-500 to-teal-600' },
          { label: t('dashboard.stats.totalRevenue'), value: `${stats.totalRevenue.toLocaleString()} ${currency}`, icon: Coins, color: 'from-amber-500 to-orange-600' }
        ].map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300"
          >
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-2xl font-black text-[#1E3A5F] block font-outfit">
                {card.value}
              </span>
            </div>
            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid of Chart and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Averages Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#1E3A5F] font-outfit">
            Academic Performance (Class Averages)
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontWeight={600} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} fontWeight={600} domain={[0, 20]} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avg" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Average Grade / 20" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <h3 className="text-base font-bold text-[#1E3A5F] font-outfit">
              {t('dashboard.alerts.title')}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[280px] pr-1">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">
                {t('dashboard.alerts.none')}
              </p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-between text-xs hover:border-amber-300 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">{alert.name}</p>
                    <p className="text-slate-500 font-medium">{alert.class} | Due: {alert.amountDue.toLocaleString()} </p>
                  </div>
                  <button
                    onClick={() => sendSmsReminder(alert.id, alert.parentPhone, alert.name)}
                    disabled={sendingReminder === alert.id}
                    className="p-2 bg-[#1E3A5F] text-amber-400 hover:bg-[#152943] rounded-lg transition-colors flex items-center justify-center"
                    title={t('dashboard.alerts.sendReminder')}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
