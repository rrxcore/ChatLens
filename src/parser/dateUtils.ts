// Date parsing and formatting utilities for WhatsApp chats

export type DateOrder = 'DMY' | 'MDY' | 'YMD';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const SHORT_MONTH_NAMES = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

/**
 * Returns YYYY-MM-DD in local system timezone (never shifts to UTC unlike toISOString)
 */
export function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Analyzes dates throughout the chat export to determine the date component order (DMY vs MDY vs YMD)
 */
export function detectDateFormat(content: string): DateOrder {
  const lines = content.split(/\r?\n/);
  let hasP1GreaterThan12 = false;
  let hasP2GreaterThan12 = false;

  const dateRegex = /(?:^[\u200e\u200f\u202a-\u202e\s]*\[?|^)(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})/;
  const observedDates: Array<{ p1: number; p2: number }> = [];

  for (let i = 0; i < Math.min(lines.length, 5000); i++) {
    const m = lines[i].match(dateRegex);
    if (m) {
      const p1 = parseInt(m[1], 10);
      const p2 = parseInt(m[2], 10);
      if (p1 > 1000) return 'YMD';

      if (p1 > 12) hasP1GreaterThan12 = true;
      if (p2 > 12) hasP2GreaterThan12 = true;

      if (observedDates.length < 50) {
        observedDates.push({ p1, p2 });
      }

      if (hasP1GreaterThan12 && hasP2GreaterThan12) break;
    }
  }

  if (hasP1GreaterThan12 && !hasP2GreaterThan12) return 'DMY';
  if (hasP2GreaterThan12 && !hasP1GreaterThan12) return 'MDY';

  // If all sampled dates have p1 <= 12 and p2 <= 12, inspect variation
  if (observedDates.length > 2) {
    const p1Values = new Set(observedDates.map(d => d.p1));
    const p2Values = new Set(observedDates.map(d => d.p2));

    // In chats covering multiple days in the same month, days vary while month stays constant
    if (p1Values.size === 1 && p2Values.size > 1) {
      return 'MDY'; // p1 is constant month, p2 is changing days
    }
    if (p2Values.size === 1 && p1Values.size > 1) {
      return 'DMY'; // p2 is constant month, p1 is changing days
    }
  }

  // Global default for WhatsApp
  return 'DMY';
}

/**
 * Parses a date heading in markdown chats like "## June 15, 2026", "## 15 June 2026", "## 2026-06-15"
 */
export function parseHeadingDate(text: string): Date | null {
  const clean = text.replace(/^#+\s*/, '').replace(/[*_~`]/g, '').trim();
  if (!clean) return null;

  // Format 1: "June 15, 2026" or "June 15 2026"
  const m1 = clean.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (m1) {
    const monthName = m1[1].toLowerCase();
    let mIdx = MONTH_NAMES.indexOf(monthName);
    if (mIdx === -1) mIdx = SHORT_MONTH_NAMES.indexOf(monthName.slice(0, 3));
    if (mIdx !== -1) {
      return new Date(parseInt(m1[3], 10), mIdx, parseInt(m1[2], 10), 0, 0, 0);
    }
  }

  // Format 2: "15 June 2026" or "15th June 2026"
  const m2 = clean.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+),?\s+(\d{4})/i);
  if (m2) {
    const monthName = m2[2].toLowerCase();
    let mIdx = MONTH_NAMES.indexOf(monthName);
    if (mIdx === -1) mIdx = SHORT_MONTH_NAMES.indexOf(monthName.slice(0, 3));
    if (mIdx !== -1) {
      return new Date(parseInt(m2[3], 10), mIdx, parseInt(m2[1], 10), 0, 0, 0);
    }
  }

  // Format 3: "2026-06-15" (ISO date)
  const m3 = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m3) {
    return new Date(parseInt(m3[1], 10), parseInt(m3[2], 10) - 1, parseInt(m3[3], 10), 0, 0, 0);
  }

  // Format 4: "15/06/2026" or "06/15/2026"
  const m4 = clean.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m4) {
    return parseWhatsAppDate(clean, '00:00', 'DMY');
  }

  // Fallback to Date.parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }

  return null;
}

export function parseWhatsAppDate(dateStr: string, timeStr: string, order: DateOrder = 'DMY'): Date {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim().replace(/\u202f/g, ' ');

  // Normalize delimiters to slash
  const normalizedDate = cleanDate.replace(/[.-]/g, '/');
  const parts = normalizedDate.split('/').map(p => parseInt(p, 10));

  let year = new Date().getFullYear();
  let month = 0; // 0-indexed
  let day = 1;

  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    if (p1 > 1000) {
      // YYYY/MM/DD
      year = p1;
      month = Math.max(0, p2 - 1);
      day = p3;
    } else {
      year = p3 < 100 ? 2000 + p3 : p3;

      if (p1 > 12) {
        // Definitely DD/MM/YYYY
        day = p1;
        month = Math.max(0, p2 - 1);
      } else if (p2 > 12) {
        // Definitely MM/DD/YYYY
        month = Math.max(0, p1 - 1);
        day = p2;
      } else if (order === 'MDY') {
        month = Math.max(0, p1 - 1);
        day = p2;
      } else {
        // Default to DD/MM/YYYY
        day = p1;
        month = Math.max(0, p2 - 1);
      }
    }
  }

  // Parse time: "10:32 PM", "22:32:15", "4:58:50 PM"
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  const isPM = /pm/i.test(cleanTime);
  const isAM = /am/i.test(cleanTime);
  const digits = cleanTime.replace(/[^\d:]/g, '').split(':').map(d => parseInt(d, 10));

  if (digits.length >= 2) {
    hours = digits[0] || 0;
    minutes = digits[1] || 0;
    seconds = digits[2] || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  const result = new Date(year, month, day, hours, minutes, seconds);
  return isNaN(result.getTime()) ? new Date() : result;
}

export function formatFriendlyDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Distinct, vibrant, readable pastel colors for participants in group chats
const PARTICIPANT_PALETTE = [
  '#00a884', // Emerald
  '#25d366', // Green
  '#34b7f1', // Blue
  '#e542a3', // Pink
  '#f39c12', // Amber
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#e67e22', // Orange
  '#3498db', // Sky
  '#16a085', // Teal
  '#d35400', // Rust
  '#8e44ad', // Violet
];

export function getParticipantColor(index: number): string {
  return PARTICIPANT_PALETTE[index % PARTICIPANT_PALETTE.length];
}
