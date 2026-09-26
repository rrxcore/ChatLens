import React from 'react';
import { UserCheck, X } from 'lucide-react';
import type { Participant } from '../../types/chat';

interface ParticipantModalProps {
  isOpen: boolean;
  participants: Participant[];
  currentSelected: string | null;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  participants,
  currentSelected,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-md p-6 rounded-3xl ios-glass bg-slate-900/90 text-slate-100 border border-white/15 shadow-2xl dark:bg-black/95 dark:border-white/20 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-emerald-400">
            <UserCheck className="w-5 h-5" />
            <h3 className="font-bold text-base">Who are you in this chat?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-3 mb-4 leading-relaxed">
          Select your name so your messages appear on the <strong>right side</strong> in classic WhatsApp style.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {participants.map(p => {
            const isMe = p.name === currentSelected;

            return (
              <button
                key={p.name}
                onClick={() => {
                  onSelect(p.name);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  isMe
                    ? 'bg-emerald-500/25 border-emerald-500/50 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="font-semibold text-sm truncate">{p.name}</span>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {p.messageCount} msgs
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
          >
            Keep Default
          </button>
        </div>
      </div>
    </div>
  );
};
