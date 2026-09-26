import React, { useState } from 'react';
import { CheckCheck, Copy, Check } from 'lucide-react';
import type { Message } from '../../types/chat';
import { RichContent } from './RichContent';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  senderColor?: string;
  searchQuery?: string;
  showSenderName: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isCurrentUser,
  isFirstInGroup,
  senderColor,
  searchQuery,
  showSenderName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Pure emoji styling (no bubble background, just raw jumbo emojis)
  if (message.isPureEmoji) {
    return (
      <div className={`flex w-full my-1.5 px-3 sm:px-6 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <div className="group relative flex flex-col items-end">
          {showSenderName && !isCurrentUser && (
            <span
              className="text-[11px] font-semibold mb-0.5 px-1 tracking-wide"
              style={{ color: senderColor || '#00a884' }}
            >
              {message.sender}
            </span>
          )}
          <RichContent content={message.content} isPureEmoji={true} />
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 select-none opacity-80">
            <span>{message.timeStr}</span>
            {isCurrentUser && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex w-full my-0.5 px-2 sm:px-6 ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`relative max-w-[88%] sm:max-w-[70%] md:max-w-[62%] px-3.5 py-2 transition-all duration-150 select-text shadow-md backdrop-blur-md ${
          isCurrentUser
            ? 'cl-bubble-out rounded-2xl rounded-tr-sm'
            : 'cl-bubble-in rounded-2xl rounded-tl-sm'
        } ${!isFirstInGroup && isCurrentUser ? 'rounded-tr-2xl' : ''} ${
          !isFirstInGroup && !isCurrentUser ? 'rounded-tl-2xl' : ''
        }`}
      >
        {/* Quick action copy button on hover / active */}
        <button
          onClick={handleCopy}
          title="Copy message"
          className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-full bg-slate-950/80 border border-white/20 text-slate-300 hover:text-white shadow-lg z-10"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>

        {/* Sender Name in group conversations */}
        {showSenderName && !isCurrentUser && isFirstInGroup && (
          <div
            className="text-[12px] font-bold tracking-wide mb-1 select-none"
            style={{ color: senderColor || '#25d366' }}
          >
            {message.sender}
          </div>
        )}

        {/* Main Content & Flowing Timestamp */}
        <div className="flex flex-col">
          <div className="min-w-0 break-words">
            <RichContent
              content={message.content}
              searchQuery={searchQuery}
            />
          </div>

          {/* Timestamp & Read Ticks - Guaranteed never to overlap text or code */}
          <div className="flex items-center justify-end gap-1 mt-1 pt-0.5 ml-auto text-[10.5px] tracking-tight cl-time-text select-none font-mono">
            <span>{message.timeStr}</span>
            {isCurrentUser && (
              <CheckCheck className="w-3.5 h-3.5 text-sky-400/90 -mr-0.5 shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
