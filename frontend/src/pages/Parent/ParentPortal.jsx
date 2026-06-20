import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { apiFetch } from '../../api';
import MessageInbox from '../../components/MessageInbox';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Calendar, 
  Wallet,
  CheckCircle,
  Clock,
  Smartphone,
  X,
  Lock,
  Bell
} from 'lucide-react';

export default function ParentPortal() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || 'XAF';

  const { t } = useTranslation();

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('children'); // 'children' or 'messages'

  // Child data details
  const [grades, setGrades] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [payments, setPayments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [creneaux, setCreneaux] = useState([]);

  // Payment Modal States
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('50000');
  const [payMethod, setPayMethod] = useState('MTN_MOMO');
  const [payPhone, setPayPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    loadParentChildren();
  }, []);

  useEffect(() => {
    if (user && user.phone) {
      setPayPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (selectedChildId) {
      loadChildData(selectedChildId);
    }
  }, [selectedChildId]);

  async function loadParentChildren() {
    try {
      setLoading(true);
      const data = await apiFetch('/auth/parent/children');
      setChildren(data);
      if (data.length > 0) {
        setSelectedChildId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load children:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadChildData(childId) {
    const child = children.find(c => c.id === childId);
    const classId = child?.classId || '';
    
    // Load grades
    try {
      const gradesData = await apiFetch(`/notes?eleveId=${childId}`);
      // Filter out drafts: only show validated evaluations to parents
      const validatedGrades = gradesData.filter(g => !g.isDraft);
      setGrades(validatedGrades);
    } catch (e) {
      console.error('Failed to load child grades:', e);
      setGrades([]);
    }

    // Load bulletins
    try {
      const bulletinsData = await apiFetch(`/bulletins?eleveId=${childId}`);
      setBulletins(bulletinsData);
    } catch (e) {
      console.error('Failed to load child bulletins:', e);
      setBulletins([]);
    }

    // Load payments
    try {
      const paymentsData = await apiFetch(`/paiements?eleveId=${childId}`);
      setPayments(paymentsData);
    } catch (e) {
      console.error('Failed to load child payments:', e);
      setPayments([]);
    }

    // Load timetable
    try {
      const timetableData = classId ? await apiFetch(`/emplois-du-temps/classe/${classId}`) : [];
      setTimetable(timetableData);
    } catch (e) {
      console.error('Failed to load child timetable:', e);
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

  const handleSignParent = async (bulletinId) => {
    try {
      await apiFetch(`/bulletins/${bulletinId}/sign`, {
        method: 'POST',
        body: { role: 'PARENT' }
      });
      alert(t('portal.parent.signedSuccess'));
      loadChildData(selectedChildId);
    } catch (e) {
      alert(e.message || 'Erreur lors de la signature');
    }
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    if (!payAmount || isNaN(parseFloat(payAmount)) || parseFloat(payAmount) <= 0) {
      alert('Veuillez entrer un montant valide.');
      return;
    }
    setPaying(true);
    try {
      await apiFetch('/paiements/simulate', {
        method: 'POST',
        body: {
          event: 'payment.success',
          studentId: selectedChildId,
          amount: parseFloat(payAmount),
          reference: `MOM-${Date.now()}`,
          method: payMethod,
          phone: payPhone,
          remarks: 'Paiement mobile parents via portail'
        }
      });

      setPaySuccess(true);
      setTimeout(() => {
        setPaySuccess(false);
        setPayModalOpen(false);
        // Refresh metrics
        loadChildData(selectedChildId);
      }, 2000);
    } catch (err) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading parent portal...</div>;
  }

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="space-y-6">
      {/* Child Selector Tabs & Messages */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 justify-between">
        <div className="flex gap-2">
          {children.length > 0 ? (
            children.map(child => (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChildId(child.id);
                  setActiveView('children');
                }}
                className={`px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                  activeView === 'children' && selectedChildId === child.id
                    ? 'border-[#1E3A5F] text-[#1E3A5F] bg-slate-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {child.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 text-sm font-bold text-slate-400">{t('portal.parent.noChildrenLinked')}</div>
          )}
        </div>
        <button
          onClick={() => setActiveView('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeView === 'messages'
              ? 'border-amber-400 text-[#1E3A5F] bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="h-4 w-4" />
          Messagerie
        </button>
      </div>

      {activeView === 'messages' ? (
        <MessageInbox />
      ) : children.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-3 mt-10">
          <GraduationCap className="h-12 w-12 text-[#1E3A5F] mx-auto opacity-50" />
          <h3 className="font-bold text-[#1E3A5F]">Aucun élève lié</h3>
          <p className="text-xs text-slate-500">
            Contactez l'administration de l'école pour lier votre numéro de téléphone au dossier de votre enfant.
          </p>
        </div>
      ) : (
        <>
          {/* Selected Child Large Header */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A5288] rounded-2xl p-6 md:p-8 shadow-lg text-white mb-6 flex items-center gap-4">
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-1">Dossier Scolaire de</p>
              <h1 className="text-3xl md:text-4xl font-black font-outfit text-white tracking-tight">{selectedChild?.name}</h1>
              <p className="text-blue-50 text-sm mt-1 font-semibold opacity-90">
                Matricule: {selectedChild?.matricule} • Classe: {selectedChild?.class?.name || 'Non assignée'}
              </p>
            </div>
          </div>

          {/* Grid: Grades & Bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sequence Grades */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
            <h3 className="font-bold text-[#1E3A5F] font-outfit">Latest Evaluation Grades</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Sequence</th>
                  <th className="px-4 py-3 text-center">Grade / 20</th>
                  <th className="px-4 py-3">Behavior / Comportement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-slate-400">No grades registered yet.</td>
                  </tr>
                ) : (
                  grades.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-800">{g.matiere?.nameFr}</td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{g.sequence?.name}</td>
                      <td className={`px-4 py-3 text-center font-black text-sm ${g.value >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {g.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">
                        {g.remarks ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-[#1E3A5F]">
                            {g.remarks}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Cards (Bulletins) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-[#1E3A5F]" />
            <h3 className="font-bold text-[#1E3A5F] font-outfit">Report Cards</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {bulletins.length === 0 ? (
              <p className="text-slate-450 text-xs text-center py-10">No report cards generated yet.</p>
            ) : (
              bulletins.map(b => (
                <div key={b.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-amber-300 transition-colors">
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-slate-800">{b.sequence?.name || 'Term Card'}</p>
                    <p className="font-black text-[#1E3A5F] text-sm mt-0.5">{b.average.toFixed(2)} / 20</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Rank: {b.rank}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!b.signedParent ? (
                      <button
                        onClick={() => handleSignParent(b.id)}
                        className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-[#1E3A5F] text-[10px] font-extrabold rounded-lg transition-colors flex items-center gap-0.5 shadow-sm"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Signer</span>
                      </button>
                    ) : (
                      <span className="text-[9px] text-emerald-600 font-black bg-emerald-50 px-2 py-1 border border-emerald-200 rounded-lg uppercase tracking-wide">✓ Signé</span>
                    )}
                    <a
                      href={`http://localhost:5000/api/bulletins/${b.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#1E3A5F] text-[#F5A623] hover:bg-[#152943] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tuition Payments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#1E3A5F]" />
            <h3 className="font-bold text-[#1E3A5F] font-outfit">Tuition & Payments</h3>
          </div>
          <button
            onClick={() => setPayModalOpen(true)}
            className="flex items-center gap-1.5 px-4.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-350 hover:to-amber-450 text-[#1E3A5F] font-extrabold rounded-xl text-xs shadow-md transition-all transform hover:scale-[1.01]"
          >
            <Wallet className="h-4 w-4" />
            <span>Pay Tuition Now</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
            <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Total Tuition</span>
            <span className="text-base font-black text-slate-800">150,000 {currency}</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
            <span className="text-emerald-600 block uppercase font-bold text-[10px] tracking-wider mb-1">Amount Paid</span>
            <span className="text-base font-black text-emerald-700">
              {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} {currency}
            </span>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl">
            <span className="text-rose-600 block uppercase font-bold text-[10px] tracking-wider mb-1">Remaining Balance</span>
            <span className="text-base font-black text-rose-700">
              {(150000 - payments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()} {currency}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount ({currency})</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-500">{p.transactionReference || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-800">{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse'
                      }`}>
                        {p.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Child Class Timetable */}
      {selectedChild?.classId && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="h-5 w-5 text-[#1E3A5F]" />
            <h3 className="font-bold text-[#1E3A5F] font-outfit">Class Timetable</h3>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden divide-x divide-slate-200 bg-slate-50 text-xs">
              <div className="p-3 text-center font-bold text-slate-500 bg-slate-50 uppercase flex items-center justify-center">Heures</div>
              {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(d => (
                <div key={d} className="p-3 text-center font-bold text-[#1E3A5F] bg-slate-100 uppercase tracking-wider">{t(`timetable.days.${d}`)}</div>
              ))}

              {creneaux.map((slot) => (
                <React.Fragment key={slot.id}>
                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex flex-col justify-center items-center text-center">
                    <span className="font-bold text-[#1E3A5F]">{slot.startTime} - {slot.endTime}</span>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase">{slot.label}</span>
                  </div>

                  {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(day => {
                    const session = timetable.find(s => s.dayOfWeek === day && s.creneauId === slot.id);
                    const isPause = slot.label === 'PAUSE';

                    return (
                      <div key={day} className={`p-2 border-t border-slate-200 min-h-[70px] flex flex-col justify-center ${isPause ? 'bg-slate-100/50' : 'bg-white'}`}>
                        {isPause ? (
                          <div className="text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">PAUSE</div>
                        ) : session ? (
                          <div className="p-1.5 rounded-lg bg-blue-50/80 border border-blue-150 text-[10px] text-blue-900 leading-normal">
                            <p className="font-black text-[#1E3A5F]">{session.matiere?.nameFr}</p>
                            <p className="text-slate-500 font-bold">{session.teacher?.name}</p>
                            {session.room && <p className="text-[9px] text-slate-400 mt-0.5">Room: {session.room}</p>}
                          </div>
                        ) : (
                          <div className="text-center text-slate-300">-</div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Money Payment Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1E3A5F] font-outfit">Paiement Mobile Money</h3>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handlePayNow} className="p-6 space-y-4">
              {paySuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 animate-bounce">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-[#1E3A5F]">Paiement Validé avec succès !</h4>
                  <p className="text-xs text-slate-500">Un SMS de confirmation a été envoyé sur votre téléphone mobile.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Élève concerné</label>
                    <input
                      type="text"
                      disabled
                      value={selectedChild?.name || ''}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Opérateur</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800"
                      >
                        <option value="MTN_MOMO">MTN MoMo 🟡</option>
                        <option value="ORANGE_MONEY">Orange Money 🟠</option>
                        <option value="WAVE">Wave 🔵</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Montant ({currency})</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-bold text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Numéro de téléphone</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={payPhone}
                        onChange={(e) => setPayPhone(e.target.value)}
                        placeholder="ex: +237670000001"
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPayModalOpen(false)}
                      className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={paying}
                      className="flex-1 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                    >
                      {paying ? 'Traitement...' : 'Payer la scolarité'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
