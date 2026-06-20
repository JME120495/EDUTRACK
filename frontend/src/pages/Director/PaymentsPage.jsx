import { AuthContext } from '../../context/AuthContext';
import React, { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { 
  CreditCard, 
  Plus, 
  Send, 
  X, 
  ShieldAlert, 
  CheckCircle, 
  Coins, 
  TrendingUp, 
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || 'XAF';

  const { t, i18n } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('tuition');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Tab 1 Stats (Tuition)
  const [classTuition, setClassTuition] = useState(150000);
  const [totalExpected, setTotalExpected] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [collectionRate, setCollectionRate] = useState(0);

  // General payment logging modal
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

  // Tuition Config Modal
  const [tuitionModalOpen, setTuitionModalOpen] = useState(false);
  const [tuitionAmount, setTuitionAmount] = useState('');
  const [updatingTuition, setUpdatingTuition] = useState(false);

  // Tab 2: Tranches (Installments)
  const [installments, setInstallments] = useState([]);
  const [instName, setInstName] = useState('');
  const [instAmount, setInstAmount] = useState('');
  const [instDueDate, setInstDueDate] = useState('');
  const [savingInstallments, setSavingInstallments] = useState(false);

  // Tab 3: Moratoires
  const [moratoriums, setMoratoriums] = useState([]);
  const [moratoireModalOpen, setMoratoireModalOpen] = useState(false);
  const [morAmount, setMorAmount] = useState('');
  const [morDueDate, setMorDueDate] = useState('');
  const [morRemarks, setMorRemarks] = useState('');
  const [savingMoratoire, setSavingMoratoire] = useState(false);

  // Tab 4: Caisse (Transactions)
  const [transactions, setTransactions] = useState([]);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState('EXPENSE');
  const [txCategory, setTxCategory] = useState('UTILITIES');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txReference, setTxReference] = useState('');
  const [txMethod, setTxMethod] = useState('CASH');
  const [savingTx, setSavingTx] = useState(false);

  // Tab 5: Reports
  const [reportData, setReportData] = useState(null);
  const [exportingReport, setExportingReport] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadPaymentsData(selectedClassId);
      loadInstallmentsData(selectedClassId);
    }
  }, [selectedClassId, activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'moratoires') {
      loadMoratoriums();
    } else if (activeSubTab === 'caisse') {
      loadTransactions();
    } else if (activeSubTab === 'reports') {
      loadReports();
    }
  }, [activeSubTab]);

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
      const data = await apiFetch(`/paiements/classe/${classId}`);
      const baseTuition = data.length > 0 ? data[0].totalTuition : 150000;
      setClassTuition(baseTuition);

      let collected = 0;
      const studentsPayments = data.map(item => {
        collected += item.amountPaid;
        return {
          id: item.studentId,
          name: item.studentName,
          matricule: item.matricule,
          paid: item.amountPaid,
          balance: item.balance,
          status: item.status
        };
      });

      setStudents(studentsPayments);
      setTotalExpected(studentsPayments.length * baseTuition);
      setTotalCollected(collected);
      setCollectionRate(studentsPayments.length > 0 ? Math.round((collected / (studentsPayments.length * baseTuition)) * 100) : 0);

      if (studentsPayments.length > 0) {
        setSelectedStudentId(studentsPayments[0].id);
      }
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadInstallmentsData(classId) {
    try {
      const list = await apiFetch(`/finance/tranches/classe/${classId}`);
      setInstallments(list);
    } catch (e) {
      console.error('Failed to load installments:', e);
    }
  }

  async function loadMoratoriums() {
    try {
      const list = await apiFetch('/finance/moratoires/all');
      setMoratoriums(list);
    } catch (e) {
      console.error('Failed to load moratoriums:', e);
    }
  }

  async function loadTransactions() {
    try {
      const list = await apiFetch('/finance/transactions/all');
      setTransactions(list);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    }
  }

  async function loadReports() {
    try {
      const data = await apiFetch('/finance/reports');
      setReportData(data);
    } catch (e) {
      console.error('Failed to load reports:', e);
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
      await apiFetch('/paiements/unpaid-alerts', {
        method: 'POST',
        body: { classId: selectedClassId }
      });
      alert('SMS Alerts dispatched successfully.');
    } catch (e) {
      alert('Failed to send SMS reminders.');
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleConfigureTuition = async (e) => {
    e.preventDefault();
    setUpdatingTuition(true);
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const anneeScolaireId = selectedClass ? selectedClass.anneeScolaireId : null;
      if (!anneeScolaireId) throw new Error("Impossible de trouver l'année active.");
      
      await apiFetch('/paiements/frais', {
        method: 'POST',
        body: {
          classId: selectedClassId,
          anneeScolaireId,
          totalAmount: parseFloat(tuitionAmount)
        }
      });
      alert("Frais configurés avec succès !");
      setTuitionModalOpen(false);
      setTuitionAmount('');
      loadPaymentsData(selectedClassId);
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setUpdatingTuition(false);
    }
  };

  const handleAddInstallment = () => {
    if (!instName || !instAmount || !instDueDate) return alert('Veuillez remplir tous les champs de la tranche.');
    const newInst = {
      name: instName,
      amount: parseFloat(instAmount),
      dueDate: instDueDate
    };
    setInstallments([...installments, newInst]);
    setInstName('');
    setInstAmount('');
    setInstDueDate('');
  };

  const handleSaveInstallments = async () => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) return;
    
    // Find matching tuition ID
    setSavingInstallments(true);
    try {
      const fees = await apiFetch('/paiements/frais/all');
      const fee = fees.find(f => f.classId === selectedClassId && f.anneeScolaireId === selectedClass.anneeScolaireId);
      
      if (!fee) {
        return alert("Veuillez d'abord configurer le montant global des frais pour cette classe.");
      }

      await apiFetch('/finance/tranches', {
        method: 'POST',
        body: {
          fraisScolariteId: fee.id,
          installments
        }
      });
      alert('Échéances de paiement configurées !');
      loadInstallmentsData(selectedClassId);
    } catch (e) {
      alert(e.message || 'Error configuring installments');
    } finally {
      setSavingInstallments(false);
    }
  };

  const handleCreateMoratoire = async (e) => {
    e.preventDefault();
    setSavingMoratoire(true);
    try {
      await apiFetch('/finance/moratoires', {
        method: 'POST',
        body: {
          eleveId: selectedStudentId,
          amount: parseFloat(morAmount),
          dueDate: morDueDate,
          remarks: morRemarks
        }
      });
      alert('Moratoire accordé avec succès !');
      setMoratoireModalOpen(false);
      setMorAmount('');
      setMorDueDate('');
      setMorRemarks('');
      loadMoratoriums();
    } catch (e) {
      alert(e.message || 'Error');
    } finally {
      setSavingMoratoire(false);
    }
  };

  const handleDeleteMoratoire = async (id) => {
    if (!confirm('Supprimer ou clore ce moratoire ?')) return;
    try {
      await apiFetch(`/finance/moratoires/${id}`, { method: 'DELETE' });
      alert('Moratoire réglé ou annulé.');
      loadMoratoriums();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateTx = async (e) => {
    e.preventDefault();
    setSavingTx(true);
    try {
      await apiFetch('/finance/transactions', {
        method: 'POST',
        body: {
          type: txType,
          category: txCategory,
          amount: parseFloat(txAmount),
          date: txDate || new Date(),
          description: txDescription,
          reference: txReference,
          paymentMethod: txMethod
        }
      });
      alert('Transaction enregistrée !');
      setTxModalOpen(false);
      setTxAmount('');
      setTxDescription('');
      setTxReference('');
      loadTransactions();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async (id) => {
    if (!confirm('Supprimer cette écriture comptable ?')) return;
    try {
      await apiFetch(`/finance/transactions/${id}`, { method: 'DELETE' });
      alert('Écriture supprimée.');
      loadTransactions();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportPDFReport = async () => {
    setExportingReport(true);
    try {
      const res = await apiFetch('/finance/reports/pdf');
      if (res.url) {
        window.open(`http://localhost:5000${res.url}`, '_blank');
      }
    } catch (e) {
      alert('Failed to generate report PDF');
    } finally {
      setExportingReport(false);
    }
  };

  const handlePrintReceipt = (student) => {
    const printWindow = window.open('', '_blank');
    const className = classes.find(c => c.id === selectedClassId)?.name || 'N/A';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Reçu de Paiement - ${student.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1E3A5F; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1E3A5F; }
            .info-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            .info-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; width: 40%; color: #555; }
            .value { font-weight: bold; color: #111; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; }
            .stamp-area { margin-top: 40px; text-align: right; padding-right: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">REÇU DE SCOLARITÉ / TUITION RECEIPT</div>
            <div>Date d'impression : ${new Date().toLocaleDateString('fr-FR')}</div>
          </div>
          
          <table class="info-table">
            <tr><td class="label">Élève / Student :</td><td class="value">${student.name}</td></tr>
            <tr><td class="label">Matricule / ID :</td><td class="value">${student.matricule}</td></tr>
            <tr><td class="label">Classe / Class :</td><td class="value">${className}</td></tr>
            <tr><td class="label">Scolarité Totale / Total Tuition :</td><td class="value">${classTuition.toLocaleString()} {currency}</td></tr>
            <tr><td class="label">Total Payé / Total Paid :</td><td class="value" style="color: green;">${student.paid.toLocaleString()} {currency}</td></tr>
            <tr><td class="label">Reste à Payer / Balance :</td><td class="value" style="color: red;">${student.balance.toLocaleString()} {currency}</td></tr>
            <tr><td class="label">Statut / Status :</td><td class="value">${student.status === 'PAID' ? 'RÉGLÉ' : student.status === 'PARTIAL' ? 'PARTIEL' : 'IMPAYÉ'}</td></tr>
          </table>

          <div class="stamp-area">
            <strong>Signature / Cachet Intendance</strong>
            <br/><br/><br/><br/>
            _________________________
          </div>

          <div class="footer">
            Document généré électroniquement par EduTrack.
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    // Use timeout to allow CSS to load if needed, though inline here
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
            {t('payments.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'tuition', label: t('payments.tabs.tuition'), icon: CreditCard },
          { id: 'tranches', label: t('payments.tabs.plans'), icon: Calendar },
          { id: 'moratoires', label: t('payments.tabs.moratoriums'), icon: AlertTriangle },
          { id: 'caisse', label: t('payments.tabs.cashbook'), icon: Coins },
          { id: 'reports', label: t('payments.tabs.reports'), icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-xs transition-all duration-200
              ${activeSubTab === tab.id 
                ? 'border-[#F5A623] text-[#1E3A5F] font-bold bg-slate-50 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 rounded-t-xl'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-200">
        
        {/* SUB-TAB 1: TUITION RECOVERY (ORIGINAL CONTENT ENHANCED) */}
        {activeSubTab === 'tuition' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-slate-700 font-semibold text-sm">
                {t('payments.summary.configuredFees')} <span className="font-extrabold text-[#1E3A5F]">{classTuition.toLocaleString()} {currency}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTuitionModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  {t('payments.btn.editFees')}
                </button>
                <button
                  onClick={handleSendUnpaidAlerts}
                  disabled={sendingAlerts || students.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                  {t('payments.btn.sendReminders')}
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('payments.btn.addPayment')}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: t('payments.stats.expected'), value: `${totalExpected.toLocaleString()} {currency}` },
                { label: t('payments.stats.collected'), value: `${totalCollected.toLocaleString()} {currency}`, color: 'text-emerald-600' },
                { label: t('payments.stats.rate'), value: `${collectionRate}%`, color: 'text-amber-500' }
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
                    {card.label}
                  </span>
                  <span className={`text-xl font-black block font-outfit mt-1 ${card.color || 'text-[#1E3A5F]'}`}>
                    {card.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Students Payments Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{t('payments.table.student')}</th>
                      <th className="px-6 py-4">{t('payments.table.matricule')}</th>
                      <th className="px-6 py-4">{t('payments.table.paid')}</th>
                      <th className="px-6 py-4">{t('payments.table.remaining')}</th>
                      <th className="px-6 py-4">{t('payments.table.status')}</th>
                      <th className="px-6 py-4 text-right">{t('payments.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          Aucun élève inscrit dans cette classe.
                        </td>
                      </tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">{s.matricule}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{s.paid.toLocaleString()} {currency}</td>
                          <td className="px-6 py-4 font-bold text-rose-600">{s.balance.toLocaleString()} {currency}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold 
                              ${s.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                                s.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'}`}>
                              {s.status === 'PAID' ? t('payments.statusPaid') : s.status === 'PARTIAL' ? t('payments.statusPartial') : t('payments.statusUnpaid')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handlePrintReceipt(s)}
                              title="Imprimer Reçu"
                              className="p-1.5 bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors inline-flex"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: PAYMENT PLAN (TRANCHES) */}
        {activeSubTab === 'tranches' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Installment configuration form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-[#1E3A5F] font-outfit text-base">Ajouter une échéance / Tranche</h3>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom du versement</label>
                <input
                  type="text"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="ex: Première tranche, Inscription"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Montant ({currency})</label>
                <input
                  type="number"
                  value={instAmount}
                  onChange={(e) => setInstAmount(e.target.value)}
                  placeholder="ex: 50000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date limite / Échéance</label>
                <input
                  type="date"
                  value={instDueDate}
                  onChange={(e) => setInstDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddInstallment}
                className="w-full bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] py-2 rounded-xl text-xs font-bold shadow-md transition-all flex justify-center items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter au plan
              </button>
            </div>

            {/* Current plan listing */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-[#1E3A5F] font-outfit text-base">Plan d'échéances configuré</h3>
                <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                  Division de la scolarité totale ({classTuition.toLocaleString()} {currency}) pour cette classe.
                </p>

                <div className="mt-4 border border-slate-100 rounded-xl divide-y divide-slate-100">
                  {installments.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 font-semibold">
                      Aucune tranche de paiement configurée. Les parents paient de manière libre.
                    </div>
                  ) : (
                    installments.map((inst, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <span className="font-bold text-slate-800 text-sm">{inst.name}</span>
                          <span className="text-slate-400 block text-[10px]">
                            Échéance : {new Date(inst.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-700 text-sm">
                            {inst.amount?.toLocaleString()} {currency}
                          </span>
                          <button
                            onClick={() => {
                              const updated = installments.filter((_, idx) => idx !== index);
                              setInstallments(updated);
                            }}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {installments.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveInstallments}
                  disabled={savingInstallments}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {savingInstallments ? 'Enregistrement...' : 'Valider et Appliquer le Plan'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUB-TAB 3: MORATORIUMS */}
        {activeSubTab === 'moratoires' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Moratoires de Paiement</h3>
              <button
                onClick={() => setMoratoireModalOpen(true)}
                className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                Accorder un Moratoire
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Élève</th>
                      <th className="px-6 py-4">Classe</th>
                      <th className="px-6 py-4">Montant Couvert</th>
                      <th className="px-6 py-4">Nouvelle Échéance</th>
                      <th className="px-6 py-4">Motif / Notes</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {moratoriums.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                          Aucun moratoire accordé actuellement.
                        </td>
                      </tr>
                    ) : (
                      moratoriums.map(mor => (
                        <tr key={mor.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{mor.eleve.name}</td>
                          <td className="px-6 py-4 font-semibold text-slate-500">{mor.eleve.class.name}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{mor.amount?.toLocaleString()} {currency}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(mor.dueDate).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4 text-slate-500">{mor.remarks || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              {mor.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteMoratoire(mor.id)}
                              className="text-xs text-rose-600 hover:underline font-bold"
                            >
                              Annuler/Réglé
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 4: CASH GENERAL LEDGER (TRANSACTIONS) */}
        {activeSubTab === 'caisse' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Journal des flux de Trésorerie</h3>
              <button
                onClick={() => setTxModalOpen(true)}
                className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                Saisir Recette / Dépense
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Catégorie</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Moyen</th>
                      <th className="px-6 py-4">Montant</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                          Aucun flux de caisse enregistré.
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(tx.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {tx.type === 'INCOME' ? 'RECETTE' : 'DÉPENSE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">{tx.category}</td>
                          <td className="px-6 py-4 text-slate-700">{tx.description}</td>
                          <td className="px-6 py-4 text-slate-500">{tx.paymentMethod}</td>
                          <td className={`px-6 py-4 font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'}{tx.amount?.toLocaleString()} {currency}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteTx(tx.id)}
                              className="text-xs text-rose-600 hover:underline font-bold"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: FINANCIAL REPORTS & GRAPHS */}
        {activeSubTab === 'reports' && reportData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">Synthèse des Comptes & Rapports</h3>
              <button
                onClick={handleExportPDFReport}
                disabled={exportingReport}
                className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exportingReport ? 'Génération...' : 'Télécharger le Rapport Financier PDF (A4)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { label: 'Scolarité Recouvrée', value: `${reportData.tuition.collected.toLocaleString()} {currency}`, color: 'text-emerald-600' },
                { label: 'Autres Recettes', value: `${reportData.general.otherIncome.toLocaleString()} {currency}`, color: 'text-teal-600' },
                { label: 'Dépenses Communes', value: `${reportData.general.generalExpenses.toLocaleString()} {currency}`, color: 'text-rose-600' },
                { label: 'Dépenses de Salaires', value: `${reportData.general.payrollExpense.toLocaleString()} {currency}`, color: 'text-indigo-600' }
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">{c.label}</span>
                  <span className={`text-base font-black block font-outfit mt-1 ${c.color}`}>{c.value}</span>
                </div>
              ))}
            </div>

            {/* Financial Health Balance Block */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-black text-slate-800 font-outfit text-base">État Général de la Trésorerie</h4>
                <p className="text-slate-500 text-xs font-semibold mt-1">Calculé sur l'intégralité des flux (Scolarités + Dons + Salaires + Charges).</p>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <span className="text-slate-500 text-xs block font-bold">TOTAL RECETTES</span>
                  <span className="text-xl font-extrabold text-emerald-600 font-outfit">
                    {(reportData.totals.income).toLocaleString()} {currency}
                  </span>
                </div>
                <div className="text-center border-l border-slate-200 pl-8">
                  <span className="text-slate-500 text-xs block font-bold">TOTAL DÉPENSES</span>
                  <span className="text-xl font-extrabold text-rose-600 font-outfit">
                    {(reportData.totals.expense).toLocaleString()} {currency}
                  </span>
                </div>
                <div className="text-center border-l border-slate-200 pl-8">
                  <span className="text-slate-500 text-xs block font-bold">SOLDE NET</span>
                  <span className={`text-2xl font-black font-outfit ${reportData.totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {reportData.totals.balance.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Interactive Table showing last 6 months */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-[#1E3A5F] text-base font-outfit">Évolution Mensuelle (6 derniers mois)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Mois</th>
                      <th className="px-4 py-2 text-right">Recettes (Income)</th>
                      <th className="px-4 py-2 text-right">Dépenses (Expenses)</th>
                      <th className="px-4 py-2 text-right">Bénéfice Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthly.map((m, i) => {
                      const net = m.income - m.expense;
                      return (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-extrabold text-[#1E3A5F]">{m.label}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">{m.income.toLocaleString()} {currency}</td>
                          <td className="px-4 py-3 text-right text-rose-600 font-bold">{m.expense.toLocaleString()} {currency}</td>
                          <td className={`px-4 py-3 text-right font-black ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {net.toLocaleString()} {currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* VERSEMENT / MANUAL PAYMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Enregistrer un Paiement Manuel</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Élève</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-semibold text-slate-700"
                >
                  <option value="">Sélectionner l'élève...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.matricule})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Montant ({currency})</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="ex: 50000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Moyen</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                  >
                    <option value="CASH">ESPÈCES (CASH)</option>
                    <option value="BANK">BANK / VIREMENT</option>
                    <option value="MOBILE_MONEY">MOBILE MONEY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone Dépositaire</label>
                <input
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="ex: +237..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Réf Transaction / Bordereau</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="ex: TX-9284242"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Remarques</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Note libre..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TUITION CONFIG MODAL */}
      {tuitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Montant Scolarité Classe</h3>
              <button onClick={() => setTuitionModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleConfigureTuition} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scolarité Globale ({currency})</label>
                <input
                  type="number"
                  required
                  value={tuitionAmount}
                  onChange={(e) => setTuitionAmount(e.target.value)}
                  placeholder="ex: 150000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTuitionModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTuition}
                  className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {updatingTuition ? 'Configuration...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MORATOIRE MODAL */}
      {moratoireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Accorder un Moratoire</h3>
              <button onClick={() => setMoratoireModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateMoratoire} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Élève</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-semibold text-slate-700"
                >
                  <option value="">Sélectionner l'élève...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.matricule})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Montant autorisé en retard ({currency})</label>
                <input
                  type="number"
                  required
                  value={morAmount}
                  onChange={(e) => setMorAmount(e.target.value)}
                  placeholder="ex: 50000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nouvelle Échéance Accordée</label>
                <input
                  type="date"
                  required
                  value={morDueDate}
                  onChange={(e) => setMorDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Motif / Justification</label>
                <textarea
                  value={morRemarks}
                  onChange={(e) => setMorRemarks(e.target.value)}
                  rows="2"
                  placeholder="ex: Problème familial temporaire, bordereau en attente..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMoratoireModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMoratoire}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {savingMoratoire ? 'Enregistrement...' : 'Accorder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TRANSACTION MODAL */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Saisir un flux de Caisse</h3>
              <button onClick={() => setTxModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateTx} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type de flux</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                  >
                    <option value="EXPENSE">DÉPENSE (EXPENSE)</option>
                    <option value="INCOME">RECETTE (INCOME)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Catégorie</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="UTILITIES">FACTURES (UTILITIES)</option>
                    <option value="RENT">LOYER (RENT)</option>
                    <option value="EQUIPMENT">MATÉRIEL (EQUIPMENT)</option>
                    <option value="SUPPLIES">FOURNITURES (SUPPLIES)</option>
                    <option value="DONATION">DON / SPONSORING</option>
                    <option value="OTHER">AUTRES CHARGES / PRODUITS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Montant ({currency})</label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="ex: 12000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Moyen</label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="CASH">ESPÈCES (CASH)</option>
                    <option value="BANK">BANK / CHÈQUE</option>
                    <option value="MOBILE_MONEY">MOBILE MONEY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Réf / Pièce justificative</label>
                  <input
                    type="text"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    placeholder="ex: FACT-983"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description / Libellé</label>
                <textarea
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  rows="2"
                  placeholder="ex: Achat de craies, Facture d'électricité mai 2026..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTxModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTx}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {savingTx ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
