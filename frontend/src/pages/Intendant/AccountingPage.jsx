import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, 
  BookOpen, 
  FileText, 
  Plus, 
  Save, 
  Settings, 
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../api';

export default function AccountingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, entry, plan, reports
  
  // Data states
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [entries, setEntries] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accData, jourData, fyData] = await Promise.all([
        apiFetch('/accounting/accounts'),
        apiFetch('/accounting/journals'),
        apiFetch('/accounting/fiscal-years')
      ]);
      setAccounts(accData);
      setJournals(jourData);
      setFiscalYears(fyData);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données comptables.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/accounting/entries');
      setEntries(data);
    } catch (err) {
      setError("Erreur lors du chargement des écritures.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/accounting/reports/trial-balance');
      setTrialBalance(data);
    } catch (err) {
      setError("Erreur lors de la génération de la balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'entry') fetchEntries();
    if (activeTab === 'reports') fetchTrialBalance();
  }, [activeTab]);

  const initOhada = async () => {
    if (!window.confirm("Voulez-vous initialiser le Plan Comptable OHADA par défaut ?")) return;
    try {
      setLoading(true);
      await apiFetch('/accounting/accounts/init-ohada', { method: 'POST' });
      setSuccess("Plan comptable OHADA initialisé avec succès.");
      fetchData();
    } catch (err) {
      setError("Erreur lors de l'initialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-indigo-600" />
            Comptabilité
          </h1>
          <p className="text-slate-500 text-sm">Gestion comptable en partie double (Type Sage)</p>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && (
            <button
              onClick={initOhada}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Initialiser Plan OHADA
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calculator className="h-4 w-4" /> Tableau de Bord
        </button>
        <button
          onClick={() => setActiveTab('entry')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'entry' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-4 w-4" /> Saisie Journal
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'plan' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Plan Comptable
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'reports' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-4 w-4" /> Éditions (Balance)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'dashboard' && (
          <div className="p-6 text-center text-slate-500 py-12">
            <Calculator className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Résumé Financier</h3>
            <p>Aperçu des indicateurs clés, de la trésorerie et du résultat.</p>
          </div>
        )}

        {activeTab === 'entry' && <EntrySaisieTab journals={journals} accounts={accounts} entries={entries} onEntryAdded={fetchEntries} />}
        
        {activeTab === 'plan' && <PlanComptableTab accounts={accounts} />}
        
        {activeTab === 'reports' && <ReportsTab trialBalance={trialBalance} />}
      </div>
    </div>
  );
}

function EntrySaisieTab({ journals, accounts, entries, onEntryAdded }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    journalId: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', debit: '', credit: '', description: '' },
      { accountId: '', debit: '', credit: '', description: '' }
    ]
  });

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', debit: '', credit: '', description: '' }]
    });
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/accounting/entries', {
        method: 'POST',
        body: formData
      });
      setIsAdding(false);
      setFormData({
        journalId: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [
          { accountId: '', debit: '', credit: '', description: '' },
          { accountId: '', debit: '', credit: '', description: '' }
        ]
      });
      onEntryAdded();
    } catch (err) {
      alert(err.message || 'Erreur de saisie');
    }
  };

  const totalDebit = formData.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-slate-800">Saisie des Écritures</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> {isAdding ? 'Annuler' : 'Nouvelle Écriture'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Journal</label>
              <select 
                required
                value={formData.journalId}
                onChange={e => setFormData({...formData, journalId: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Sélectionner</option>
                {journals.map(j => <option key={j.id} value={j.id}>{j.code} - {j.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">N° Pièce</label>
              <input 
                type="text" required
                value={formData.reference}
                onChange={e => setFormData({...formData, reference: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Libellé</label>
              <input 
                type="text" required
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
              <div className="col-span-4">Compte</div>
              <div className="col-span-4">Libellé Ligne</div>
              <div className="col-span-2 text-right">Débit</div>
              <div className="col-span-2 text-right">Crédit</div>
            </div>
            {formData.lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <select 
                    required
                    value={line.accountId}
                    onChange={e => handleLineChange(index, 'accountId', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Sélectionner</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.number} - {a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <input 
                    type="text" placeholder="Optionnel"
                    value={line.description}
                    onChange={e => handleLineChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={line.debit}
                    onChange={e => {
                      handleLineChange(index, 'debit', e.target.value);
                      if (e.target.value) handleLineChange(index, 'credit', '');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={line.credit}
                    onChange={e => {
                      handleLineChange(index, 'credit', e.target.value);
                      if (e.target.value) handleLineChange(index, 'debit', '');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
            <button 
              type="button" 
              onClick={handleAddLine}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter une ligne
            </button>
            <div className="flex gap-8 text-sm">
              <div className="font-medium text-slate-700">Total Débit: <span className="font-bold text-slate-900">{totalDebit.toFixed(2)}</span></div>
              <div className="font-medium text-slate-700">Total Crédit: <span className="font-bold text-slate-900">{totalCredit.toFixed(2)}</span></div>
            </div>
            <button 
              type="submit"
              disabled={!isBalanced}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                ${isBalanced ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              <Save className="h-4 w-4" /> Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* List of recent entries */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Date</th>
              <th className="px-4 py-3">JRN</th>
              <th className="px-4 py-3">N° Pièce</th>
              <th className="px-4 py-3">Libellé</th>
              <th className="px-4 py-3 text-right">Débit</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Crédit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Aucune écriture comptable.</td></tr>
            ) : (
              entries.map(entry => (
                <React.Fragment key={entry.id}>
                  <tr className="bg-slate-50/50 hover:bg-slate-50 font-medium">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{entry.journal?.code}</td>
                    <td className="px-4 py-3">{entry.reference}</td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right">-</td>
                  </tr>
                  {entry.lines.map(line => (
                    <tr key={line.id} className="hover:bg-slate-50 text-slate-500">
                      <td colSpan="3" className="px-4 py-2 border-l-4 border-indigo-200"></td>
                      <td className="px-4 py-2">
                        <span className="font-medium text-slate-700">{line.account?.number}</span> - {line.account?.name}
                      </td>
                      <td className="px-4 py-2 text-right">{line.debit > 0 ? line.debit.toFixed(2) : ''}</td>
                      <td className="px-4 py-2 text-right">{line.credit > 0 ? line.credit.toFixed(2) : ''}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanComptableTab({ accounts }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-slate-800">Plan Comptable</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un compte..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Numéro</th>
              <th className="px-4 py-3">Intitulé</th>
              <th className="px-4 py-3 rounded-tr-lg">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map(acc => (
              <tr key={acc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-700">{acc.number}</td>
                <td className="px-4 py-3">{acc.name}</td>
                <td className="px-4 py-3 text-xs">
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {acc.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsTab({ trialBalance }) {
  const totalDebit = trialBalance.reduce((sum, b) => sum + b.totalDebit, 0);
  const totalCredit = trialBalance.reduce((sum, b) => sum + b.totalCredit, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-slate-800">Balance Générale</h3>
        <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtrer
        </button>
      </div>
      
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-xs uppercase text-slate-700">
            <tr>
              <th className="px-4 py-3 border-b">Compte</th>
              <th className="px-4 py-3 border-b">Intitulé</th>
              <th className="px-4 py-3 border-b text-right">Mouvements Débit</th>
              <th className="px-4 py-3 border-b text-right">Mouvements Crédit</th>
              <th className="px-4 py-3 border-b text-right text-indigo-700">Solde Débiteur</th>
              <th className="px-4 py-3 border-b text-right text-indigo-700">Solde Créditeur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trialBalance.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-slate-400">Aucune donnée pour la balance.</td></tr>
            ) : (
              trialBalance.map(b => (
                <tr key={b.account.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-700">{b.account.number}</td>
                  <td className="px-4 py-3">{b.account.name}</td>
                  <td className="px-4 py-3 text-right">{b.totalDebit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{b.totalCredit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-600">
                    {b.balance > 0 ? b.balance.toFixed(2) : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-rose-600">
                    {b.balance < 0 ? Math.abs(b.balance).toFixed(2) : ''}
                  </td>
                </tr>
              ))
            )}
            {/* Totals */}
            {trialBalance.length > 0 && (
              <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-300">
                <td colSpan="2" className="px-4 py-3 text-right uppercase">Total Général</td>
                <td className="px-4 py-3 text-right">{totalDebit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-indigo-600">
                  {/* Balance des soldes doit être équilibrée */}
                </td>
                <td className="px-4 py-3 text-right text-rose-600">
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
