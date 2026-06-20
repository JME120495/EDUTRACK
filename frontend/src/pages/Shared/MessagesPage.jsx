import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInbox from '../../components/MessageInbox';
import SendMessageModal from '../../components/Shared/SendMessageModal';
import { MailPlus } from 'lucide-react';

export default function MessagesPage() {
  const { t } = useTranslation();
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-[#1E3A5F] to-[#2A5288] p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold font-outfit tracking-tight">{t('messages.title')}</h1>
          <p className="text-white/80 text-sm mt-1 font-medium"></p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setComposeModalOpen(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-[#1E3A5F] px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
          >
            <MailPlus className="h-5 w-5" />
            {t('messages.newMessage')}
          </button>
        </div>
      </div>

      <div className="w-full">
        <MessageInbox />
      </div>

      <SendMessageModal 
        isOpen={composeModalOpen} 
        onClose={() => setComposeModalOpen(false)} 
      />
    </div>
  );
}
