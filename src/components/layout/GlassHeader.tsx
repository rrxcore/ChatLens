import React from 'react';
import {
  MessageSquare,
  BookOpen,
  Search,
  Users,
  Sun,
  Sparkles,
  UploadCloud,
  Layers,
} from 'lucide-react';
import type { ChatSession, ReadingMode, ThemeMode } from '../../types/chat';

interface GlassHeaderProps {
  session: ChatSession;
  readingMode: ReadingMode;
  onReadingModeChange: (mode: ReadingMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onResetChat: () => void;
  onOpenUserModal: () => void;
  onUpdateTitle?: (newTitle: string) => void;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  session,
  readingMode,
  onReadingModeChange,
  theme,
  onThemeChange,
  onOpenSearch,
  onToggleSidebar,
  isSidebarOpen,
  onResetChat,
  onOpenUserModal,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-16 px-3 sm:px-6 flex items-center justify-between ios-glass bg-slate-900/75 border-b border-white/10 dark:bg-black/80 dark:border-white/10 shadow-sm transition-colors duration-200 select-none">
      {/* Left: ChatLens Branding & Chat Info */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          title="Toggle Chat Info & Participants"
          className={`relative shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
            isSidebarOpen
              ? 'bg-cyan-500/15 border border-cyan-400/50 ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40'
          }`}
        >
          {/* Subtle static ambient glow behind logo */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-md pointer-events-none" />
          <img
            src="/logo.png"
            alt="ChatLens Logo"
            className="relative w-8 h-8 object-contain logo-static-glow select-none pointer-events-none"
          />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent leading-tight">
            ChatLens
          </h1>
          <p className="text-[10.5px] font-medium tracking-wide text-emerald-400/90 leading-tight mt-0.5 flex items-center gap-1">
            <span className="text-slate-400">Developed by</span>
            <span className="text-emerald-300 font-semibold tracking-wider">~rrxcore</span>
          </p>
        </div>

        {/* Chat Stats Pill (Click to view full chat info & filters) */}
        <button
          onClick={onToggleSidebar}
          title="Click to view Chat Info & Filters"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all ml-1.5 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-white max-w-[140px] truncate">
            {session.title}
          </span>
          <span className="text-emerald-400 text-[11px] font-mono">
            • {session.totalMessages.toLocaleString()} msgs
          </span>
        </button>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Quick 'Me' switch button */}
        {session.participants.length > 1 && (
          <button
            onClick={onOpenUserModal}
            title={`Current sender is ${session.currentUser || 'Not set'}. Click to switch.`}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            <span className="text-slate-400">Me:</span>
            <span className="font-semibold truncate max-w-[80px]">{session.currentUser || 'Set'}</span>
          </button>
        )}

        {/* Search button */}
        <button
          onClick={onOpenSearch}
          title="Search conversation (Ctrl+F)"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Reading Mode Toggle (Bubbles vs Reader) */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 shadow-inner">
          <button
            onClick={() => onReadingModeChange('bubbles')}
            title="Chat Bubbles Mode"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              readingMode === 'bubbles'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          <button
            onClick={() => onReadingModeChange('reader')}
            title="Clean Reader / Book Mode"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              readingMode === 'reader'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reader</span>
          </button>
        </div>

        {/* Theme Switcher: WhatsApp vs Light vs AMOLED */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 shadow-inner">
          <button
            onClick={() => onThemeChange('whatsapp')}
            title="WhatsApp Dark Green Theme"
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onThemeChange('light')}
            title="Classic Light Theme"
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onThemeChange('amoled')}
            title="AMOLED Pure Black Theme"
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'amoled'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upload Another / Reset */}
        <button
          onClick={onResetChat}
          title="Upload another chat"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all ml-1"
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
};
