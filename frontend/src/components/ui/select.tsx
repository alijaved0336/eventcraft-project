import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  icon?: string;
  options: SelectOption[];
  defaultValue?: string;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

export default function Select({
  id,
  name,
  label,
  icon,
  options,
  defaultValue,
  required,
  className,
  onChange,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue || options[0]?.value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === selectedValue);

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Hidden input for Native Form Submission */}
      {name && <input type="hidden" name={name} value={selectedValue} required={required} />}

      {label && (
        <label className="block text-sm font-medium text-foreground/80 mb-1.5" htmlFor={id}>
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground z-10">
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-border bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm p-3 h-12 shadow-sm',
            icon ? 'pl-10' : '',
            className,
          )}
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
          <span
            className={cn(
              'material-symbols-outlined text-lg text-muted-foreground transition-transform duration-200',
              isOpen ? 'rotate-180' : '',
            )}
          >
            expand_more
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <ul className="max-h-60 overflow-auto p-1 text-sm text-foreground" role="listbox">
              {options.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={selectedValue === option.value}
                  className={cn(
                    'flex items-center justify-between cursor-pointer select-none py-2.5 px-3 rounded-md transition-colors',
                    selectedValue === option.value
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted font-medium',
                  )}
                  onClick={() => {
                    setSelectedValue(option.value);
                    setIsOpen(false);
                    onChange?.(option.value);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {selectedValue === option.value && (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
