import React from 'react';
import { Lock, Image as ImageIcon, Trash2, Info } from 'lucide-react';
import type { Message } from '../../types/chat';

interface SystemMessageProps {
  message: Message;
}

export const SystemMessage: React.FC<SystemMessageProps> = React.memo(({ message }) => {
  const isEncryption = /end-to-end encrypted/i.test(message.content);
  const isMedia = message.isMedia;
  const isDeleted = message.isDeleted;

  let Icon = Info;
  if (isEncryption) Icon = Lock;
  else if (isMedia) Icon = ImageIcon;
  else if (isDeleted) Icon = Trash2;

  return (
    <div className="flex justify-center my-3 px-4 select-none">
      <div className="inline-flex items-center gap-2 max-w-lg px-3.5 py-1.5 rounded-xl text-xs leading-relaxed text-center shadow-sm ios-glass-subtle bg-slate-900/60 text-slate-300 border border-white/10 dark:bg-black/60 dark:text-slate-300">
        <Icon className="w-3.5 h-3.5 shrink-0 text-amber-400/90" />
        <span>{message.content}</span>
      </div>
    </div>
  );
});

SystemMessage.displayName = 'SystemMessage';
