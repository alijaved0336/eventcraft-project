import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isDeleting = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={!isDeleting}>
      <div className="flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500">
          <AlertTriangle size={30} />
        </div>

        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mb-8 text-slate-500 dark:text-slate-400">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900 dark:text-white">"{itemName}"</span>? This
          action cannot be undone and will remove all associated data.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-200 dark:shadow-none"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Delete Event
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
