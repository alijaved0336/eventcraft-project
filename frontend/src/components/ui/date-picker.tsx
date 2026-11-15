import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  date: string; // ISO string format YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onChange,
  label,
  placeholder = 'Select date',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(date ? new Date(date) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to get days in month
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

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

  const handleDateSelect = (day: number) => {
    // Correctly handle month/year from viewDate
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const selected = new Date(year, month, day);

    // Format as YYYY-MM-DD to match standard <input type="date">
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');

    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthLabels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Parse existing date for comparison
  const selectedDateObj = date ? new Date(date + 'T00:00:00') : null;
  const isSelected = (day: number) =>
    selectedDateObj &&
    selectedDateObj.getDate() === day &&
    selectedDateObj.getMonth() === currentMonth &&
    selectedDateObj.getFullYear() === currentYear;

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const formattedValue = date
    ? new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
        <span className="material-symbols-outlined text-slate-400 text-xl">calendar_today</span>
        <span
          className={cn(
            'text-sm transition-colors',
            date ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400',
          )}
        >
          {date ? formattedValue : placeholder}
        </span>
        {date && (
          <button
            className="ml-auto p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[100] w-72 bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
          <header className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {monthLabels[currentMonth]} {currentYear}
            </h4>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changeMonth(-1);
                }}
                className="size-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changeMonth(1);
                }}
                className="size-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysLabels.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-bold text-slate-400 uppercase py-1 tracking-widest"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateSelect(day);
                  }}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center relative group',
                    isSelected(day)
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary',
                    isToday(day) &&
                      !isSelected(day) &&
                      "text-primary font-bold after:content-[''] after:absolute after:bottom-1 after:size-1 after:bg-primary after:rounded-full",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                onChange(`${yyyy}-${mm}-${dd}`);
                setIsOpen(false);
              }}
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
