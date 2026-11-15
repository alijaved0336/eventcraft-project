import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists for tailwind classes merging

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full max-w-md scale-100 rounded-2xl bg-card p-6 shadow-2xl transition-all duration-300 animate-in zoom-in-95 border border-border',
          className,
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-foreground leading-tight">{title}</h2>}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
