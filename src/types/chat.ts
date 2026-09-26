export type ThemeMode = 'whatsapp' | 'light' | 'amoled';

export type ReadingMode = 'bubbles' | 'reader';

export interface Message {
  id: string;
  index: number;
  timestamp: Date;
  dateStr: string;      // YYYY-MM-DD
  timeStr: string;      // 10:32 PM or 22:32
  sender: string;       // Name of sender, or '__system__'
  content: string;      // Plain text or multiline text
  isSystem: boolean;
  isMedia: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'sticker' | 'document' | 'other';
  isDeleted: boolean;
  isPureEmoji: boolean; // 1-3 emojis only without surrounding text
  links: string[];      // Extracted URLs
}

export interface Participant {
  name: string;
  color: string;        // Assigned distinctive pastel color
  messageCount: number;
  mediaCount: number;
  wordCount: number;
  firstMessageDate?: Date;
  lastMessageDate?: Date;
}

export interface ChatSession {
  fileName: string;
  title: string;
  participants: Participant[];
  currentUser: string | null; // The participant who is "Me" (outgoing right side)
  messages: Message[];
  startDate: Date | null;
  endDate: Date | null;
  totalMessages: number;
  totalMedia: number;
  totalLinks: number;
}

export interface SearchState {
  query: string;
  isOpen: boolean;
  matchIndices: number[]; // indices in messages array
  currentMatchIndex: number;
}

export interface FilterState {
  sender: string | null;  // null = all participants
  onlyMedia: boolean;
  onlyLinks: boolean;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
}
