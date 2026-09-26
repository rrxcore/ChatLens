import React, { useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  isOpen: boolean;
  onClose: () => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  isOpen,
  onClose,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Enter to go next, Shift+Enter to go prev, Esc to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 sm:right-6 z-40 max-w-sm w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-2 duration-150 select-none">
      <div className="flex items-center gap-2 p-1.5 rounded-2xl ios-glass bg-slate-900/85 text-slate-100 border border-white/15 shadow-2xl dark:bg-black/90 dark:border-white/20">
        <div className="pl-2 text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search conversation..."
          className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0 min-w-0"
        />

        {query && (
          <div className="flex items-center gap-1 shrink-0 text-xs text-slate-400 font-mono pr-1">
            <span>
              {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : '0/0'}
            </span>
          </div>
        )}

        {totalMatches > 0 && (
          <div className="flex items-center gap-0.5 border-l border-white/10 pl-1 shrink-0">
            <button
              onClick={onPrevMatch}
              title="Previous match (Shift+Enter)"
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onNextMatch}
              title="Next match (Enter)"
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          title="Close search (Esc)"
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
