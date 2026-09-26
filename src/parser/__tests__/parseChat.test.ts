import { describe, it, expect } from 'vitest';
import { parseWhatsAppChat } from '../parseChat';
import { isPureEmoji } from '../regexPatterns';

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
});
