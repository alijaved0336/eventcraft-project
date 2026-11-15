import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  time: string; // 24h format "HH:mm"
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  time,
  onChange,
  label,
  placeholder = 'Select time',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse HH:mm to 12h format for display
  const parseTime = (t: string) => {
    const parts = t.split(':');
    const h = parseInt(parts[0] || '9', 10);
    const m = parseInt(parts[1] || '0', 10);
    const period = h >= 12 ? ('PM' as const) : ('AM' as const);
    const hour12 = h % 12 || 12;
    return { hour: hour12, minute: m, period };
  };

  const { hour, minute, period } = parseTime(time);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeSelect = (newH: number, newM: number, newP: 'AM' | 'PM') => {
    const h24 = newP === 'PM' ? (newH % 12) + 12 : newH % 12;
    const hh = String(h24).padStart(2, '0');
    const mm = String(newM).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10... 55

  const displayTime = time
    ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
    : placeholder;

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1.5 px-1">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-3 w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 cursor-pointer transition-all hover:border-primary/50',
          isOpen && 'ring-2 ring-primary/20 border-primary shadow-lg shadow-primary/5',
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined text-slate-400 text-xl">schedule</span>
        <span
          className={cn(
            'text-sm transition-colors',
            time ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400',
          )}
        >
          {displayTime}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-100 w-64 bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 p-2 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
          <div className="flex h-48">
            {/* Hours */}
            <div className="flex-1 overflow-y-auto px-1 snap-y scrollbar-hide py-16">
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() => handleTimeSelect(h, minute, period)}
                  className={cn(
                    'w-full h-10 flex items-center justify-center rounded-lg text-sm transition-all snap-center',
                    hour === h
                      ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  {String(h).padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex-1 overflow-y-auto px-1 snap-y scrollbar-hide py-16">
              {minutes.map((m) => (
                <button
                  key={m}
                  onClick={() => handleTimeSelect(hour, m, period)}
                  className={cn(
                    'w-full h-10 flex items-center justify-center rounded-lg text-sm transition-all snap-center',
                    minute === m
                      ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  {String(m).padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* Period */}
            <div className="flex-1 flex flex-col justify-center gap-2 px-1">
              {(['AM', 'PM'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handleTimeSelect(hour, minute, p)}
                  className={cn(
                    'w-full h-10 flex items-center justify-center rounded-lg text-xs font-bold transition-all',
                    period === p
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default TimePicker;
