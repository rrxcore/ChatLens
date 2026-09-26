// WhatsApp timestamp and line header regexes

// Android: "25/09/24, 10:32 PM - " or "25/09/2024, 22:32 - "
// Also handles hidden directional marks: \u200e (LTR), \u200f (RTL), \u202a, etc.
export const ANDROID_HEADER_REGEX = /^[\u200e\u200f\u202a-\u202e\s]*(\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*[-–—]\s*(.*)$/;

// iOS: "[25/09/24, 10:32:15 PM] " or "[25/09/2024, 22:32:15] "
export const IOS_HEADER_REGEX = /^[\u200e\u200f\u202a-\u202e\s]*\[(\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s*(.*)$/;

// URL extraction regex
export const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`[\]]+)/gi;

// Media omitted patterns
export const MEDIA_PATTERNS = [
  /<media omitted>/i,
  /media omitted/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /sticker omitted/i,
  /gif omitted/i,
  /document omitted/i,
  /contact card omitted/i,
  /voice call/i,
  /video call/i,
  /missed voice call/i,
  /missed video call/i,
  /\(file attached\)/i,
  /<attached:.*>/i,
];

// System notification patterns
export const SYSTEM_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /created group/i,
  /created this group/i,
  /added you/i,
  /was added/i,
  /added/i,
  /left/i,
  /removed/i,
  /changed the subject/i,
  /changed this group's icon/i,
  /changed the group description/i,
  /changed their phone number/i,
  /security code changed/i,
  /you're now an admin/i,
  /pinned a message/i,
  /turned on disappearing messages/i,
  /turned off disappearing messages/i,
];

// Single, double, or triple emoji test (including emoji modifiers, zero-width joiners, flags)
// Unicode regex for emojis
export function isPureEmoji(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  
  // Use modern Unicode property escapes for Emoji
  try {
    // Matches 1 to 3 emoji sequences
    const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\p{Emoji_Modifier}){1,10}$/u;
    if (!emojiRegex.test(clean)) return false;

    // Check actual segment length via Intl.Segmenter if available
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(clean));
      return segments.length >= 1 && segments.length <= 3;
    }
    
    // Fallback: length check
    return clean.length <= 8;
  } catch {
    return false;
  }
}
