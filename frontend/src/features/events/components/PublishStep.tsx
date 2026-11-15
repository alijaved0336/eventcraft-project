import React from 'react';
import { EventStatus } from '../types';
import DatePicker from '@/components/ui/date-picker';
import TimePicker from '@/components/ui/time-picker';

interface PublishStepProps {
  currentStatus: EventStatus;
  onStatusChange: (status: EventStatus) => void;
  pubType: 'now' | 'scheduled';
  onPubTypeChange: (type: 'now' | 'scheduled') => void;
  scheduleDate: string;
  onScheduleDateChange: (date: string) => void;
  scheduleTime: string;
  onScheduleTimeChange: (time: string) => void;
  onCancelEvent: () => void;
}

const PublishStep: React.FC<PublishStepProps> = ({
  currentStatus,
  onStatusChange,
  pubType,
  onPubTypeChange,
  scheduleDate,
  onScheduleDateChange,
  scheduleTime,
  onScheduleTimeChange,
  onCancelEvent,
}) => {
  const [isCancelConfirmed, setIsCancelConfirmed] = React.useState(false);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Current Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">Event Status</label>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground/70">
            <span
              className={`size-1.5 rounded-full ${
                currentStatus === 'draft'
                  ? 'bg-muted-foreground'
                  : currentStatus === 'published'
                    ? 'bg-blue-500'
                    : currentStatus === 'scheduled'
                      ? 'bg-indigo-500'
                      : 'bg-green-500'
              }`}
            ></span>
            CURRENTLY: {currentStatus.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-muted/30 rounded-xl border border-border">
          {(['draft', 'published', 'scheduled', 'ended'] as EventStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-sm font-bold ${
                currentStatus === status
                  ? 'bg-card shadow-sm text-foreground ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Publication Controls */}
      <div className="p-6 rounded-2xl border border-border bg-muted/10 space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-foreground">Publication Settings</h3>
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <label
              className={`flex flex-1 items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                pubType === 'now'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-border/80'
              }`}
            >
              <input
                type="radio"
                name="pub_type"
                className="size-4 text-primary focus:ring-primary border-border"
                checked={pubType === 'now'}
                onChange={() => onPubTypeChange('now')}
              />
              <div>
                <p className="text-sm font-bold text-foreground">Publish Now</p>
                <p className="text-xs text-muted-foreground">Go live immediately</p>
              </div>
            </label>
            <label
              className={`flex flex-1 items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                pubType === 'scheduled'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-border/80'
              }`}
            >
              <input
                type="radio"
                name="pub_type"
                className="size-4 text-primary focus:ring-primary border-border"
                checked={pubType === 'scheduled'}
                onChange={() => onPubTypeChange('scheduled')}
              />
              <div>
                <p className="text-sm font-bold text-foreground">Schedule</p>
                <p className="text-xs text-muted-foreground">Set a future date</p>
              </div>
            </label>
          </div>
        </div>

        {/* Date Picker (Visible when Schedule is selected) */}
        {pubType === 'scheduled' && (
          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-semibold text-foreground">Publication Date & Time</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker
                date={scheduleDate}
                onChange={onScheduleDateChange}
                placeholder="Schedule Date"
              />
              <TimePicker
                time={scheduleTime}
                onChange={onScheduleTimeChange}
                placeholder="Schedule Time"
              />
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">info</span>
              Event will automatically move from Draft to Scheduled status.
            </p>
          </div>
        )}
      </div>

      {/* Danger Zone Section */}
      <div className="pt-8 mt-8 border-t border-border">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <span className="material-symbols-outlined">report</span>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-destructive">Danger Zone</h3>
                <p className="text-sm text-destructive/80 mt-1">
                  Cancelling an event is permanent. All attendees will be notified and tickets will
                  be refunded.
                </p>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-destructive focus:ring-destructive border-destructive/20"
                    checked={isCancelConfirmed}
                    onChange={(e) => setIsCancelConfirmed(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-destructive">
                    I understand that this action cannot be undone.
                  </span>
                </label>
                <button
                  disabled={!isCancelConfirmed}
                  onClick={onCancelEvent}
                  className="w-full sm:w-auto px-6 py-2.5 bg-destructive hover:brightness-110 text-destructive-foreground rounded-lg text-sm font-bold shadow-lg shadow-destructive/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishStep;
