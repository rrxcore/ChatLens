import React, { useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Message, Participant } from '../../types/chat';
import { isSameDay } from '../../parser/dateUtils';
import { MessageBubble } from './MessageBubble';
import { DateSeparator } from './DateSeparator';
import { SystemMessage } from './SystemMessage';

interface VirtualMessageListProps {
  messages: Message[];
  currentUser: string | null;
  participants: Participant[];
  searchQuery?: string;
  activeMatchMessageId?: string;
}

type StreamItem =
  | { type: 'date'; date: Date; key: string }
  | { type: 'msg'; msgIndex: number; key: string };

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  messages,
  currentUser,
  participants,
  searchQuery,
  activeMatchMessageId,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Map participant name to color
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach(p => map.set(p.name, p.color));
    return map;
  }, [participants]);

  const isGroup = participants.length > 2;

  // Ultra-lightweight stream items (only stores date separators and msg indices)
  // For 100,000+ messages this takes ~5ms and minimal RAM
  const streamItems = useMemo<StreamItem[]>(() => {
    const items: StreamItem[] = [];
    let lastDate: Date | null = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = msg.timestamp;

      // Insert date separator if date changed
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        items.push({
          type: 'date',
          date: msgDate,
          key: `d-${msg.dateStr}-${i}`,
        });
        lastDate = msgDate;
      }

      items.push({
        type: 'msg',
        msgIndex: i,
        key: msg.id,
      });
    }

    return items;
  }, [messages]);

  // Virtualizer tuned for high throughput
  const virtualizer = useVirtualizer({
    count: streamItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 6, // Low overscan to minimize DOM mutations during fast scroll
  });

  // Jump to active search match
  useEffect(() => {
    if (!activeMatchMessageId) return;

    const targetIndex = streamItems.findIndex(
      item => item.type === 'msg' && item.key === activeMatchMessageId
    );

    if (targetIndex !== -1) {
      // Use instant jump for far jumps (>35 items) to prevent smooth-scroll freeze
      const currentScroll = virtualizer.scrollOffset || 0;
      const estimatedTarget = targetIndex * 58;
      const isFar = Math.abs(currentScroll - estimatedTarget) > 1800;
      virtualizer.scrollToIndex(targetIndex, {
        align: 'center',
        behavior: isFar ? 'auto' : 'smooth',
      });
    }
  }, [activeMatchMessageId, streamItems, virtualizer]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 select-none p-6 text-center">
        <p className="text-lg font-medium">No messages found</p>
        <p className="text-sm opacity-75 mt-1">Try clearing your search query or filters.</p>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="flex-1 w-full h-full overflow-y-auto overscroll-contain px-0 sm:px-4 py-4 focus:outline-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="w-full relative max-w-4xl mx-auto"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map(virtualRow => {
          const item = streamItems[virtualRow.index];
          if (!item) return null;

          if (item.type === 'date') {
            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <DateSeparator date={item.date} />
              </div>
            );
          }

          const msgIdx = item.msgIndex;
          const msg = messages[msgIdx];
          if (!msg) return null;

          // Lazy burst computation computed ONLY for the ~15 visible rows
          const prevMsg = msgIdx > 0 ? messages[msgIdx - 1] : null;
          const nextMsg = msgIdx < messages.length - 1 ? messages[msgIdx + 1] : null;

          const isFirstInGroup =
            !prevMsg ||
            prevMsg.sender !== msg.sender ||
            prevMsg.isSystem !== msg.isSystem ||
            !isSameDay(prevMsg.timestamp, msg.timestamp);

          const isLastInGroup =
            !nextMsg ||
            nextMsg.sender !== msg.sender ||
            nextMsg.isSystem !== msg.isSystem ||
            !isSameDay(nextMsg.timestamp, msg.timestamp);

          const isCurrentUser = msg.sender === currentUser;
          const senderColor = colorMap.get(msg.sender);

          return (
            <div
              key={item.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {msg.isSystem ? (
                <SystemMessage message={msg} />
              ) : (
                <MessageBubble
                  message={msg}
                  isCurrentUser={isCurrentUser}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  senderColor={senderColor}
                  showSenderName={isGroup}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
