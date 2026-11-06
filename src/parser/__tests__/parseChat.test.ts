import { describe, it, expect } from 'vitest';
import { parseWhatsAppChat } from '../parseChat';
import { isPureEmoji } from '../regexPatterns';
import { detectDateFormat, parseHeadingDate, toLocalDateString } from '../dateUtils';

describe('WhatsApp Chat Parser', () => {
  it('parses standard Android format with AM/PM and multiline messages', () => {
    const raw = `25/09/2026, 10:32 PM - Ritesh: Bro kaha hai?
Aaja meeting start ho gayi.
25/09/2026, 10:33 PM - Hri: Room mein hu
25/09/2026, 10:34 PM - Ritesh: Jaldi aa`;

    const session = parseWhatsAppChat(raw, 'Meeting.txt');

    expect(session.messages).toHaveLength(3);
    expect(session.participants).toHaveLength(2);
    expect(session.participants[0].name).toBe('Ritesh');
    expect(session.participants[0].messageCount).toBe(2);

    // Multiline check
    expect(session.messages[0].content).toBe('Bro kaha hai?\nAaja meeting start ho gayi.');
    expect(session.messages[0].sender).toBe('Ritesh');
    expect(session.messages[1].content).toBe('Room mein hu');
    expect(session.messages[1].sender).toBe('Hri');
  });

  it('parses iOS bracketed format with seconds', () => {
    const raw = `[25/09/26, 10:32:15 PM] Alice: Hey there!
[25/09/26, 10:33:01 PM] Bob: Hi Alice!`;

    const session = parseWhatsAppChat(raw, 'iOS_Chat.txt');

    expect(session.messages).toHaveLength(2);
    expect(session.messages[0].sender).toBe('Alice');
    expect(session.messages[0].content).toBe('Hey there!');
    expect(session.messages[1].sender).toBe('Bob');
    expect(session.messages[1].content).toBe('Hi Alice!');
  });

  it('detects system messages and media omitted tags', () => {
    const raw = `25/09/2026, 10:30 PM - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
25/09/2026, 10:31 PM - Ritesh: <Media omitted>
25/09/2026, 10:32 PM - Hri: Nice picture!`;

    const session = parseWhatsAppChat(raw);

    expect(session.messages).toHaveLength(3);
    expect(session.messages[0].isSystem).toBe(true);
    expect(session.messages[1].isMedia).toBe(true);
    expect(session.messages[2].isMedia).toBe(false);
  });

  it('extracts links from message content', () => {
    const raw = `25/09/2026, 10:35 PM - Ritesh: Check out https://github.com/developer/chatlens and also https://figma.com/file/123`;

    const session = parseWhatsAppChat(raw);

    expect(session.messages[0].links).toEqual([
      'https://github.com/developer/chatlens',
      'https://figma.com/file/123',
    ]);
  });

  it('identifies pure emoji messages for jumbo rendering', () => {
    expect(isPureEmoji('🔥')).toBe(true);
    expect(isPureEmoji('🔥🔥')).toBe(true);
    expect(isPureEmoji('🔥🔥🔥')).toBe(true);
    expect(isPureEmoji('🚀')).toBe(true);
    expect(isPureEmoji('❤️')).toBe(true);
    expect(isPureEmoji('Hello 🔥')).toBe(false);
    expect(isPureEmoji('🔥 and more emojis')).toBe(false);
  });

  it('parses .md files with markdown headings, frontmatter, and code fences', () => {
    const markdownContent = `---
title: Project Discussion
exported_at: 2026-09-26
---

# Chat with Dev Team

\`\`\`text
25/09/2026, 10:40 PM - Aman: Hey team, check this markdown chat!
25/09/2026, 10:41 PM - Ritesh: Working smoothly! 🚀
\`\`\`
`;

    const session = parseWhatsAppChat(markdownContent, 'discussion.md');

    expect(session.messages).toHaveLength(2);
    expect(session.title).toBe('Chat with Dev Team');
    expect(session.participants).toHaveLength(2);
    expect(session.messages[0].sender).toBe('Aman');
    expect(session.messages[0].content).toBe('Hey team, check this markdown chat!');
    expect(session.messages[1].sender).toBe('Ritesh');
    expect(session.messages[1].content).toBe('Working smoothly! 🚀');
  });

  it('parses real-world WhatsApp markdown export with date headings and bold senders', () => {
    const mdContent = `# WhatsApp Chat Export: ❤️🐧Kuuhuu 🐧💫
Export date: September 26, 2026 at 2:54 AM

---

## June 13, 2026

[11:55 PM] **You:** 🥹10 Gb abar back elo

[11:55 PM] **❤️🐧Kuuhuu 🐧💫:** Mane

[11:56 PM] **You:** [Sticker]

---

## June 14, 2026

[6:58 AM] **❤️🐧Kuuhuu 🐧💫:** Achha

[7:02 AM] **❤️🐧Kuuhuu 🐧💫:**
> _You: Kya karti tu_
Ami suye achi
`;

    const session = parseWhatsAppChat(mdContent, 'chat.md');

    expect(session.messages).toHaveLength(5);
    expect(session.title).toBe('❤️🐧Kuuhuu 🐧💫');
    expect(session.participants).toHaveLength(2);
    expect(session.messages[0].dateStr).toBe('2026-06-13');
    expect(session.messages[0].sender).toBe('You');
    expect(session.messages[0].content).toBe('🥹10 Gb abar back elo');

    expect(session.messages[1].sender).toBe('❤️🐧Kuuhuu 🐧💫');
    expect(session.messages[2].isMedia).toBe(true);

    // June 14 messages
    expect(session.messages[3].dateStr).toBe('2026-06-14');
    expect(session.messages[4].dateStr).toBe('2026-06-14');
    expect(session.messages[4].content).toContain('> _You: Kya karti tu_');
    expect(session.messages[4].content).toContain('Ami suye achi');
  });

  it('correctly handles MDY (US) date formats without flipping days <= 12 to wrong months', () => {
    // 6/15/26 (June 15), 10/2/26 (Oct 2), 11/1/26 (Nov 1), 11/6/26 (Nov 6)
    const raw = `[6/15/26, 4:58:50 PM] You: First message in June
[6/17/26, 12:39:07 PM] You: Mid June
[10/2/26, 10:28:54 PM] You: Early October
[10/14/26, 7:33:07 PM] You: Mid October
[11/1/26, 4:28:18 PM] You: Early November
[11/6/26, 2:40:11 PM] You: Today November 6`;

    expect(detectDateFormat(raw)).toBe('MDY');

    const session = parseWhatsAppChat(raw, 'chat.txt');
    expect(session.messages).toHaveLength(6);

    // Verify all dates remain chronological and exact
    expect(session.messages[0].dateStr).toBe('2026-06-15');
    expect(session.messages[1].dateStr).toBe('2026-06-17');
    expect(session.messages[2].dateStr).toBe('2026-10-02'); // NOT 2026-02-10!
    expect(session.messages[3].dateStr).toBe('2026-10-14');
    expect(session.messages[4].dateStr).toBe('2026-11-01'); // NOT 2026-01-11!
    expect(session.messages[5].dateStr).toBe('2026-11-06'); // NOT 2026-06-11!

    expect(session.startDate ? toLocalDateString(session.startDate) : '').toBe('2026-06-15');
    expect(session.endDate ? toLocalDateString(session.endDate) : '').toBe('2026-11-06');
  });

  it('parses heading dates in various formats', () => {
    const d1 = parseHeadingDate('## June 15, 2026');
    expect(d1).not.toBeNull();
    expect(toLocalDateString(d1!)).toBe('2026-06-15');

    const d2 = parseHeadingDate('## 14 October 2026');
    expect(d2).not.toBeNull();
    expect(toLocalDateString(d2!)).toBe('2026-10-14');

    const d3 = parseHeadingDate('### 2026-11-06');
    expect(d3).not.toBeNull();
    expect(toLocalDateString(d3!)).toBe('2026-11-06');

    // Non-date heading returns null
    const nonDate = parseHeadingDate('### *1. Unit 3 — Genetics*');
    expect(nonDate).toBeNull();
  });
});
