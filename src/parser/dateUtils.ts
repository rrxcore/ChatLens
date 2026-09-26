// Date parsing and formatting utilities for WhatsApp chats

export function parseWhatsAppDate(dateStr: string, timeStr: string): Date {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();

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
    } else if (p3 > 1000 || p3 < 100) {
      year = p3 < 100 ? 2000 + p3 : p3;
      // If p1 > 12, it must be DD/MM/YYYY
      if (p1 > 12) {
        day = p1;
        month = Math.max(0, p2 - 1);
      } else if (p2 > 12) {
        // MM/DD/YYYY
        month = Math.max(0, p1 - 1);
        day = p2;
      } else {
        // Default to DD/MM/YYYY (global standard for WhatsApp)
        day = p1;
        month = Math.max(0, p2 - 1);
      }
    }
  }

  // Parse time: "10:32 PM" or "22:32:15"
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
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
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
