import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api';
import { Mail, MailOpen, AlertCircle, Clock, Send } from 'lucide-react';

export default function MessageInbox() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      setLoading(true);
      const [inboxData, sentData] = await Promise.all([
        apiFetch('/messages'),
        apiFetch('/messages/sent')
      ]);
      setMessages(inboxData);
      setSentMessages(sentData);
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/messages/${id}/read`, { method: 'PATCH' });
      setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-10">Chargement de la messagerie...</div>;
  }

  const currentMessages = activeTab === 'inbox' ? messages : sentMessages;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100 bg-slate-50">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'inbox' ? 'text-[#1E3A5F] border-b-2 border-[#1E3A5F] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <Mail className="h-5 w-5" />
          Boîte de réception
          {messages.filter(m => !m.isRead).length > 0 && (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">
              {messages.filter(m => !m.isRead).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'sent' ? 'text-[#1E3A5F] border-b-2 border-[#1E3A5F] bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <Send className="h-5 w-5" />
          Boîte d'envoi
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto min-h-[300px]">
        {currentMessages.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            {activeTab === 'inbox' ? (
              <Mail className="h-12 w-12 text-slate-300 mx-auto" />
            ) : (
              <Send className="h-12 w-12 text-slate-300 mx-auto" />
            )}
            <h3 className="font-bold text-slate-400">Aucun message</h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'inbox' ? 'Votre boîte de réception est vide.' : "Vous n'avez envoyé aucun message."}
            </p>
          </div>
        ) : (
          currentMessages.map(msg => (
          <div 
            key={msg.id} 
            className={`p-4 transition-colors hover:bg-slate-50 cursor-pointer ${activeTab === 'inbox' && !msg.isRead ? 'bg-blue-50/30' : ''}`}
            onClick={() => activeTab === 'inbox' && !msg.isRead && markAsRead(msg.id)}
          >
            <div className="flex gap-4">
              <div className="mt-1">
                {activeTab === 'inbox' ? (
                  !msg.isRead ? (
                    <Mail className="h-5 w-5 text-blue-600" />
                  ) : (
                    <MailOpen className="h-5 w-5 text-slate-400" />
                  )
                ) : (
                  <Send className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <p className={`text-sm ${activeTab === 'inbox' && !msg.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {msg.title || 'Message sans objet'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {activeTab === 'inbox' ? (
                    <>De : <span className="font-semibold text-slate-600">{msg.sender?.name || 'Direction'}</span></>
                  ) : (
                    <>À : <span className="font-semibold text-slate-600">{msg.receiver?.name || 'Utilisateur inconnu'}</span></>
                  )}
                </p>
                <div className="bg-white border border-slate-150 p-3 rounded-xl text-sm text-slate-700 leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
