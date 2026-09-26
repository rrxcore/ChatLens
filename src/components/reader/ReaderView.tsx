import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Message, Participant } from '../../types/chat';
import { formatFriendlyDate, isSameDay } from '../../parser/dateUtils';
import { RichContent } from '../chat/RichContent';
import { BookOpen } from 'lucide-react';

interface ReaderViewProps {
  messages: Message[];
  participants: Participant[];
  currentUser: string | null;
  searchQuery?: string;
}

type ReaderStreamItem =
  | { type: 'header'; key: string }
  | { type: 'date'; date: Date; key: string }
  | { type: 'msg'; msgIndex: number; key: string };

export const ReaderView: React.FC<ReaderViewProps> = ({
  messages,
  participants,
  currentUser,
  searchQuery,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach(p => map.set(p.name, p.color));
    return map;
  }, [participants]);

  // Build lightweight virtual stream items
  const streamItems = useMemo<ReaderStreamItem[]>(() => {
    const items: ReaderStreamItem[] = [
      { type: 'header', key: 'reader-top-header' },
    ];
    let lastDate: Date | null = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = msg.timestamp;

      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({
          type: 'date',
          date: msgDate,
          key: `r-date-${msg.dateStr}-${i}`,
        });
        lastDate = msgDate;
      }

      items.push({
        type: 'msg',
        msgIndex: i,
        key: `r-msg-${msg.id}`,
      });
    }

    return items;
  }, [messages]);

  const virtualizer = useVirtualizer({
    count: streamItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="flex-1 w-full h-full overflow-y-auto overscroll-contain px-2 sm:px-6 py-4 select-text"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="max-w-3xl mx-auto relative w-full pb-16"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map(virtualRow => {
          const item = streamItems[virtualRow.index];
          if (!item) return null;

          if (item.type === 'header') {
            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full pb-4 mb-4 border-b border-white/10 select-none flex items-center justify-between"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm font-semibold tracking-wide uppercase">Reader Mode</span>
                </div>
                <span className="text-xs text-slate-400">
                  {messages.length.toLocaleString()} messages formatted for reading
                </span>
              </div>
            );
          }

          if (item.type === 'date') {
            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full flex justify-center py-3 select-none"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <span className="px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ios-glass-subtle bg-black/60 text-slate-300 border border-white/10 shadow-md">
                  {formatFriendlyDate(item.date)}
                </span>
              </div>
            );
          }

          const msg = messages[item.msgIndex];
          if (!msg) return null;

          if (msg.isSystem) {
            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full py-1 text-center text-xs text-slate-400/80 italic select-none"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                — {msg.content} —
              </div>
            );
          }

          const isMe = msg.sender === currentUser;
          const senderColor = colorMap.get(msg.sender) || '#25d366';

          return (
            <div
              key={item.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full py-1"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div
                className={`flex flex-col sm:flex-row gap-1 sm:gap-4 p-2.5 rounded-xl transition-colors duration-150 ${
                  isMe ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-white/5'
                }`}
              >
                {/* Left margin: Sender & Time */}
                <div className="sm:w-36 shrink-0 flex items-center sm:items-start justify-between sm:justify-start sm:flex-col gap-1 select-none">
                  <span
                    className="text-xs font-bold tracking-tight truncate max-w-[150px]"
                    style={{ color: senderColor }}
                  >
                    {msg.sender} {isMe && '(You)'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400/70">
                    {msg.timeStr}
                  </span>
                </div>

                {/* Right column: Content */}
                <div className="flex-1 text-slate-200">
                  <RichContent
                    content={msg.content}
                    isPureEmoji={msg.isPureEmoji}
                    searchQuery={searchQuery}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
