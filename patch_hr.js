const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Director', 'HRPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Edit states
const stateMarker = `  const [savingLeave, setSavingLeave] = useState(false);`;
const editStates = `
  // Edit states
  const [editingContractId, setEditingContractId] = useState(null);
  const [editingAdvanceId, setEditingAdvanceId] = useState(null);
  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [editingPayslipId, setEditingPayslipId] = useState(null);
`;
if (!content.includes('editingContractId')) {
  content = content.replace(stateMarker, stateMarker + '\n' + editStates);
}

// 2. Add Delete/Edit Handlers for Contracts
const contractHandlerMarker = `const handleCreateContract = async (e) => {`;
const newContractHandlers = `
  const handleDeleteContract = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) return;
    try {
      await apiFetch(\`/hr/contracts/\${id}\`, { method: 'DELETE' });
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
`;
if (!content.includes('handleDeleteContract')) {
  content = content.replace(contractHandlerMarker, newContractHandlers + '\n  ' + contractHandlerMarker);
}

// Update handleCreateContract to handle PUT
content = content.replace(
  `await apiFetch('/hr/contracts', {
        method: 'POST',`,
  `await apiFetch(editingContractId ? \`/hr/contracts/\${editingContractId}\` : '/hr/contracts', {
        method: editingContractId ? 'PUT' : 'POST',`
);
content = content.replace(
  `alert('Contract created successfully!');`,
  `alert(editingContractId ? 'Contract updated!' : 'Contract created successfully!');`
);

// Add clear edit state when opening new contract modal
content = content.replace(
  `onClick={() => setContractModalOpen(true)}`,
  `onClick={() => { setEditingContractId(null); setSelectedStaffId(''); setContractBaseSalary(''); setContractHourlyRate(''); setContractModalOpen(true); }}`
);

// 3. Add Delete/Edit for Advances
const advanceHandlerMarker = `const handleCreateAdvance = async (e) => {`;
const newAdvanceHandlers = `
  const handleDeleteAdvance = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette avance ?')) return;
    try {
      await apiFetch(\`/hr/advances/\${id}\`, { method: 'DELETE' });
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
`;
if (!content.includes('handleDeleteAdvance')) {
  content = content.replace(advanceHandlerMarker, newAdvanceHandlers + '\n  ' + advanceHandlerMarker);
}
content = content.replace(
  `await apiFetch('/hr/advances', {
        method: 'POST',`,
  `await apiFetch(editingAdvanceId ? \`/hr/advances/\${editingAdvanceId}\` : '/hr/advances', {
        method: editingAdvanceId ? 'PUT' : 'POST',`
);
content = content.replace(
  `onClick={() => setAdvanceModalOpen(true)}`,
  `onClick={() => { setEditingAdvanceId(null); setSelectedStaffId(''); setAdvanceAmount(''); setAdvanceModalOpen(true); }}`
);

// 4. Add Delete/Edit for Leaves
const leaveHandlerMarker = `const handleCreateLeave = async (e) => {`;
const newLeaveHandlers = `
  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce congé ?')) return;
    try {
      await apiFetch(\`/hr/leaves/\${id}\`, { method: 'DELETE' });
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
`;
if (!content.includes('handleDeleteLeave')) {
  content = content.replace(leaveHandlerMarker, newLeaveHandlers + '\n  ' + leaveHandlerMarker);
}
content = content.replace(
  `await apiFetch('/hr/leaves', {
        method: 'POST',`,
  `await apiFetch(editingLeaveId ? \`/hr/leaves/\${editingLeaveId}\` : '/hr/leaves', {
        method: editingLeaveId ? 'PUT' : 'POST',`
);
content = content.replace(
  `onClick={() => setLeaveModalOpen(true)}`,
  `onClick={() => { setEditingLeaveId(null); setSelectedStaffId(''); setLeaveModalOpen(true); }}`
);

