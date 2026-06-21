import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currencyFormatter';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import { apiFetch } from '../../api';
import { 
  Users, 
  FileText, 
  Coins, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Download, 
  DollarSign, 
  Eye 
} from 'lucide-react';

export default function HRPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const currency = user?.school?.currency || 'XAF';
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(false);

  // Common dropdown lists
  const [staffList, setStaffList] = useState([]);
  
  // Tab 1: Staff & Contracts
  const [contractsList, setContractsList] = useState([]);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [contractType, setContractType] = useState('CDI');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [contractBaseSalary, setContractBaseSalary] = useState('');
  const [contractHourlyRate, setContractHourlyRate] = useState('');
  const [contractTerms, setContractTerms] = useState('');
  const [savingContract, setSavingContract] = useState(false);

  // Tab 2: Payslips
  const [payslips, setPayslips] = useState([]);
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Tab 3: Salary Advances
  const [advances, setAdvances] = useState([]);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceMonth, setAdvanceMonth] = useState(new Date().getMonth() + 1);
  const [advanceYear, setAdvanceYear] = useState(new Date().getFullYear());
  const [advanceRemarks, setAdvanceRemarks] = useState('');
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Tab 4: Leaves
  const [leaves, setLeaves] = useState([]);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL_LEAVE');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [savingLeave, setSavingLeave] = useState(false);

  // Edit states
  const [editingContractId, setEditingContractId] = useState(null);
  const [editingAdvanceId, setEditingAdvanceId] = useState(null);
  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [editingPayslipId, setEditingPayslipId] = useState(null);


  useEffect(() => {
    loadHRData();
  }, [activeTab]);

  async function loadHRData() {
    try {
      setLoading(true);
      const staffData = await apiFetch('/hr/staff');
      setStaffList(staffData);
      
      if (activeTab === 'staff') {
        // Build contracts list from staff contracts
        const allContracts = [];
        staffData.forEach(member => {
          member.contracts.forEach(c => {
            allContracts.push({
              ...c,
              userName: member.name,
              userRole: member.role,
              userEmail: member.email
            });
          });
        });
        setContractsList(allContracts);
      } else if (activeTab === 'payslips') {
        const payslipsData = await apiFetch('/hr/payslips');
        setPayslips(payslipsData);
      } else if (activeTab === 'advances') {
        const advancesData = await apiFetch('/hr/advances');
        setAdvances(advancesData);
      } else if (activeTab === 'leaves') {
        const leavesData = await apiFetch('/hr/leaves');
        setLeaves(leavesData);
      }
    } catch (e) {
      console.error('Failed to load HR data:', e);
    } finally {
      setLoading(false);
    }
  }

  
  const handleDeleteContract = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) return;
    try {
      await apiFetch(`/hr/contracts/${id}`, { method: 'DELETE' });
      loadHRData();
    } catch (err) { alert(err.message); }
  };

  const openEditContract = (c) => {
    setEditingContractId(c.id);
    setSelectedStaffId(c.userId);
    setContractType(c.type);
    setContractStartDate(c.startDate ? c.startDate.split('T')[0] : '');
    setContractEndDate(c.endDate ? c.endDate.split('T')[0] : '');
    setContractBaseSalary(c.baseSalary || '');
    setContractHourlyRate(c.hourlyRate || '');
    setContractTerms(c.terms || '');
    setContractModalOpen(true);
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return alert('Please select a staff member.');
    setSavingContract(true);
    try {
      await apiFetch(editingContractId ? `/hr/contracts/${editingContractId}` : '/hr/contracts', {
        method: editingContractId ? 'PUT' : 'POST',
        body: {
          userId: selectedStaffId,
          type: contractType,
          startDate: contractStartDate,
          endDate: contractEndDate || null,
          baseSalary: parseFloat(contractBaseSalary) || 0,
          hourlyRate: parseFloat(contractHourlyRate) || 0,
          status: 'ACTIVE',
          terms: contractTerms
        }
      });
      alert(editingContractId ? 'Contract updated!' : 'Contract created successfully!');
      setContractModalOpen(false);
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to create contract');
    } finally {
      setSavingContract(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      await apiFetch('/hr/payslips/generate', {
        method: 'POST',
        body: {
          month: parseInt(payMonth),
          year: parseInt(payYear)
        }
      });
      alert('Payroll generated successfully for the selected period!');
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to generate payroll');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  
  const handleDeletePayslip = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce bulletin ?')) return;
    try {
      await apiFetch(`/hr/payslips/${id}`, { method: 'DELETE' });
      loadHRData();
    } catch (err) { alert(err.message); }
  };

  const handlePayPayslip = async (e) => {
    e.preventDefault();
    if (!selectedPayslip) return;
    try {
      await apiFetch(`/hr/payslips/${selectedPayslip.id}/pay`, {
        method: 'PUT',
        body: { paymentMethod }
      });
      alert('Payslip marked as paid!');
      setPaymentModalOpen(false);
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to pay payslip');
    }
  };

  
  const handleDeleteAdvance = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette avance ?')) return;
    try {
      await apiFetch(`/hr/advances/${id}`, { method: 'DELETE' });
      loadHRData();
    } catch (err) { alert(err.message); }
  };

  const openEditAdvance = (a) => {
    setEditingAdvanceId(a.id);
    setSelectedStaffId(a.userId);
    setAdvanceAmount(a.amount);
    setAdvanceMonth(a.repaymentMonth);
    setAdvanceYear(a.repaymentYear);
    setAdvanceRemarks(a.remarks || '');
    setAdvanceModalOpen(true);
  };

  const handleCreateAdvance = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return alert('Please select a staff member.');
    setSavingAdvance(true);
    try {
      await apiFetch(editingAdvanceId ? `/hr/advances/${editingAdvanceId}` : '/hr/advances', {
        method: editingAdvanceId ? 'PUT' : 'POST',
        body: {
          userId: selectedStaffId,
          amount: parseFloat(advanceAmount),
          repaymentMonth: parseInt(advanceMonth),
          repaymentYear: parseInt(advanceYear),
          remarks: advanceRemarks
        }
      });
      alert('Salary advance recorded!');
      setAdvanceModalOpen(false);
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to record advance');
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleUpdateAdvanceStatus = async (id, status) => {
    try {
      await apiFetch(`/hr/advances/${id}/status`, {
        method: 'PUT',
        body: { status }
      });
      alert(`Advance request updated to ${status}`);
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to update advance status');
    }
  };

  
  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce congé ?')) return;
    try {
      await apiFetch(`/hr/leaves/${id}`, { method: 'DELETE' });
      loadHRData();
    } catch (err) { alert(err.message); }
  };

  const openEditLeave = (l) => {
    setEditingLeaveId(l.id);
    setSelectedStaffId(l.userId);
    setLeaveType(l.type);
    setLeaveStartDate(l.startDate ? l.startDate.split('T')[0] : '');
    setLeaveEndDate(l.endDate ? l.endDate.split('T')[0] : '');
    setLeaveReason(l.reason || '');
    setLeaveModalOpen(true);
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return alert('Please select a staff member.');
    setSavingLeave(true);
    try {
      await apiFetch(editingLeaveId ? `/hr/leaves/${editingLeaveId}` : '/hr/leaves', {
        method: editingLeaveId ? 'PUT' : 'POST',
        body: {
          userId: selectedStaffId,
          type: leaveType,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason
        }
      });
      alert('Leave request logged!');
      setLeaveModalOpen(false);
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to request leave');
    } finally {
      setSavingLeave(false);
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await apiFetch(`/hr/leaves/${id}/status`, {
        method: 'PUT',
        body: { status }
      });
      alert(`Leave request updated to ${status}`);
      loadHRData();
    } catch (err) {
      alert(err.message || 'Failed to update leave status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
          {t('hr.title') || 'Ressources Humaines'}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t('hr.subtitle') || 'Gestion des profils personnels, contrats, paies, avances et congés'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'staff', label: t('hr.tabs.staff') || 'Personnel & Contrats', icon: Users },
          { id: 'payslips', label: t('hr.tabs.payslips') || 'Bulletins de Paie', icon: FileText },
          { id: 'advances', label: t('hr.tabs.advances') || 'Avances Salaire', icon: Coins },
          { id: 'leaves', label: t('hr.tabs.leaves') || 'Congés & Absences', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200
              ${activeTab === tab.id 
                ? 'border-[#F5A623] text-[#1E3A5F] font-bold bg-slate-50 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50 rounded-t-xl'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading HR details...</div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* TAB 1: STAFF & CONTRACTS */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Contrats du Personnel</h3>
                <button
                  onClick={() => { setEditingContractId(null); setSelectedStaffId(''); setContractBaseSalary(''); setContractHourlyRate(''); setContractModalOpen(true); }}
                  className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all duration-150"
                >
                  <Plus className="h-4 w-4" />
                  {t('hr.contracts.add') || 'Créer un Contrat'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Employé</th>
                        <th className="px-6 py-4">Rôle</th>
                        <th className="px-6 py-4">Contrat</th>
                        <th className="px-6 py-4">Début</th>
                        <th className="px-6 py-4">Salaire de Base</th>
                        <th className="px-6 py-4">Taux Horaire</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contractsList.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                            Aucun contrat de travail actif.
                          </td>
                        </tr>
                      ) : (
                        contractsList.map(contract => (
                          <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 block">{contract.userName}</span>
                              <span className="text-slate-400 text-[10px]">{contract.userEmail}</span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-500">{contract.userRole}</td>
                            <td className="px-6 py-4 font-bold text-slate-700">{contract.type}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(contract.startDate).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{contract.baseSalary?.toLocaleString()} </td>
                            <td className="px-6 py-4 text-slate-500">{contract.hourlyRate?.toLocaleString()} /h</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${contract.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {contract.status}
                              </span>
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

          {/* TAB 2: PAYSLIPS */}
          {activeTab === 'payslips' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end justify-between">
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mois</label>
                    <select
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none text-sm bg-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Année</label>
                    <select
                      value={payYear}
                      onChange={(e) => setPayYear(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none text-sm bg-white"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePayroll}
                  disabled={generatingPayroll}
                  className="bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {generatingPayroll ? 'Génération...' : t('hr.payroll.generate') || 'Générer la paie du mois'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Salarié</th>
                        <th className="px-6 py-4">Période</th>
                        <th className="px-6 py-4">Salaire Brut</th>
                        <th className="px-6 py-4">Acompte déduit</th>
                        <th className="px-6 py-4">Net à payer</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payslips.filter(p => p.month === parseInt(payMonth) && p.year === parseInt(payYear)).length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                            Aucun bulletin de paie disponible pour cette période. Cliquez sur "Générer la paie" pour initier.
                          </td>
                        </tr>
                      ) : (
                        payslips
                          .filter(p => p.month === parseInt(payMonth) && p.year === parseInt(payYear))
                          .map(payslip => {
                            const brut = payslip.baseSalary + (payslip.hourlyRate * payslip.hoursWorked) + payslip.bonuses - payslip.deductions;
                            return (
                              <tr key={payslip.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{payslip.user.name}</td>
                                <td className="px-6 py-4 text-slate-500">
                                  {payMonth}/{payYear}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{brut.toLocaleString()} </td>
                                <td className="px-6 py-4 text-rose-500 font-semibold">-{payslip.advancesDeducted.toLocaleString()} </td>
                                <td className="px-6 py-4 font-black text-emerald-600">{payslip.netSalary.toLocaleString()} </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${payslip.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {payslip.status === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                  {payslip.pdfUrl && (
                                    <a
                                      href={`http://localhost:5000${payslip.pdfUrl}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 hover:bg-slate-100 rounded-lg text-[#1E3A5F] border border-slate-200 shadow-sm"
                                      title="Télécharger PDF"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  )}
                                  {payslip.status === 'PENDING' && (
                                    <button
                                      onClick={() => {
                                        setSelectedPayslip(payslip);
                                        setPaymentModalOpen(true);
                                      }}
                                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm"
                                    >
                                      <DollarSign className="h-3 w-3" />
                                      Payer
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALARY ADVANCES */}
          {activeTab === 'advances' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Acomptes & Avances sur Salaire</h3>
                <button
                  onClick={() => { setEditingAdvanceId(null); setSelectedStaffId(''); setAdvanceAmount(''); setAdvanceModalOpen(true); }}
                  className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {t('hr.advances.request') || 'Demander une Avance'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Salarié</th>
                        <th className="px-6 py-4">Montant</th>
                        <th className="px-6 py-4">Reprise de Paie</th>
                        <th className="px-6 py-4">Remarques</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {advances.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                            Aucune demande d'avance enregistrée.
                          </td>
                        </tr>
                      ) : (
                        advances.map(adv => (
                          <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{adv.user.name}</td>
                            <td className="px-6 py-4 font-bold text-slate-600">{adv.amount.toLocaleString()} </td>
                            <td className="px-6 py-4 text-slate-500">
                              {adv.repaymentMonth}/{adv.repaymentYear}
                            </td>
                            <td className="px-6 py-4 text-slate-500">{adv.remarks || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold 
                                ${adv.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' : 
                                  adv.status === 'REPAID' ? 'bg-emerald-50 text-emerald-600' :
                                  adv.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                  'bg-amber-50 text-amber-600'}`}>
                                {adv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => openEditAdvance(adv)} className="text-blue-500 hover:text-blue-700 mr-2 text-sm">Editer</button>
                              <button onClick={() => handleDeleteAdvance(adv.id)} className="text-red-500 hover:text-red-700 mr-2 text-sm">Supprimer</button>
                              {adv.status === 'PENDING' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateAdvanceStatus(adv.id, 'APPROVED')}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg"
                                    title="Approuver"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateAdvanceStatus(adv.id, 'REJECTED')}
                                    className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg"
                                    title="Rejeter"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
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

          {/* TAB 4: LEAVES */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Planning des Congés & Absences</h3>
                <button
                  onClick={() => { setEditingLeaveId(null); setSelectedStaffId(''); setLeaveModalOpen(true); }}
                  className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Plus className="h-4 w-4" />
                  {t('hr.leaves.request') || 'Demander un Congé'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Salarié</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Début</th>
                        <th className="px-6 py-4">Fin</th>
                        <th className="px-6 py-4">Motif</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaves.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                            Aucune absence enregistrée.
                          </td>
                        </tr>
                      ) : (
                        leaves.map(lv => (
                          <tr key={lv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{lv.user.name}</td>
                            <td className="px-6 py-4 font-semibold text-slate-600">{lv.type}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(lv.startDate).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(lv.endDate).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 text-slate-500">{lv.reason || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold 
                                ${lv.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                                  lv.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                  'bg-amber-50 text-amber-600'}`}>
                                {lv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {lv.status === 'PENDING' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateLeaveStatus(lv.id, 'APPROVED')}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg"
                                    title="Valider"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateLeaveStatus(lv.id, 'REJECTED')}
                                    className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg"
                                    title="Rejeter"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
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

        </div>
      )}

      {/* Contract Creation Modal */}
      {contractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Créer un Contrat de Travail</h3>
              <button onClick={() => setContractModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employé</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white"
                >
                  <option value="">Sélectionner un employé...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type de Contrat</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="PRESTATAIRE">PRESTATAIRE</option>
                    <option value="STAGIAIRE">STAGIAIRE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Début</label>
                  <input
                    type="date"
                    required
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Salaire de base ({currency})</label>
                  <input
                    type="number"
                    value={contractBaseSalary}
                    onChange={(e) => setContractBaseSalary(e.target.value)}
                    placeholder="ex: 200000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Taux Horaire (Optionnel)</label>
                  <input
                    type="number"
                    value={contractHourlyRate}
                    onChange={(e) => setContractHourlyRate(e.target.value)}
                    placeholder="ex: 4500"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Fin (optionnelle)</label>
                <input
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Termes & Conditions</label>
                <textarea
                  value={contractTerms}
                  onChange={(e) => setContractTerms(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  placeholder="Note additionnelle..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContractModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContract}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {savingContract ? 'Enregistrement...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Payment Modal */}
      {paymentModalOpen && selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Payer le salaire</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handlePayPayslip} className="p-6 space-y-4">
              <div className="text-center py-2">
                <p className="text-xs text-slate-500 font-bold uppercase">Montant Net à Payer</p>
                <p className="text-3xl font-black text-emerald-600 font-outfit mt-1">
                  {selectedPayslip.netSalary.toLocaleString()} 
                </p>
                <p className="text-xs text-slate-400 mt-2 font-semibold">
                  Bénéficiaire : {selectedPayslip.user.name}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Moyen de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-bold text-slate-700"
                >
                  <option value="CASH">ESPÈCES (CASH)</option>
                  <option value="BANK">VIREMENT BANCAIRE (BANK)</option>
                  <option value="MOBILE_MONEY">MOBILE MONEY</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Valider le Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Advance Modal */}
      {advanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Demander une Avance</h3>
              <button onClick={() => setAdvanceModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateAdvance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employé</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white"
                >
                  <option value="">Sélectionner un employé...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Montant Demandé ({currency})</label>
                <input
                  type="number"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="ex: 50000"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mois de remboursement</label>
                  <select
                    value={advanceMonth}
                    onChange={(e) => setAdvanceMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Année</label>
                  <select
                    value={advanceYear}
                    onChange={(e) => setAdvanceYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Remarques / Motif</label>
                <textarea
                  value={advanceRemarks}
                  onChange={(e) => setAdvanceRemarks(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  placeholder="Justification courte..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdvance}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {savingAdvance ? 'Enregistrement...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-[#1E3A5F]">Nouvelle Absence / Congé</h3>
              <button onClick={() => setLeaveModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employé</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white"
                >
                  <option value="">Sélectionner un employé...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type d'Absence</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none bg-white font-semibold text-slate-700"
                >
                  <option value="ANNUAL_LEAVE">CONGÉ ANNUEL (ANNUAL LEAVE)</option>
                  <option value="PERMISSION">PERMISSION EXCEPTIONNELLE</option>
                  <option value="SICK_LEAVE">CONGÉ MALADIE (SICK LEAVE)</option>
                  <option value="OTHER">AUTRE / DEPLACEMENT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Début</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Fin</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Motif explicatif</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none"
                  placeholder="Écrire les détails ici..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLeave}
                  className="flex-1 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {savingLeave ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
