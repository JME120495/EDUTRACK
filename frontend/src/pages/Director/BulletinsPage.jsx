import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { FileText, Send, CheckCircle, RefreshCw, Award, Lock } from 'lucide-react';

export default function BulletinsPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const isDirector = user?.role === 'DIRECTOR';
  
  const [classes, setClasses] = useState([]);
  const [sequences, setSequences] = useState([]);
  
  // Selection state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSequenceId, setSelectedSequenceId] = useState('');
  
  // Data state
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(null);
  const [signing, setSigning] = useState(null);
  const [sendingClassWhatsapp, setSendingClassWhatsapp] = useState(false);

  useEffect(() => {
    loadSelectors();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedSequenceId) {
      loadBulletins(selectedClassId, selectedSequenceId);
    }
  }, [selectedClassId, selectedSequenceId]);

  async function loadSelectors() {
    try {
      const [classesData, sequencesData] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/sequences')
      ]);
      setClasses(classesData);
      setSequences(sequencesData);

      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
      if (sequencesData.length > 0) setSelectedSequenceId(sequencesData[0].id);
    } catch (e) {
      console.error('Failed to load selectors:', e);
    }
  }

  async function loadBulletins(classId, sequenceId) {
    try {
      setLoading(true);
      const data = await apiFetch(`/bulletins?classId=${classId}&sequenceId=${sequenceId}`);
      setBulletins(data);
    } catch (e) {
      console.error('Failed to load bulletins:', e);
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateBulletins = async () => {
    setGenerating(true);
    try {
      await apiFetch('/bulletins/generate', {
        method: 'POST',
        body: {
          classId: selectedClassId,
          sequenceId: selectedSequenceId
        }
      });
      alert('Report cards generated successfully!');
      loadBulletins(selectedClassId, selectedSequenceId);
    } catch (e) {
      alert(e.message || 'Failed to generate bulletins. Make sure all grades are validated & locked first!');
    } finally {
      setGenerating(false);
    }
  };

  const handleSign = async (bulletinId, role) => {
    setSigning(bulletinId);
    try {
      await apiFetch(`/bulletins/${bulletinId}/sign`, {
        method: 'POST',
        body: { role } // 'DIRECTOR' or 'TEACHER'
      });
      setBulletins(bulletins.map(b => b.id === bulletinId ? { ...b, [`signed${role.charAt(0) + role.slice(1).toLowerCase()}`]: true } : b));
    } catch (e) {
      alert(e.message || 'Failed to sign bulletin');
    } finally {
      setSigning(null);
    }
  };

  const handleSendWhatsapp = async (bulletinId, parentPhone, studentName) => {
    if (!parentPhone) {
      alert('No parent phone number registered for this student.');
      return;
    }
    setSendingWhatsapp(bulletinId);
    try {
      await apiFetch('/bulletins/send-whatsapp', {
        method: 'POST',
        body: {
          bulletinIds: [bulletinId]
        }
      });
      alert('Report card notification sent to parent via WhatsApp!');
    } catch (e) {
      alert(e.message || 'Failed to send WhatsApp notification');
    } finally {
      setSendingWhatsapp(null);
    }
  };

  const handleSendClassWhatsapp = async () => {
    if (bulletins.length === 0) return;
    const bulletinIds = bulletins.map(b => b.id);
    if (!window.confirm(`Voulez-vous envoyer les bulletins de cette classe (${bulletins.length} élèves) aux parents via WhatsApp ?`)) return;
    
    setSendingClassWhatsapp(true);
    try {
      const result = await apiFetch('/bulletins/send-whatsapp', {
        method: 'POST',
        body: { bulletinIds }
      });
      alert(`Envoi groupé WhatsApp terminé !\nEnvoyés avec succès : ${result.sentCount}\nÉchecs : ${result.failedCount}`);
    } catch (e) {
      alert(e.message || 'Échec de l\'envoi groupé');
    } finally {
      setSendingClassWhatsapp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E3A5F] font-outfit">
            {t('bulletins.title')}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Calculate class rankings and distribute bilingual PDFs to parents
          </p>
        </div>

        {isDirector && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handleGenerateBulletins}
              disabled={generating || !selectedClassId || !selectedSequenceId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{t('bulletins.generateSeq')}</span>
            </button>

            <button
              onClick={handleSendClassWhatsapp}
              disabled={sendingClassWhatsapp || bulletins.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-650 hover:bg-emerald-750 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
            >
              <Send className={`h-4.5 w-4.5 ${sendingClassWhatsapp ? 'animate-spin' : ''}`} />
              <span>Envoyer toute la classe (WhatsApp)</span>
            </button>
          </div>
        )}
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sequence</label>
          <select
            value={selectedSequenceId}
            onChange={(e) => setSelectedSequenceId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition-all"
          >
            {sequences.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulletins Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading bulletins list...</div>
        ) : bulletins.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <p>No report cards generated for this selection yet.</p>
            <p className="text-xs">Click "Generate Sequence Report Cards" above to calculate averages and ranks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{t('bulletins.table.student')}</th>
                  <th className="px-6 py-4">{t('bulletins.table.average')}</th>
                  <th className="px-6 py-4">{t('bulletins.table.rank')}</th>
                  <th className="px-6 py-4">Signatures</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulletins.map(b => {
                  const studentName = b.eleve?.name || 'N/A';
                  const parentPhone = b.eleve?.parents?.[0]?.parent?.phone || null;
                  
                  // Color code the averages
                  let avgColor = 'text-rose-600';
                  if (b.average >= 14) avgColor = 'text-emerald-600';
                  else if (b.average >= 10) avgColor = 'text-amber-600';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{studentName}</td>
                      <td className={`px-6 py-4 font-black font-outfit text-sm ${avgColor}`}>
                        {b.average.toFixed(2)} / 20
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-amber-500" />
                          <span>{b.rank}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <span className={`h-2 w-2 rounded-full ${b.signedTeacher ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="font-semibold text-slate-500">Teacher</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={`h-2 w-2 rounded-full ${b.signedDirector ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="font-semibold text-slate-500">Director</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                        {/* Sign Button */}
                        {user?.role === 'DIRECTOR' && !b.signedDirector && (
                          <button
                            onClick={() => handleSign(b.id, 'DIRECTOR')}
                            disabled={signing === b.id}
                            className="px-2.5 py-1.5 bg-[#F5A623] hover:bg-amber-500 text-[#1E3A5F] rounded-lg text-xs font-extrabold transition-all border border-amber-300 flex items-center gap-1 shadow-sm"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Sign (Director)</span>
                          </button>
                        )}
                        {user?.role === 'TEACHER' && !b.signedTeacher && (
                          <button
                            onClick={() => handleSign(b.id, 'TEACHER')}
                            disabled={signing === b.id}
                            className="px-2.5 py-1.5 bg-[#F5A623] hover:bg-amber-500 text-[#1E3A5F] rounded-lg text-xs font-extrabold transition-all border border-amber-300 flex items-center gap-1 shadow-sm"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Sign (Teacher)</span>
                          </button>
                        )}

                        {/* PDF Download */}
                        <a
                          href={`http://localhost:5000/api/bulletins/${b.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center"
                          title={t('bulletins.table.pdf')}
                        >
                          <FileText className="h-4 w-4" />
                        </a>

                        {/* WhatsApp Send */}
                        <button
                          onClick={() => handleSendWhatsapp(b.id, parentPhone, studentName)}
                          disabled={sendingWhatsapp === b.id}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center"
                          title={t('bulletins.table.whatsapp')}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
