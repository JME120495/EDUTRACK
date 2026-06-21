import { AuthContext } from '../../context/AuthContext';
import React, { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { Coins } from 'lucide-react';

export default function TeacherPayrollPage() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || 'XAF';

  const { t, i18n } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit flex items-center gap-2">
          <Coins className="h-6 w-6 text-[#F5A623]" />
          {t('nav.teacherPayroll') || 'Ma Paie'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t('payroll.teacherSubtitle') || 'Consultez le récapitulatif de vos heures de cours et rémunérations associées'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: t('payroll.stats.totalPay') || 'Total à payer', value: `${totalPay.toLocaleString()} ${currency}`, color: 'text-emerald-600' },
          { label: t('payroll.stats.totalHours') || "Total d'heures", value: `${totalHours.toLocaleString()} h`, color: 'text-blue-600' },
          { label: t('payroll.stats.avgRate') || 'Taux horaire moyen', value: `${avgRate.toLocaleString()} ${currency}/h`, color: 'text-amber-500' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
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
                  <th className="px-6 py-4">{t('payroll.table.subject') || 'Matière'}</th>
                  <th className="px-6 py-4">{t('payroll.table.class') || 'Classe'}</th>
                  <th className="px-6 py-4">{t('payroll.table.hourlyRate') || 'Taux Horaire'}</th>
                  <th className="px-6 py-4">{t('payroll.table.hoursTaught') || 'Heures Effectuées'}</th>
                  <th className="px-6 py-4">{t('payroll.table.totalSalary') || 'Salaire Dû'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                      Aucune affectation ou cours assigné.
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
                        <td className="px-6 py-4 font-semibold text-slate-600">{subjectName}</td>
                        <td className="px-6 py-4 font-bold text-slate-500">{item.class?.name}</td>
                        <td className="px-6 py-4 font-bold text-[#1E3A5F]">{rate.toLocaleString()} </td>
                        <td className="px-6 py-4 font-bold text-slate-500">{hours} h</td>
                        <td className="px-6 py-4 font-black font-outfit text-emerald-600">{due.toLocaleString()} </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
