import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../api';

export default function SendMessageModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filters
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRecipients();
      setTitle('');
      setContent('');
      setSelectedRecipientIds([]);
      setSelectAll(false);
      setSelectedRoleFilter('');
      setSelectedClassFilter('');
    }
  }, [isOpen]);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/messages/recipients');
      setRecipients(data);
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipient = (id) => {
    if (selectedRecipientIds.includes(id)) {
      setSelectedRecipientIds(selectedRecipientIds.filter(rId => rId !== id));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedRecipientIds, id];
      setSelectedRecipientIds(newSelected);
      if (newSelected.length === filteredRecipients.length) {
        setSelectAll(true);
      }
    }
  };

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      const idsToAdd = filteredRecipients.map(r => r.id);
      setSelectedRecipientIds([...new Set([...selectedRecipientIds, ...idsToAdd])]);
    } else {
      const visibleIds = filteredRecipients.map(r => r.id);
      setSelectedRecipientIds(selectedRecipientIds.filter(id => !visibleIds.includes(id)));
    }
  };

  const filteredRecipients = recipients.filter(r => {
    if (selectedRoleFilter && r.role !== selectedRoleFilter) return false;
    if (selectedClassFilter && (r.role === 'STUDENT' || r.role === 'PARENT')) {
      const hasClass = r.classes && r.classes.some(c => c.id === selectedClassFilter);
      if (!hasClass) return false;
    }
    return true;
  });

  const availableClasses = React.useMemo(() => {
    const classMap = new Map();
    recipients.forEach(r => {
      if ((selectedRoleFilter === 'STUDENT' || selectedRoleFilter === 'PARENT' || !selectedRoleFilter) && r.classes) {
        r.classes.forEach(c => {
          classMap.set(c.id, c);
        });
      }
    });
    return Array.from(classMap.values());
  }, [recipients, selectedRoleFilter]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (selectedRecipientIds.length === 0 || !title || !content) {
      alert("Veuillez sélectionner au moins un destinataire et remplir le sujet et le message.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: {
          receiverIds: selectedRecipientIds,
          title,
          content
        }
      });
      alert('Message(s) envoyé(s) avec succès !');
      onClose();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#1E3A5F]" />
            <h3 className="font-bold text-[#1E3A5F]">{t('messages.newMessage')}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Chargement des destinataires...</div>
          ) : recipients.length === 0 ? (
            <div className="bg-amber-50 text-amber-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">Aucun destinataire éligible trouvé.</span>
            </div>
          ) : (
            <form id="sendMessageForm" onSubmit={handleSend} className="space-y-4">
              
              {/* Recipients Selection */}
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                      value={selectedRoleFilter}
                      onChange={(e) => {
                        setSelectedRoleFilter(e.target.value);
                        setSelectedClassFilter('');
                      }}
                      className="px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                    >
                      <option value="">Tous les rôles</option>
                      {Array.from(new Set(recipients.map(r => r.role))).map(role => {
                        const roleLabels = {
                          'DIRECTOR': 'Direction',
                          'CENSEUR': 'Censeur',
                          'INTENDANT': 'Intendance',
                          'SURVEILLANT': 'Surveillant',
                          'TEACHER': 'Enseignant',
                          'STUDENT': 'Élève',
                          'PARENT': 'Parent'
                        };
                        return <option key={role} value={role}>{roleLabels[role] || role}</option>;
                      })}
                    </select>

                    {(selectedRoleFilter === 'STUDENT' || selectedRoleFilter === 'PARENT') && availableClasses.length > 0 && (
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                      >
                        <option value="">Toutes les classes</option>
                        {availableClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {selectedRecipientIds.length} sélectionné(s)
                    </span>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filteredRecipients.length > 0 && filteredRecipients.every(r => selectedRecipientIds.includes(r.id))}
                        onChange={handleSelectAll}
                        className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"
                      />
                      {t('messages.selectAll')}
                    </label>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredRecipients.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-6 text-slate-500 text-sm">
                      Aucun destinataire ne correspond aux filtres.
                    </div>
                  ) : null}
                  {filteredRecipients.map(r => {
                    const roleLabels = {
                      'DIRECTOR': 'Direction',
                      'CENSEUR': 'Censeur',
                      'INTENDANT': 'Intendance',
                      'SURVEILLANT': 'Surveillant',
                      'TEACHER': 'Enseignant',
                      'STUDENT': 'Élève',
                      'PARENT': 'Parent'
                    };
                    const roleColor = {
                      'DIRECTOR': 'bg-rose-100 text-rose-700',
                      'CENSEUR': 'bg-purple-100 text-purple-700',
                      'INTENDANT': 'bg-emerald-100 text-emerald-700',
                      'SURVEILLANT': 'bg-indigo-100 text-indigo-700',
                      'TEACHER': 'bg-blue-100 text-blue-700',
                      'STUDENT': 'bg-amber-100 text-amber-700',
                      'PARENT': 'bg-slate-200 text-slate-700'
                    };
                    
                    return (
                      <label key={r.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                        <input
                          type="checkbox"
                          checked={selectedRecipientIds.includes(r.id)}
                          onChange={() => handleSelectRecipient(r.id)}
                          className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F] mt-0.5"
                        />
                        <div className="flex flex-col overflow-hidden flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700 truncate">{r.name}</span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${roleColor[r.role] || 'bg-slate-100 text-slate-500'}`}>
                              {roleLabels[r.role] || r.role}
                            </span>
                          </div>
                          {r.classes && r.classes.length > 0 && (
                            <span className="text-xs text-slate-500 truncate mt-0.5">
                              {r.classes.map(c => c.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Sujet du Message
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Avis de réunion, Rappel de paiement..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none font-bold"
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contenu du Message
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bonjour, nous vous informons que..."
                  rows="5"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent focus:outline-none resize-none"
                ></textarea>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="sendMessageForm"
            disabled={saving || recipients.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-[#F5A623] rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
          >
            {saving ? (
              <span>Envoi en cours...</span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Envoyer le Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
