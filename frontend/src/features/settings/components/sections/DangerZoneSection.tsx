import React, { useState, ChangeEvent } from 'react';
import { useDangerZone } from '../../hooks/useDangerZone';
import Button from '@/components/ui/button';
import { Loader2, Download, Trash2, X, ShieldAlert } from 'lucide-react';
import Input from '@/components/ui/input';

const DangerZoneSection: React.FC = () => {
  const { exportStatus, exportLoading, requestExport, requestDeletion } = useDangerZone();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-10">
        <h2 className="text-3xl font-black tracking-tight text-red-600 mb-2">Danger Zone</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/50">
          Irreversible Actions
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Export Data Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div className="flex-1 space-y-2">
            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
              Export my data
              {exportStatus?.status === 'processing' && (
                <Loader2 className="size-4 animate-spin text-primary" />
              )}
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
              Download a copy of your profile, orders, and tickets in JSON format.
            </p>
          </div>

          <div className="shrink-0">
            {exportStatus?.status === 'ready' ? (
              <Button
                onClick={() =>
                  exportStatus.downloadUrl && window.open(exportStatus.downloadUrl, '_blank')
                }
                className="bg-slate-900 text-white px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Download className="size-4 mr-2" />
                Download Export
              </Button>
            ) : (
              <Button
                onClick={requestExport}
                disabled={exportStatus?.status === 'processing' || exportLoading}
                variant="outline"
                className="px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50"
              >
                {exportStatus?.status === 'processing' ? 'Preparing...' : 'Request Export'}
              </Button>
            )}
          </div>
        </div>

        {/* Delete Account Card */}
        <div className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-2">
            <h3 className="font-black text-red-600 text-lg tracking-tight">Perma-Delete Account</h3>
            <p className="text-red-900/40 dark:text-red-400/40 text-sm font-medium leading-relaxed max-w-sm">
              Your account will be permanently deleted after a 30-day grace period. You can reverse
              this action before that time.
            </p>
          </div>

          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            size="sm"
            className="bg-red-600 text-white px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all"
          >
            <Trash2 className="size-4 mr-2" />
            Delete Account
          </Button>
        </div>

        {/* Deletion Scheduled State (Mock/Static if needed, but here's how it would look) */}
        {/*
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-3xl p-8 border border-amber-100 dark:border-amber-500/20 flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="size-6 text-amber-600 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Deletion scheduled</h3>
              <p className="text-slate-400 text-sm mt-0.5 font-medium">Account deletes on <span className="font-black text-amber-600 italic underline">May 4, 2026</span></p>
            </div>
          </div>
          <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
            Cancel Deletion
          </button>
        </div>
        */}
      </div>

      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
            onClick={() => setIsDeleteModalOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                <ShieldAlert className="size-8 text-red-600" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                Delete your account?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-10 font-bold max-w-[280px]">
                This will schedule your account for permanent deletion in 30 days. This action is
                terminal.
              </p>

              <div className="mb-10 space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Type <span className="text-red-500 italic">delete my account</span> to confirm
                </label>
                <Input
                  className="h-12 bg-slate-50 dark:bg-slate-950 border-0 border-b-2 border-red-500 rounded-t-xl rounded-b-none px-4 focus:ring-0 text-slate-900 dark:text-white font-black italic text-sm"
                  placeholder="Type the confirmation text"
                  value={deleteConfirmation}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setDeleteConfirmation(e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={async () => {
                    await requestDeletion();
                    setIsDeleteModalOpen(false);
                  }}
                  disabled={deleteConfirmation !== 'delete my account'}
                  className="px-6 py-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 disabled:opacity-30 disabled:scale-100 active:scale-95 transition-all"
                >
                  Confirm Deletion
                </Button>
              </div>
            </div>

            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZoneSection;