// 5. Add Edit/Delete for Payslips (Actually, payslips are generated in bulk, but we can allow single delete)
const payslipHandlerMarker = `const handlePayPayslip = async (e) => {`;
const newPayslipHandlers = `
  const handleDeletePayslip = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce bulletin ?')) return;
    try {
      await apiFetch(\`/hr/payslips/\${id}\`, { method: 'DELETE' });
      loadHRData();
    } catch (err) { alert(err.message); }
  };
`;
if (!content.includes('handleDeletePayslip')) {
  content = content.replace(payslipHandlerMarker, newPayslipHandlers + '\n  ' + payslipHandlerMarker);
}

// 6. UI Updates for Contracts Table (add edit/delete buttons)
content = content.replace(
  `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">`,
  `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                            <button onClick={() => openEditContract(contract)} className="text-blue-500 hover:text-blue-700">Editer</button>
                            <button onClick={() => handleDeleteContract(contract.id)} className="text-red-500 hover:text-red-700">Supprimer</button>
`
);

// 7. UI Updates for Payslips Table
content = content.replace(
  `<button onClick={() => { setSelectedPayslip(payslip); setPaymentModalOpen(true); }} className="text-amber-500 hover:text-amber-700 text-sm">`,
  `<button onClick={() => handleDeletePayslip(payslip.id)} className="text-red-500 hover:text-red-700 mr-2 text-sm">Supprimer</button>
                              <button onClick={() => { setSelectedPayslip(payslip); setPaymentModalOpen(true); }} className="text-amber-500 hover:text-amber-700 text-sm">`
);

// 8. UI Updates for Advances Table
content = content.replace(
  `{adv.status === 'PENDING' && (`,
  `<button onClick={() => openEditAdvance(adv)} className="text-blue-500 hover:text-blue-700 mr-2 text-sm">Editer</button>
                              <button onClick={() => handleDeleteAdvance(adv.id)} className="text-red-500 hover:text-red-700 mr-2 text-sm">Supprimer</button>
                              {adv.status === 'PENDING' && (`
);

// 9. UI Updates for Leaves Table
content = content.replace(
  `{leave.status === 'PENDING' && (`,
  `<button onClick={() => openEditLeave(leave)} className="text-blue-500 hover:text-blue-700 mr-2 text-sm">Editer</button>
                              <button onClick={() => handleDeleteLeave(leave.id)} className="text-red-500 hover:text-red-700 mr-2 text-sm">Supprimer</button>
                              {leave.status === 'PENDING' && (`
);

// 10. Show Taux Horaire for Vacataires
content = content.replace(
  `<label className="block text-sm font-medium text-slate-700">Salaire de base</label>`,
  `{contractType === 'VACATAIRE' || contractType === 'PRESTATAIRE' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Taux Horaire</label>
                  <input type="number" value={contractHourlyRate} onChange={e => setContractHourlyRate(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Salaire de base</label>`
);
content = content.replace(
  `<input type="number" required value={contractBaseSalary}`,
  `<input type="number" required value={contractBaseSalary}`
);
content = content.replace(
  `className="w-full mt-1 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
            </div>`,
  `className="w-full mt-1 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
                </div>
              )}`
);

// Fix title of Contract Modal
content = content.replace(
  `<h2 className="text-xl font-bold text-[#1E3A5F]">Nouveau Contrat</h2>`,
  `<h2 className="text-xl font-bold text-[#1E3A5F]">{editingContractId ? 'Modifier Contrat' : 'Nouveau Contrat'}</h2>`
);

// Replace FCFA with formatted currency (if needed) - wait we need to import formatCurrency
if (!content.includes("import { formatCurrency }")) {
  content = content.replace(
    `import { useTranslation } from 'react-i18next';`,
    `import { useTranslation } from 'react-i18next';\nimport { formatCurrency } from '../../utils/currencyFormatter';\nimport { AuthContext } from '../../context/AuthContext';\nimport { useContext } from 'react';`
  );
  content = content.replace(
    `const { t } = useTranslation();`,
    `const { t } = useTranslation();\n  const { user } = useContext(AuthContext);\n  const currency = user?.school?.currency || 'XAF';`
  );
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('HRPage.jsx patched successfully');
