import { useState, useEffect, useMemo, useCallback } from 'react';
import { Filter } from 'lucide-react';
import type { ChatSession, FilterState, ReadingMode, SearchState, ThemeMode } from './types/chat';
import { parseWhatsAppChat } from './parser/parseChat';
import { SAMPLE_CHAT_TXT } from './sample/sampleChatData';
import { DropZone } from './components/landing/DropZone';
import { GlassHeader } from './components/layout/GlassHeader';
import { GlassSidebar } from './components/sidebar/GlassSidebar';
import { VirtualMessageList } from './components/chat/VirtualMessageList';
import { ReaderView } from './components/reader/ReaderView';
import { SearchBar } from './components/search/SearchBar';
import { ParticipantModal } from './components/upload/ParticipantModal';

export function App() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('chatlens_theme') as ThemeMode) || 'whatsapp';
  });
  const [readingMode, setReadingMode] = useState<ReadingMode>('bubbles');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Search state
  const [search, setSearch] = useState<SearchState>({
    query: '',
    isOpen: false,
    matchIndices: [],
    currentMatchIndex: 0,
  });

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    sender: null,
    onlyMedia: false,
    onlyLinks: false,
    startDate: null,
    endDate: null,
  });

  // Save theme preference
  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('chatlens_theme', newTheme);
  };

  // Keyboard shortcut listener for Ctrl+F / Cmd+F and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (session) {
          e.preventDefault();
          setSearch(s => ({ ...s, isOpen: true }));
        }
      } else if (e.key === 'Escape') {
        if (search.isOpen) {
          setSearch(s => ({ ...s, isOpen: false }));
        } else if (isSidebarOpen) {
          setIsSidebarOpen(false);
        } else if (isUserModalOpen) {
          setIsUserModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, search.isOpen, isSidebarOpen, isUserModalOpen]);

  // Load raw text
  const handleFileLoaded = (rawText: string, fileName: string) => {
    const parsed = parseWhatsAppChat(rawText, fileName);
    setSession(parsed);
    // If multiple participants, prompt user who they are
    if (parsed.participants.length > 1) {
      setIsUserModalOpen(true);
    }
  };

  // 1-Click Demo loader
  const handleLoadDemo = () => {
    handleFileLoaded(SAMPLE_CHAT_TXT, 'WhatsApp Chat - ChatLens Project Planning.txt');
  };

  // Change "Me" participant
  const handleSelectUser = (name: string) => {
    if (!session) return;
    setSession({
      ...session,
      currentUser: name,
    });
  };

  // Rename chat title
  const handleUpdateTitle = (newTitle: string) => {
    if (!session || !newTitle.trim()) return;
    setSession({
      ...session,
      title: newTitle.trim(),
    });
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      filter.sender !== null ||
      filter.onlyMedia ||
      filter.onlyLinks ||
      filter.startDate !== null ||
      filter.endDate !== null
    );
  }, [filter]);

  // Filter messages with instant fast-path when no filters are active
  const filteredMessages = useMemo(() => {
    if (!session) return [];
    // Instant fast path: If no filters are active, return original messages with 0 CPU overhead
    if (!hasActiveFilters) {
      return session.messages;
    }

    return session.messages.filter(msg => {
      // Filter by sender
      if (filter.sender && msg.sender !== filter.sender) {
        return false;
      }
      // Filter by media
      if (filter.onlyMedia && !msg.isMedia) {
        return false;
      }
      // Filter by links
      if (filter.onlyLinks && msg.links.length === 0) {
        return false;
      }
      // Filter by custom date range
      if (filter.startDate && msg.dateStr < filter.startDate) {
        return false;
      }
      if (filter.endDate && msg.dateStr > filter.endDate) {
        return false;
      }
      return true;
    });
  }, [session, filter, hasActiveFilters]);

  // Debounced search query to prevent lag on 100k+ messages while typing
  const [debouncedQuery, setDebouncedQuery] = useState(search.query);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(search.query);
    }, 220);
    return () => clearTimeout(timer);
  }, [search.query]);

  // Calculate search matches across filtered messages
  const searchMatches = useMemo(() => {
    if (!debouncedQuery || !debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase().trim();

    const matches: number[] = [];
    for (let idx = 0; idx < filteredMessages.length; idx++) {
      const msg = filteredMessages[idx];
      if (
        msg.content.toLowerCase().includes(q) ||
        msg.sender.toLowerCase().includes(q)
      ) {
        matches.push(idx);
      }
    }

    return matches;
  }, [filteredMessages, debouncedQuery]);

  // Update match count in search state
  useEffect(() => {
    setSearch(s => ({
      ...s,
      matchIndices: searchMatches,
      currentMatchIndex: searchMatches.length > 0 ? 0 : 0,
    }));
  }, [searchMatches]);

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setSearch(s => ({
      ...s,
      currentMatchIndex: (s.currentMatchIndex + 1) % searchMatches.length,
    }));
  }, [searchMatches]);

  const handlePrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setSearch(s => ({
      ...s,
      currentMatchIndex:
        (s.currentMatchIndex - 1 + searchMatches.length) % searchMatches.length,
    }));
  }, [searchMatches]);

  // Target message ID for smooth jumping
  const activeMatchMessageId = useMemo(() => {
    if (searchMatches.length === 0) return undefined;
    const msgIdx = searchMatches[search.currentMatchIndex];
    return filteredMessages[msgIdx]?.id;
  }, [searchMatches, search.currentMatchIndex, filteredMessages]);

  // Reset / Upload new file
  const handleResetChat = () => {
    if (window.confirm('Upload another chat file? Current session will be closed.')) {
      setSession(null);
      setFilter({
        sender: null,
        onlyMedia: false,
        onlyLinks: false,
        startDate: null,
        endDate: null,
      });
      setSearch({
        query: '',
        isOpen: false,
        matchIndices: [],
        currentMatchIndex: 0,
      });
    }
  };

  // Determine theme container class
  const themeClasses = useMemo(() => {
    if (theme === 'whatsapp') {
      return 'theme-whatsapp bg-[#0b141a] text-slate-100';
    } else if (theme === 'light') {
      return 'theme-light bg-[#efeae2] text-slate-800';
    } else {
      // AMOLED Pure Black
      return 'theme-amoled bg-black text-slate-100';
    }
  }, [theme]);

  return (
    <div className={`flex flex-col h-full h-dvh w-full overflow-hidden ${themeClasses} select-none transition-colors duration-200`}>
      {session ? (
        <>
          {/* Top Glass Header */}
          <GlassHeader
            session={session}
            readingMode={readingMode}
            onReadingModeChange={setReadingMode}
            theme={theme}
            onThemeChange={handleThemeChange}
            onOpenSearch={() => setSearch(s => ({ ...s, isOpen: true }))}
            onToggleSidebar={() => setIsSidebarOpen(open => !open)}
            isSidebarOpen={isSidebarOpen}
            onResetChat={handleResetChat}
            onOpenUserModal={() => setIsUserModalOpen(true)}
            onUpdateTitle={handleUpdateTitle}
          />

          {/* Floating Search Bar */}
          <SearchBar
            query={search.query}
            onQueryChange={q => setSearch(s => ({ ...s, query: q }))}
            isOpen={search.isOpen}
            onClose={() => setSearch(s => ({ ...s, isOpen: false }))}
            totalMatches={searchMatches.length}
            currentMatchIndex={search.currentMatchIndex}
            onNextMatch={handleNextMatch}
            onPrevMatch={handlePrevMatch}
          />

          {/* Main Content Area */}
          <div className="relative flex-1 flex w-full overflow-hidden chat-doodle-bg">
            {/* Active Filters Floating Banner */}
            {hasActiveFilters && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[calc(100%-2rem)] flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-2xl ios-glass bg-slate-900/85 border border-emerald-500/30 text-xs shadow-xl animate-in fade-in slide-in-from-top-1 select-none">
                <div className="flex items-center gap-1.5 flex-wrap truncate text-slate-200">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filtered:
                  </span>
                  {filter.sender && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px]">
                      {filter.sender}
                      <button onClick={() => setFilter(f => ({ ...f, sender: null }))} className="hover:text-white font-bold ml-0.5">✕</button>
                    </span>
                  )}
                  {(filter.startDate || filter.endDate) && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px]">
                      📅 {filter.startDate || 'Start'} → {filter.endDate || 'End'}
                      <button onClick={() => setFilter(f => ({ ...f, startDate: null, endDate: null }))} className="hover:text-white font-bold ml-0.5">✕</button>
                    </span>
                  )}
                  {filter.onlyMedia && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px]">
                      Media only
                      <button onClick={() => setFilter(f => ({ ...f, onlyMedia: false }))} className="hover:text-white font-bold ml-0.5">✕</button>
                    </span>
                  )}
                  {filter.onlyLinks && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px]">
                      Links only
                      <button onClick={() => setFilter(f => ({ ...f, onlyLinks: false }))} className="hover:text-white font-bold ml-0.5">✕</button>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {filteredMessages.length}/{session.totalMessages}
                  </span>
                  <button
                    onClick={() => setFilter({ sender: null, onlyMedia: false, onlyLinks: false, startDate: null, endDate: null })}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar backdrop overlay on mobile */}
            {isSidebarOpen && (
              <div
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
              />
            )}

            {/* Slide-over / Floating Glass Sidebar */}
            <GlassSidebar
              session={session}
              filter={filter}
              onFilterChange={setFilter}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onOpenUserModal={() => setIsUserModalOpen(true)}
            />

            {/* Conversation Stream or Reader Mode */}
            {readingMode === 'bubbles' ? (
              <VirtualMessageList
                messages={filteredMessages}
                currentUser={session.currentUser}
                participants={session.participants}
                searchQuery={debouncedQuery}
                activeMatchMessageId={activeMatchMessageId}
              />
            ) : (
              <ReaderView
                messages={filteredMessages}
                participants={session.participants}
                currentUser={session.currentUser}
                searchQuery={debouncedQuery}
              />
            )}
          </div>

          {/* "Who are you?" Modal */}
          <ParticipantModal
            isOpen={isUserModalOpen}
            participants={session.participants}
            currentSelected={session.currentUser}
            onSelect={handleSelectUser}
            onClose={() => setIsUserModalOpen(false)}
          />
        </>
      ) : (
        /* Landing DropZone */
        <DropZone
          onFileLoaded={handleFileLoaded}
          onLoadDemo={handleLoadDemo}
        />
      )}
    </div>
  );
}

export default App;
