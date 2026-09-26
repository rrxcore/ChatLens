import React from 'react';
import {
  Users,
  X,
  Filter,
  Image as ImageIcon,
  Link as LinkIcon,
  RotateCcw,
  UserCheck,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import type { ChatSession, FilterState } from '../../types/chat';

interface GlassSidebarProps {
  session: ChatSession;
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenUserModal: () => void;
}

export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  session,
  filter,
  onFilterChange,
  isOpen,
  onClose,
  onOpenUserModal,
}) => {
  if (!isOpen) return null;

  const totalMsgs = session.totalMessages || 1;

  const minDateStr = session.startDate
    ? session.startDate.toISOString().split('T')[0]
    : undefined;
  const maxDateStr = session.endDate
    ? session.endDate.toISOString().split('T')[0]
    : undefined;

  const handleSelectSender = (senderName: string | null) => {
    onFilterChange({
      ...filter,
      sender: filter.sender === senderName ? null : senderName,
    });
  };

  const handleToggleMedia = () => {
    onFilterChange({
      ...filter,
      onlyMedia: !filter.onlyMedia,
    });
  };

  const handleToggleLinks = () => {
    onFilterChange({
      ...filter,
      onlyLinks: !filter.onlyLinks,
    });
  };

  const handleStartDateChange = (val: string) => {
    onFilterChange({
      ...filter,
      startDate: val || null,
    });
  };

  const handleEndDateChange = (val: string) => {
    onFilterChange({
      ...filter,
      endDate: val || null,
    });
  };

  const handlePresetDate = (type: 'all' | 'first-day' | 'last-day' | 'last-7' | 'last-30') => {
    if (type === 'all') {
      onFilterChange({ ...filter, startDate: null, endDate: null });
      return;
    }

    if (!session.endDate) return;

    if (type === 'first-day' && minDateStr) {
      onFilterChange({ ...filter, startDate: minDateStr, endDate: minDateStr });
    } else if (type === 'last-day' && maxDateStr) {
      onFilterChange({ ...filter, startDate: maxDateStr, endDate: maxDateStr });
    } else if (type === 'last-7') {
      const d = new Date(session.endDate);
      d.setDate(d.getDate() - 7);
      const start = d.toISOString().split('T')[0];
      onFilterChange({ ...filter, startDate: start, endDate: maxDateStr || null });
    } else if (type === 'last-30') {
      const d = new Date(session.endDate);
      d.setDate(d.getDate() - 30);
      const start = d.toISOString().split('T')[0];
      onFilterChange({ ...filter, startDate: start, endDate: maxDateStr || null });
    }
  };

  const handleResetFilters = () => {
    onFilterChange({
      sender: null,
      onlyMedia: false,
      onlyLinks: false,
      startDate: null,
      endDate: null,
    });
  };

  const isDateFilterActive = filter.startDate !== null || filter.endDate !== null;

  const hasActiveFilters =
    filter.sender !== null ||
    filter.onlyMedia ||
    filter.onlyLinks ||
    isDateFilterActive;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-84 max-w-[88vw] ios-glass bg-slate-900/90 text-slate-100 border-r border-white/10 dark:bg-black/95 dark:border-white/15 shadow-2xl flex flex-col transition-all duration-300 select-none animate-in slide-in-from-left">
      {/* Sidebar Header */}
      <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Users className="w-5 h-5" />
          <h2 className="font-bold text-sm tracking-wide uppercase">Participants & Filters</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Quick Switch 'Me' */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Outgoing Sender ("Me")
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-2">
            Currently set to <strong className="text-white">{session.currentUser || 'None'}</strong> (aligned on the right).
          </p>
          <button
            onClick={onOpenUserModal}
            className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all text-center"
          >
            Change Outgoing Sender
          </button>
        </div>

        {/* Custom Date Range Selector */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-emerald-400" /> Custom Date Range
            </span>
            {isDateFilterActive && (
              <button
                onClick={() => onFilterChange({ ...filter, startDate: null, endDate: null })}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={filter.startDate || ''}
                min={minDateStr}
                max={filter.endDate || maxDateStr}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={filter.endDate || ''}
                min={filter.startDate || minDateStr}
                max={maxDateStr}
                onChange={e => handleEndDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => handlePresetDate('all')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                !isDateFilterActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetDate('first-day')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              First Day
            </button>
            <button
              onClick={() => handlePresetDate('last-day')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              Last Day
            </button>
            <button
              onClick={() => handlePresetDate('last-7')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetDate('last-30')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Quick Media & Links Filters */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Type Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleToggleMedia}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                filter.onlyMedia
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Media ({session.totalMedia})</span>
            </button>

            <button
              onClick={handleToggleLinks}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                filter.onlyLinks
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <span>Links ({session.totalLinks})</span>
            </button>
          </div>
        </div>

        {/* Participants list with progress bars */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Message Distribution ({session.participants.length})
          </h3>

          <div className="space-y-2">
            {session.participants.map(p => {
              const isSelected = filter.sender === p.name;
              const percent = Math.round((p.messageCount / totalMsgs) * 100);

              return (
                <div
                  key={p.name}
                  onClick={() => handleSelectSender(p.name)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                        {p.name}
                      </span>
                      {p.name === session.currentUser && (
                        <span className="text-[10px] text-emerald-400 font-mono">(You)</span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-300 shrink-0">
                      {p.messageCount.toLocaleString()} ({percent}%)
                    </span>
                  </div>

                  {/* Visual distribution bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Span info */}
        {session.startDate && session.endDate && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1 select-none">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Overall Timeline
            </span>
            <div className="flex justify-between text-slate-400">
              <span>First:</span>
              <span className="font-mono text-slate-200">
                {session.startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Last:</span>
              <span className="font-mono text-slate-200">
                {session.endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
