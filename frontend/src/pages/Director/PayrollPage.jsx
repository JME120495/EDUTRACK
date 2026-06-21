import { AuthContext } from '../../context/AuthContext';
import React, { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { Coins, Edit2, X } from 'lucide-react';

export default function PayrollPage() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || 'XAF';

  const { t, i18n } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [hoursTaught, setHoursTaught] = useState('');
  const [saving, setSaving] = useState(false);

  // Stats
  const [totalPay, setTotalPay] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [avgRate, setAvgRate] = useState(0);

  useEffect(() => {
    loadPayrollData();
  }, []);

  async function loadPayrollData() {
    try {
      setLoading(true);
      const data = await apiFetch('/matieres/assignments');
      setAssignments(data);
      calculateStats(data);
    } catch (e) {
      console.error('Failed to load payroll data:', e);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(data) {
    let paySum = 0;
    let hoursSum = 0;
    let rateSum = 0;
    let count = 0;

    data.forEach(item => {
      const rate = item.hourlyRate || 0;
      const hours = item.hoursTaught || 0;
      paySum += rate * hours;
      hoursSum += hours;
      if (rate > 0) {
        rateSum += rate;
        count++;
      }
    });

    setTotalPay(paySum);
    setTotalHours(hoursSum);
    setAvgRate(count > 0 ? Math.round(rateSum / count) : 0);
  }

  const handleOpenEditModal = (assignment) => {
    setSelectedAssignment(assignment);
    setHourlyRate(assignment.hourlyRate?.toString() || '0');
    setHoursTaught(assignment.hoursTaught?.toString() || '0');
    setModalOpen(true);
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSaving(true);
    try {
      await apiFetch(`/matieres/assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        body: {
          hourlyRate: parseFloat(hourlyRate) || 0,
          hoursTaught: parseFloat(hoursTaught) || 0
        }
      });
      alert('Payroll configured successfully!');
      setModalOpen(false);
      loadPayrollData();
    } catch (e) {
      alert(e.message || 'Failed to update payroll');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
          {t('payroll.title') || 'Paie des Enseignants'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t('payroll.subtitle') || 'Gérer les taux horaires, les heures effectuées et les salaires des enseignants'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: t('payroll.stats.totalPay') || 'Total à payer', value: `${totalPay.toLocaleString()} `, color: 'text-emerald-600' },
          { label: t('payroll.stats.totalHours') || "Total d'heures", value: `${totalHours.toLocaleString()} h`, color: 'text-blue-600' },
          { label: t('payroll.stats.avgRate') || 'Taux horaire moyen', value: `${avgRate.toLocaleString()} /h`, color: 'text-amber-500' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
              {card.label}
            </span>
            <span className={`text-2xl font-black block font-outfit mt-1 ${card.color}`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading payroll data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t('payroll.table.teacher') || 'Enseignant'}</th>
                  <th className="px-6 py-4">{t('payroll.table.subject') || 'Matière'}</th>
                  <th className="px-6 py-4">{t('payroll.table.class') || 'Classe'}</th>
                  <th className="px-6 py-4">{t('payroll.table.hourlyRate') || 'Taux Horaire'}</th>
                  <th className="px-6 py-4">{t('payroll.table.hoursTaught') || 'Heures Effectuées'}</th>
                  <th className="px-6 py-4">{t('payroll.table.totalSalary') || 'Salaire Dû'}</th>
                  <th className="px-6 py-4">{t('payroll.table.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                      Aucune affectation d'enseignant trouvée.
                    </td>
                  </tr>
                ) : (
                  assignments.map(item => {
                    const rate = item.hourlyRate || 0;
                    const hours = item.hoursTaught || 0;
                    const due = rate * hours;
                    const subjectName = i18n.language === 'FR' ? item.matiere.nameFr : item.matiere.nameEn;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.teacher?.name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{subjectName}</td>
                        <td className="px-6 py-4 font-bold text-slate-500">{item.class?.name}</td>
                        <td className="px-6 py-4 font-bold text-[#1E3A5F]">{rate.toLocaleString()} </td>
                        <td className="px-6 py-4 font-bold text-slate-500">{hours} h</td>
                        <td className="px-6 py-4 font-black font-outfit text-emerald-600">{due.toLocaleString()} </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 text-[#1E3A5F] hover:bg-slate-100 rounded-xl transition-all shadow-sm border border-slate-200 bg-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {modalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">
                  {t('payroll.configure') || 'Configurer la Paie'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Enseignant
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedAssignment.teacher?.name || ''}
                  className="w-full px-3 py-2 text-sm border border-slate-100 bg-slate-50 rounded-xl text-slate-500 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Classe
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedAssignment.class?.name || ''}
                    className="w-full px-3 py-2 text-sm border border-slate-100 bg-slate-50 rounded-xl text-slate-500 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Matière
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={i18n.language === 'FR' ? selectedAssignment.matiere?.nameFr : selectedAssignment.matiere?.nameEn}
                    className="w-full px-3 py-2 text-sm border border-slate-100 bg-slate-50 rounded-xl text-slate-500 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('payroll.table.hourlyRate') || 'Taux Horaire ({currency}/h)'}
                </label>
                <input
                  type="number"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('payroll.table.hoursTaught') || 'Heures effectuées'}
                </label>
                <input
                  type="number"
                  required
                  value={hoursTaught}
                  onChange={(e) => setHoursTaught(e.target.value)}
                  placeholder="e.g. 20"
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
                  disabled={saving}
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {t('payroll.save') || 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
