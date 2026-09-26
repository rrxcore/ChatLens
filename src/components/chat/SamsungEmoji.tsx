import React, { useState, useMemo } from 'react';
import localEmojiList from './localSamsungEmojis.json';

const LOCAL_EMOJI_SET = new Set<string>(localEmojiList as string[]);

interface SamsungEmojiProps {
  emoji: string;
  size?: 'inline' | 'jumbo';
}

function getEmojiHexCandidates(emoji: string): string[] {
  const points: string[] = [];
  for (let i = 0; i < emoji.length; i++) {
    const cp = emoji.codePointAt(i);
    if (cp !== undefined) {
      points.push(cp.toString(16).toLowerCase());
      if (cp > 0xffff) i++;
    }
  }
  const full = points.join('-');
  const withoutFe0f = points.filter(p => p !== 'fe0f').join('-');
  const withFe0f = points.includes('fe0f') ? full : `${full}-fe0f`;
  return Array.from(new Set([withoutFe0f, full, withFe0f]));
}

export const SamsungEmoji: React.FC<SamsungEmojiProps> = React.memo(({ emoji, size = 'inline' }) => {
  const candidates = useMemo(() => getEmojiHexCandidates(emoji), [emoji]);

  // Check if we have this emoji in the bundled classic Samsung TouchWiz / Experience set
  const localMatch = useMemo(() => {
    return candidates.find(c => LOCAL_EMOJI_SET.has(c));
  }, [candidates]);

  // stage:
  // 0: local bundled classic Samsung emoji
  // 1: RealityRipple CDN (One UI)
  // 2: mqrio CDN fallback
  // 3: Native system emoji fallback
  const [stage, setStage] = useState<number>(() => (localMatch ? 0 : 1));
  const [cdnIndex, setCdnIndex] = useState(0);

  const handleError = () => {
    if (stage === 0) {
      setStage(1);
    } else if (stage === 1) {
      if (cdnIndex + 1 < candidates.length) {
        setCdnIndex(prev => prev + 1);
      } else {
        setStage(2);
      }
    } else if (stage === 2) {
      setStage(3);
    }
  };

  if (stage === 3) {
    return (
      <span className={size === 'jumbo' ? 'text-4xl sm:text-5xl leading-tight' : 'inline'}>
        {emoji}
      </span>
    );
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  let currentSrc = '';
  if (stage === 0 && localMatch) {
    currentSrc = `${prefix}emojis/samsung/${localMatch}.png`;
  } else if (stage === 1 && cdnIndex < candidates.length) {
    currentSrc = `https://cdn.jsdelivr.net/gh/realityripple/emoji@latest/oneui/${candidates[cdnIndex]}.png`;
  } else {
    currentSrc = `https://emoji-cdn.mqrio.dev/${encodeURIComponent(emoji)}?style=samsung`;
  }

  if (size === 'jumbo') {
    return (
      <img
        src={currentSrc}
        alt={emoji}
        draggable={false}
        loading="eager"
        onError={handleError}
        className="w-11 h-11 sm:w-14 sm:h-14 inline-block object-contain mx-0.5 select-none drop-shadow-md transition-transform duration-150 hover:scale-110 active:scale-95"
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={emoji}
      draggable={false}
      loading="lazy"
      onError={handleError}
      className="w-[1.3em] h-[1.3em] inline-block align-[-0.22em] mx-[0.08em] select-none object-contain"
    />
  );
});

SamsungEmoji.displayName = 'SamsungEmoji';
