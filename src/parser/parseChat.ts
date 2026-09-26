import type { ChatSession, Message, Participant } from '../types/chat';
import {
  ANDROID_HEADER_REGEX,
  IOS_HEADER_REGEX,
  MEDIA_PATTERNS,
  SYSTEM_PATTERNS,
  URL_REGEX,
  isPureEmoji,
} from './regexPatterns';
import { getParticipantColor, parseWhatsAppDate } from './dateUtils';

export function parseWhatsAppChat(rawText: string, fileName: string = 'WhatsApp Chat.txt'): ChatSession {
  // Pre-process text to support .md (Markdown) files cleanly
  let cleanedText = rawText;

  // 1. Remove YAML frontmatter if present (e.g., --- \n title: ... \n ---)
  cleanedText = cleanedText.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]+/, '');

  // 2. Extract potential markdown title ONLY from top header before messages start
  let extractedTitle: string | null = null;
  const initialLines = cleanedText.split(/\r?\n/).slice(0, 10);
  for (const rawL of initialLines) {
    const l = rawL.trim();
    if (!l) continue;
    // If a message timestamp is encountered, stop
    if (ANDROID_HEADER_REGEX.test(l) || IOS_HEADER_REGEX.test(l)) {
      break;
    }
    if (/^#+\s+/.test(l)) {
      extractedTitle = l.replace(/^#+\s+/, '').trim();
      break;
    }
  }

  const lines = cleanedText.split(/\r?\n/);
  const messages: Message[] = [];
  const participantMap = new Map<string, { messageCount: number; mediaCount: number; wordCount: number; firstDate?: Date; lastDate?: Date }>();

  let currentMsg: Message | null = null;
  let msgCounter = 0;

  function finalizeCurrentMessage() {
    if (!currentMsg) return;

    currentMsg.content = currentMsg.content.trimEnd();
    
    // Check if media
    const isMedia = MEDIA_PATTERNS.some(p => p.test(currentMsg!.content));
    currentMsg.isMedia = isMedia;
    
    // Check if pure emoji
    currentMsg.isPureEmoji = isPureEmoji(currentMsg.content);

    // Extract links
    const extractedLinks = currentMsg.content.match(URL_REGEX) || [];
    currentMsg.links = Array.from(new Set(extractedLinks));

    // Update participant stats if not system
    if (!currentMsg.isSystem && currentMsg.sender) {
      const stats = participantMap.get(currentMsg.sender) || {
        messageCount: 0,
        mediaCount: 0,
        wordCount: 0,
      };

      stats.messageCount += 1;
      if (isMedia) stats.mediaCount += 1;
      stats.wordCount += currentMsg.content.trim().split(/\s+/).filter(Boolean).length;
      if (!stats.firstDate) stats.firstDate = currentMsg.timestamp;
      stats.lastDate = currentMsg.timestamp;

      participantMap.set(currentMsg.sender, stats);
    }

    messages.push(currentMsg);
    currentMsg = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // If line is a markdown code fence like ```text or ```, skip it so it doesn't pollute the chat
    if (/^```[a-zA-Z0-9_-]*$/.test(rawLine.trim())) {
      continue;
    }

    // If line is a top-level markdown heading like # Title, skip if we haven't started messages yet
    if (/^#+\s+/.test(rawLine.trim()) && messages.length === 0 && !currentMsg) {
      continue;
    }

    // Clean invisible RTL/LTR markers and optional markdown blockquote prefix (> )
    let line = rawLine.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trimStart();
    if (line.startsWith('> ')) {
      line = line.substring(2).trimStart();
    }

    if (!line.trim() && !currentMsg) continue;

    // Check Android match first, then iOS
    let match = line.match(ANDROID_HEADER_REGEX);
    if (!match) {
      match = line.match(IOS_HEADER_REGEX);
    }

    if (match) {
      finalizeCurrentMessage();

      const dateStr = match[1];
      const timeStr = match[2];
      const remainder = match[3] || '';

      const timestamp = parseWhatsAppDate(dateStr, timeStr);

      // Check if remainder has a sender colon "Sender: message"
      const colonIdx = remainder.indexOf(': ');

      let sender = '';
      let content = '';
      let isSystem = false;

      if (colonIdx !== -1) {
        sender = remainder.substring(0, colonIdx).trim();
        content = remainder.substring(colonIdx + 2);
      } else {
        // System message (e.g. "Messages and calls are end-to-end encrypted")
        sender = '__system__';
        content = remainder.trim();
        isSystem = true;
      }

      // Check if remainder itself is a known system notification
      if (!isSystem && SYSTEM_PATTERNS.some(p => p.test(content) || p.test(remainder))) {
        if (colonIdx === -1) {
          isSystem = true;
          sender = '__system__';
        }
      }

      currentMsg = {
        id: `msg-${++msgCounter}`,
        index: msgCounter - 1,
        timestamp,
        dateStr: timestamp.toISOString().split('T')[0],
        timeStr,
        sender,
        content,
        isSystem,
        isMedia: false,
        isDeleted: /this message was deleted|you deleted this message/i.test(content),
        isPureEmoji: false,
        links: [],
      };
    } else if (currentMsg) {
      // Multiline continuation of previous message
      currentMsg.content += '\n' + rawLine;
    }
  }

  // Finalize last message
  finalizeCurrentMessage();

  // Build sorted participants list (most active first)
  const participants: Participant[] = Array.from(participantMap.entries())
    .map(([name, stats], index) => ({
      name,
      color: getParticipantColor(index),
      messageCount: stats.messageCount,
      mediaCount: stats.mediaCount,
      wordCount: stats.wordCount,
      firstMessageDate: stats.firstDate,
      lastMessageDate: stats.lastDate,
    }))
    .sort((a, b) => b.messageCount - a.messageCount);

  // Extract clean chat title from fileName, extractedTitle, or participant names
  const cleanFileName = fileName
    .replace(/\.(txt|md|markdown|zip)$/i, '')
    .replace(/^WhatsApp Chat (with|-)\s*/i, '')
    .replace(/^_chat$/i, '')
    .trim();

  let title = extractedTitle || cleanFileName;
  if (!title || /^WhatsApp Chat$/i.test(title) || /^chat$/i.test(title)) {
    if (participants.length === 2) {
      title = `${participants[0].name} & ${participants[1].name}`;
    } else if (participants.length > 2) {
      title = `${participants[0].name} + ${participants.length - 1} others`;
    } else if (participants.length === 1) {
      title = participants[0].name;
    } else {
      title = 'Conversation';
    }
  }

  const startDate = messages.length > 0 ? messages[0].timestamp : null;
  const endDate = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
  const totalMedia = messages.filter(m => m.isMedia).length;
  const totalLinks = messages.reduce((acc, m) => acc + m.links.length, 0);

  return {
    fileName,
    title,
    participants,
    currentUser: participants.length > 0 ? participants[0].name : null,
    messages,
    startDate,
    endDate,
    totalMessages: messages.length,
    totalMedia,
    totalLinks,
  };
}
