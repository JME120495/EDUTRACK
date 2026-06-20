import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import SendMessageModal from '../../components/Shared/SendMessageModal';
import { Users, School, Calendar, BookOpen, AlertCircle, Clock, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CenseurDashboard() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    studentsCount: 0,
    classesCount: 0,
    teachersCount: 0,
    absencesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const classes = await apiFetch('/classes');
        const teachers = await apiFetch('/users?role=TEACHER');
        setStats({
          studentsCount: classes.reduce((sum, c) => sum + (c.eleves ? c.eleves.length : 0), 0) || 120, // fallback if API doesn't return count
          classesCount: classes.length,
          teachersCount: teachers.length,
          absencesCount: 15 // Mock for now
        });
      } catch (err) {
        console.error('Failed to load Censeur dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formattedDate = new Date().toLocaleDateString(
    user?.language === 'EN' ? 'en-US' : 'fr-FR', 
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="space-y-6">
      <SendMessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} />

      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-800 to-purple-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold font-outfit">
            Espace Pédagogie - Bienvenue, {user?.name}
          </h1>
          <p className="text-indigo-200 text-sm font-medium">
            {formattedDate} | Censeur
          </p>
        </div>
        
        <button
          onClick={() => setMessageModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shrink-0 backdrop-blur-md"
        >
          <Send className="h-4 w-4" />
          <span>Contacter les Parents</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Élèves', value: stats.studentsCount, icon: Users, color: 'from-blue-500 to-indigo-600' },
          { label: 'Classes', value: stats.classesCount, icon: School, color: 'from-purple-500 to-indigo-700' },
          { label: 'Enseignants', value: stats.teachersCount, icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
          { label: 'Absences (Semaine)', value: stats.absencesCount, icon: Clock, color: 'from-amber-500 to-orange-600' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-semibold uppercase">{card.label}</span>
              <p className="text-2xl font-black text-slate-800 font-outfit">{card.value}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-lg`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-[#1E3A5F] text-lg mb-6">Moyennes Globales par Classe (Démonstration)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{name: '6ème A', moyenne: 14}, {name: '5ème B', moyenne: 12.5}, {name: '4ème A', moyenne: 15}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} domain={[0, 20]} />
              <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="moyenne" fill="#1E3A5F" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
