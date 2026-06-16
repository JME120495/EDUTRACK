import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { CreditCard, Plus, Send, X, ShieldAlert, CheckCircle } from 'lucide-react';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Stats
  const [classTuition, setClassTuition] = useState(150000);
  const [totalExpected, setTotalExpected] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [collectionRate, setCollectionRate] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY');
  const [payerPhone, setPayerPhone] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [broadcastingReminders, setBroadcastingReminders] = useState(false);
  const [broadcastingAnnouncement, setBroadcastingAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadPaymentsData(selectedClassId);
    }
  }, [selectedClassId]);

  async function loadClasses() {
    try {
      const data = await apiFetch('/classes');
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load classes:', e);
    }
  }

  async function loadPaymentsData(classId) {
    try {
      setLoading(true);
      const [studentsData, paymentsData, feeData] = await Promise.all([
        apiFetch(`/eleves?classId=${classId}`),
        apiFetch(`/paiements?classId=${classId}`),
        apiFetch(`/paiements/classe/${classId}`)
      ]);

      const baseTuition = feeData ? feeData.totalAmount : 150000;
      setClassTuition(baseTuition);

      // Match payments to students
      let collected = 0;
      const studentsPayments = studentsData.map(student => {
        const studentPayments = paymentsData.filter(p => p.eleveId === student.id && p.status === 'COMPLETED');
        const paid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
        collected += paid;
        const balance = baseTuition - paid;

        let status = 'UNPAID';
        if (paid >= baseTuition) status = 'PAID';
        else if (paid > 0) status = 'PARTIAL';

        return {
          ...student,
          paid,
          balance,
          status
        };
      });

      setStudents(studentsPayments);
      setTotalExpected(studentsData.length * baseTuition);
      setTotalCollected(collected);
      setCollectionRate(studentsData.length > 0 ? Math.round((collected / (studentsData.length * baseTuition)) * 100) : 0);

      if (studentsData.length > 0) {
        setSelectedStudentId(studentsData[0].id);
      }
    } catch (e) {
      console.error('Failed to load payments data:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/paiements', {
        method: 'POST',
        body: {
          eleveId: selectedStudentId,
          amount: parseFloat(amount),
          paymentMethod,
          payerPhone,
          transactionReference,
          remarks
        }
      });
      alert('Payment recorded successfully!');
      setModalOpen(false);
      // Reset form
      setAmount('');
      setTransactionReference('');
      setPayerPhone('');
      setRemarks('');
      loadPaymentsData(selectedClassId);
    } catch (e) {
      alert(e.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleSendUnpaidAlerts = async () => {
    setSendingAlerts(true);
    try {
      const unpaidStudents = students.filter(s => s.status !== 'PAID');
      
      // Request SMS reminders for all debtors
      await Promise.all(
        unpaidStudents.map(student => {
          const parentPhone = student.parents?.[0]?.parent?.phone || '+237670000003';
          return apiFetch('/paiements/send-reminder', {
            method: 'POST',
            body: {
              phone: parentPhone,
              message: `EduTrack: Cher parent, rappel pour la scolarité de ${student.name}. Solde restant: ${student.balance.toLocaleString()} FCFA.`
            }
          });
        })
      );

      alert(t('dashboard.alerts.remindersSent'));
    } catch (e) {
      alert('Failed to send SMS reminders.');
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleSendSchoolWideUnpaidReminders = async () => {
    if (!window.confirm("Voulez-vous envoyer un rappel de scolarité par WhatsApp à tous les parents d'élèves de l'école ayant un solde impayé ?")) return;
    
    setBroadcastingReminders(true);
    try {
      const res = await apiFetch('/paiements/send-unpaid-reminders-all', {
        method: 'POST'
      });
      alert(`Rappels collectifs envoyés !\nDestinataires notifiés : ${res.sentCount}\nÉchecs : ${res.failedCount}`);
    } catch (e) {
      alert(e.message || 'Échec de la diffusion des rappels');
    } finally {
      setBroadcastingReminders(false);
    }
  };

  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementText.trim()) {
      alert("Veuillez saisir le texte de l'annonce.");
      return;
    }
    if (!window.confirm(`Voulez-vous diffuser ce message par WhatsApp à TOUS les parents d'élèves actifs de l'école ?\n\n"${announcementText}"`)) return;

    setBroadcastingAnnouncement(true);
    try {
      const res = await apiFetch('/paiements/broadcast-announcement', {
        method: 'POST',
        body: { message: announcementText }
      });
      alert(`Annonce collective diffusée avec succès !\nParents notifiés : ${res.sentCount}\nÉchecs : ${res.failedCount}`);
      setAnnouncementText('');
    } catch (e) {
      alert(e.message || 'Échec de la diffusion de l\'annonce');
    } finally {
      setBroadcastingAnnouncement(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('payments.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Track student school fee collections and handle mobile money webhooks
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSendUnpaidAlerts}
            disabled={sendingAlerts || students.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Send className="h-4 w-4" />
            <span>Send Unpaid Alerts</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>{t('payments.record')}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Expected', value: `${totalExpected.toLocaleString()} FCFA` },
          { label: 'Total Collected', value: `${totalCollected.toLocaleString()} FCFA`, color: 'text-emerald-600' },
          { label: 'Collection Rate', value: `${collectionRate}%`, color: 'text-amber-500' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
              {card.label}
            </span>
            <span className={`text-2xl font-black block font-outfit mt-1 ${card.color || 'text-[#1E3A5F]'}`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Collective WhatsApp Broadcast Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
        {/* Left Card: School-Wide Tuition Reminders */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#1E3A5F] font-bold text-base font-outfit">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>Rappels de Scolarité Collectifs</span>
            </div>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">
              Envoyez en un clic un message de rappel personnalisé contenant le solde restant à tous les parents d'élèves de l'école ayant des frais de scolarité impayés ou partiels.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendSchoolWideUnpaidReminders}
            disabled={broadcastingReminders}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50 font-outfit"
          >
            <Send className={`h-4 w-4 ${broadcastingReminders ? 'animate-spin' : ''}`} />
            <span>Envoyer les rappels à toute l'école (WhatsApp)</span>
          </button>
        </div>

        {/* Right Card: General Announcement Broadcast */}
        <form 
          onSubmit={handleBroadcastAnnouncement} 
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center gap-2 text-[#1E3A5F] font-bold text-base font-outfit">
              <Send className="h-5 w-5 text-emerald-500" />
              <span>Diffusion d'Annonce Générale</span>
            </div>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">
              Envoyez une annonce collective (information de réunion, vacances, événements scolaires) à tous les parents d'élèves de l'établissement par WhatsApp.
            </p>
            <div className="mt-3">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Saisissez votre annonce ici..."
                rows="2"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none focus:border-transparent font-semibold text-slate-800 transition-all resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={broadcastingAnnouncement || !announcementText.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50 font-outfit"
          >
            <Send className={`h-4 w-4 ${broadcastingAnnouncement ? 'animate-spin' : ''}`} />
            <span>Diffuser l'annonce à tous les parents</span>
          </button>
        </form>
      </div>

      {/* Class Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Class</span>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all"
        >
          {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading school fee registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t('payments.table.student')}</th>
                  <th className="px-6 py-4">Total Tuition</th>
                  <th className="px-6 py-4">{t('payments.table.paid')}</th>
                  <th className="px-6 py-4">{t('payments.table.balance')}</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                      No students found in this class.
                    </td>
                  </tr>
                ) : (
                  students.map(student => {
                    let badgeColor = 'bg-rose-50 text-rose-700 border-rose-250';
                    if (student.status === 'PAID') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                    else if (student.status === 'PARTIAL') badgeColor = 'bg-amber-50 text-amber-700 border-amber-250';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                        <td className="px-6 py-4 font-bold text-slate-500">{classTuition.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4 font-black font-outfit text-emerald-600">{student.paid.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4 font-black font-outfit text-rose-600">{student.balance.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                            {student.status === 'PAID' ? t('payments.statusPaid') : student.status === 'PARTIAL' ? t('payments.statusPartial') : t('payments.statusUnpaid')}
                          </span>
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

      {/* Record Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Record Student Payment</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Balance: {s.balance.toLocaleString()} FCFA)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                  >
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="WAVE">Wave</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payer Phone Number</label>
                <input
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="e.g. +237670000001"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Ref / Receipt #</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="e.g. TX-MM-12345"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Tranche 1, Solde, etc."
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
