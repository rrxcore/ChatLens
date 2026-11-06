import type { ChatSession, Message, Participant } from '../types/chat';
import {
  ANDROID_HEADER_REGEX,
  IOS_HEADER_REGEX,
  MD_TIME_MSG_REGEX,
  MD_DATE_HEADING_REGEX,
  MEDIA_PATTERNS,
  SYSTEM_PATTERNS,
  URL_REGEX,
  isPureEmoji,
} from './regexPatterns';
import {
  getParticipantColor,
  parseWhatsAppDate,
  parseHeadingDate,
  detectDateFormat,
  toLocalDateString,
} from './dateUtils';

export function parseWhatsAppChat(rawText: string, fileName: string = 'WhatsApp Chat.txt'): ChatSession {
  // Pre-process text to support .md (Markdown) files cleanly
  let cleanedText = rawText;

  // 1. Remove YAML frontmatter if present (e.g., --- \n title: ... \n ---)
  cleanedText = cleanedText.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]*/, '');

  // 2. Extract potential markdown title from top header
  let extractedTitle: string | null = null;
  const initialLines = cleanedText.split(/\r?\n/).slice(0, 15);
  for (const rawL of initialLines) {
    const l = rawL.trim();
    if (!l) continue;
    if (ANDROID_HEADER_REGEX.test(l) || IOS_HEADER_REGEX.test(l) || MD_TIME_MSG_REGEX.test(l)) {
      break;
    }
    if (/^#+\s+/.test(l)) {
      if (parseHeadingDate(l)) break;
      const t = l.replace(/^#+\s+/, '').replace(/^WhatsApp Chat Export:\s*/i, '').trim();
      if (t) {
        extractedTitle = t;
        break;
      }
    }
  }

  // 3. Detect global date format (DMY vs MDY vs YMD)
  const dateFormat = detectDateFormat(cleanedText);

  const lines = cleanedText.split(/\r?\n/);
  const messages: Message[] = [];
  const participantMap = new Map<string, { messageCount: number; mediaCount: number; wordCount: number; firstDate?: Date; lastDate?: Date }>();

  let currentSectionDate: Date | null = null;
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

    // If line is a markdown code fence like ```text or ```, skip it
    if (/^```[a-zA-Z0-9_-]*$/.test(rawLine.trim())) {
      continue;
    }

    // Clean invisible directional marks
    const line = rawLine.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trimStart();

    // Skip empty lines before the first message
    if (!line.trim() && !currentMsg) continue;

    // Check if this is a Date Heading (e.g., "## June 15, 2026", "## 15/06/2026")
    if (MD_DATE_HEADING_REGEX.test(line)) {
      const headingDate = parseHeadingDate(line);
      if (headingDate) {
        finalizeCurrentMessage();
        currentSectionDate = headingDate;
        continue;
      }
    }

    // Check Android match first, then iOS
    let match = line.match(ANDROID_HEADER_REGEX) || line.match(IOS_HEADER_REGEX);
    // If not standard match, check markdown time-only message if under a date heading
    let mdMatch = !match && currentSectionDate ? line.match(MD_TIME_MSG_REGEX) : null;

    if (match) {
      finalizeCurrentMessage();

      const dateStr = match[1];
      const timeStr = match[2];
      const remainder = match[3] || '';

      const timestamp = parseWhatsAppDate(dateStr, timeStr, dateFormat);
      currentSectionDate = timestamp;

      let sender = '';
      let content = '';
      let isSystem = false;

      const senderMatch = remainder.match(/^(?:\*\*([^*]+?):\*\*|\*\*([^*]+?)\*\*:\s*|__([^_]+?):__|__([^_]+?)__:\s*|([^:\[\]\n]+?):\s*)(.*)$/);

      if (senderMatch) {
        sender = (senderMatch[1] || senderMatch[2] || senderMatch[3] || senderMatch[4] || senderMatch[5] || '').trim();
        content = senderMatch[6].replace(/^\s/, '');
      } else {
        sender = '__system__';
        content = remainder.replace(/^[-–—]\s*/, '').trim();
        isSystem = true;
      }

      if (!isSystem && SYSTEM_PATTERNS.some(p => p.test(content) || p.test(remainder))) {
        if (!senderMatch) {
          isSystem = true;
          sender = '__system__';
        }
      }

      currentMsg = {
        id: `msg-${++msgCounter}`,
        index: msgCounter - 1,
        timestamp,
        dateStr: toLocalDateString(timestamp),
        timeStr: timeStr.trim().replace(/\u202f/g, ' '),
        sender,
        content,
        isSystem,
        isMedia: false,
        isDeleted: /this message was deleted|you deleted this message/i.test(content),
        isPureEmoji: false,
        links: [],
      };
    } else if (mdMatch) {
      finalizeCurrentMessage();

      const timeStr = mdMatch[1];
      const remainder = mdMatch[2] || '';

      const cleanTime = timeStr.trim().replace(/\u202f/g, ' ');
      const isPM = /pm/i.test(cleanTime);
      const isAM = /am/i.test(cleanTime);
      const digits = cleanTime.replace(/[^\d:]/g, '').split(':').map(d => parseInt(d, 10));
      let hours = digits[0] || 0;
      let minutes = digits[1] || 0;
      let seconds = digits[2] || 0;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      const timestamp = new Date(
        currentSectionDate!.getFullYear(),
        currentSectionDate!.getMonth(),
        currentSectionDate!.getDate(),
        hours,
        minutes,
        seconds
      );

      let sender = '';
      let content = '';
      let isSystem = false;

      const senderMatch = remainder.match(/^(?:\*\*([^*]+?):\*\*|\*\*([^*]+?)\*\*:\s*|__([^_]+?):__|__([^_]+?)__:\s*|([^:\[\]\n]+?):\s*)(.*)$/);

      if (senderMatch) {
        sender = (senderMatch[1] || senderMatch[2] || senderMatch[3] || senderMatch[4] || senderMatch[5] || '').trim();
        content = senderMatch[6].replace(/^\s/, '');
      } else {
        sender = '__system__';
        content = remainder.replace(/^[-–—]\s*/, '').trim();
        isSystem = true;
      }

      if (!isSystem && SYSTEM_PATTERNS.some(p => p.test(content) || p.test(remainder))) {
        if (!senderMatch) {
          isSystem = true;
          sender = '__system__';
        }
      }

      currentMsg = {
        id: `msg-${++msgCounter}`,
        index: msgCounter - 1,
        timestamp,
        dateStr: toLocalDateString(timestamp),
        timeStr: cleanTime,
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

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  if (messages.length > 0) {
    let minTime = messages[0].timestamp.getTime();
    let maxTime = messages[0].timestamp.getTime();
    for (let i = 1; i < messages.length; i++) {
      const t = messages[i].timestamp.getTime();
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
    startDate = new Date(minTime);
    endDate = new Date(maxTime);
  }

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
