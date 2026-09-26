import React from 'react';
import { formatFriendlyDate } from '../../parser/dateUtils';
import { Calendar } from 'lucide-react';

interface DateSeparatorProps {
  date: Date;
}

export const DateSeparator: React.FC<DateSeparatorProps> = React.memo(({ date }) => {
  const label = formatFriendlyDate(date);

  return (
    <div className="flex items-center justify-center my-4 sticky top-16 z-10 pointer-events-none select-none">
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium tracking-wide uppercase shadow-sm ios-glass-subtle bg-slate-900/65 text-slate-300 border border-white/10 dark:bg-black/75 dark:border-white/15 dark:text-slate-200">
        <Calendar className="w-3 h-3 text-emerald-400 opacity-80" />
        <span>{label}</span>
      </div>
    </div>
  );
});

DateSeparator.displayName = 'DateSeparator';
