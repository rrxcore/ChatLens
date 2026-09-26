import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { URL_REGEX } from '../../parser/regexPatterns';
import { SamsungEmoji } from './SamsungEmoji';

interface RichContentProps {
  content: string;
  isPureEmoji?: boolean;
  searchQuery?: string;
}

export const RichContent: React.FC<RichContentProps> = React.memo(({
  content,
  isPureEmoji,
  searchQuery,
}) => {
  // If pure emoji message (1-3 emojis)
  if (isPureEmoji) {
    const emojis = splitEmojis(content);
    return (
      <div className="flex items-center gap-1.5 py-1.5 select-text animate-in fade-in zoom-in-95 duration-200">
        {emojis.map((emoji, idx) => (
          <SamsungEmoji key={`jumbo-${idx}-${emoji}`} emoji={emoji} size="jumbo" />
        ))}
      </div>
    );
  }

  // Parse formatting and links
  const lines = content.split('\n');

  return (
    <div className="space-y-1 break-words text-[14.5px] leading-relaxed select-text">
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className={line === '' ? 'h-2' : ''}>
          {renderFormattedLine(line, searchQuery)}
        </div>
      ))}
    </div>
  );
});

RichContent.displayName = 'RichContent';

function splitEmojis(str: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(str))
      .map(s => s.segment)
      .filter(s => s.trim().length > 0);
  }
  const matches = str.match(/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu);
  return matches || [str];
}

function renderFormattedLine(line: string, searchQuery?: string): React.ReactNode {
  if (!line) return null;

  // Split line by URLs to preserve links prominently
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const urlRegexCopy = new RegExp(URL_REGEX.source, 'gi');

  while ((match = urlRegexCopy.exec(line)) !== null) {
    const url = match[0];
    const matchIndex = match.index;

    // Text preceding the URL
    if (matchIndex > lastIndex) {
      const textChunk = line.substring(lastIndex, matchIndex);
      parts.push(renderTextWithFormatting(textChunk, searchQuery, `text-${lastIndex}`));
    }

    // Prominent link card / pill
    parts.push(renderProminentLink(url, `link-${matchIndex}`));
    lastIndex = matchIndex + url.length;
  }

  // Remaining text after last URL
  if (lastIndex < line.length) {
    const remainingText = line.substring(lastIndex);
    parts.push(renderTextWithFormatting(remainingText, searchQuery, `text-${lastIndex}`));
  }

  return <>{parts}</>;
}

function renderProminentLink(url: string, key: string): React.ReactNode {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    hostname = 'link';
  }

  return (
    <a
      key={key}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 my-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-medium bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 dark:text-emerald-300 transition-all duration-150 group shadow-sm hover:shadow-md cursor-pointer select-none"
    >
      <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-400 group-hover:rotate-12 transition-transform duration-200" />
      <span className="font-semibold underline decoration-emerald-500/40 underline-offset-2 truncate max-w-[200px] sm:max-w-[320px]">
        {url}
      </span>
      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-emerald-500/20 text-emerald-300">
        {hostname}
      </span>
      <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </a>
  );
}

function renderTextWithFormatting(text: string, searchQuery?: string, keyPrefix: string = ''): React.ReactNode {
  if (!text) return null;

  // Code blocks: ```code```
  if (text.startsWith('```') && text.endsWith('```') && text.length >= 6) {
    return (
      <pre key={keyPrefix} className="my-1.5 p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-xs overflow-x-auto text-emerald-300">
        <code>{text.slice(3, -3)}</code>
      </pre>
    );
  }

  // Tokenize for WhatsApp markup: *bold*, _italic_, ~strike~, `code`
  const tokens = tokenizeWhatsAppFormatting(text);

  return (
    <span key={keyPrefix}>
      {tokens.map((token, idx) => {
        const itemKey = `${keyPrefix}-${idx}`;

        if (token.type === 'bold') {
          return (
            <strong key={itemKey} className="font-semibold text-slate-100 dark:text-white">
              {renderWithEmojisAndSearch(token.text, searchQuery, `${itemKey}-b`)}
            </strong>
          );
        } else if (token.type === 'italic') {
          return (
            <em key={itemKey} className="italic text-slate-200">
              {renderWithEmojisAndSearch(token.text, searchQuery, `${itemKey}-i`)}
            </em>
          );
        } else if (token.type === 'strike') {
          return (
            <del key={itemKey} className="line-through opacity-75">
              {renderWithEmojisAndSearch(token.text, searchQuery, `${itemKey}-s`)}
            </del>
          );
        } else if (token.type === 'code') {
          return (
            <code key={itemKey} className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-xs text-emerald-300 border border-emerald-500/20">
              {token.text}
            </code>
          );
        }

        return <span key={itemKey}>{renderWithEmojisAndSearch(token.text, searchQuery, `${itemKey}-p`)}</span>;
      })}
    </span>
  );
}

interface FormatToken {
  type: 'plain' | 'bold' | 'italic' | 'strike' | 'code';
  text: string;
}

function tokenizeWhatsAppFormatting(text: string): FormatToken[] {
  const tokens: FormatToken[] = [];

  const markupRegex = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markupRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'plain', text: text.substring(lastIndex, match.index) });
    }

    if (match[2] !== undefined) {
      tokens.push({ type: 'bold', text: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'italic', text: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ type: 'strike', text: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'code', text: match[5] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'plain', text: text.substring(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'plain', text }];
}

// Converts emojis to SamsungEmoji components and highlights search terms
function renderWithEmojisAndSearch(text: string, searchQuery?: string, keyPrefix: string = ''): React.ReactNode {
  if (!text) return null;

  // First handle search term splitting if active
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.trim();
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText.includes(lowerQuery)) {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;

      while (currentIndex < text.length) {
        const matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
        if (matchIndex === -1) {
          parts.push(renderEmojisOnly(text.substring(currentIndex), `${keyPrefix}-sub-${currentIndex}`));
          break;
        }

        if (matchIndex > currentIndex) {
          parts.push(renderEmojisOnly(text.substring(currentIndex, matchIndex), `${keyPrefix}-sub-${currentIndex}`));
        }

        const matchedText = text.substring(matchIndex, matchIndex + query.length);
        parts.push(
          <mark
            key={`${keyPrefix}-hl-${matchIndex}`}
            className="bg-amber-400 text-black px-1 rounded font-semibold animate-pulse inline"
          >
            {renderEmojisOnly(matchedText, `${keyPrefix}-hl-em-${matchIndex}`)}
          </mark>
        );

        currentIndex = matchIndex + query.length;
      }

      return <>{parts}</>;
    }
  }

  return renderEmojisOnly(text, keyPrefix);
}

// Splits string into text chunks and SamsungEmoji icons
function renderEmojisOnly(text: string, keyPrefix: string): React.ReactNode {
  const emojiRegex = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emojiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`${keyPrefix}-t-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    const emojiChar = match[0];
    elements.push(
      <SamsungEmoji
        key={`${keyPrefix}-em-${match.index}`}
        emoji={emojiChar}
        size="inline"
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    elements.push(
      <span key={`${keyPrefix}-t-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return elements.length > 0 ? <>{elements}</> : text;
}
