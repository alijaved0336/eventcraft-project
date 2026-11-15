import React from 'react';
import { useNotificationPrefs } from '../../hooks/useNotificationPrefs';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface SwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean | undefined;
}

const Switch = ({ checked, onChange, disabled }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
      checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

interface PreferenceRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

const PreferenceRow = ({ title, description, checked, onChange, disabled }: PreferenceRowProps) => (
  <div
    className={`flex items-start justify-between group transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}
  >
    <div className="space-y-1">
      <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{title}</p>
      <p className="text-[13px] text-slate-400 leading-relaxed font-medium max-w-sm">
        {description}
      </p>
    </div>
    <Switch checked={checked} onChange={onChange} disabled={disabled} />
  </div>
);

const NotificationsSection: React.FC = () => {
  const { prefs, loading, updatePref } = useNotificationPrefs();

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!prefs) return null;

  const emailPrefs = (prefs.email || {}) as unknown as Record<string, boolean>;
  const isMasterEmailOn = Object.values(emailPrefs).some((val) => val === true);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-baseline mb-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Notification Preferences
        </h1>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <span>Auto-saved</span>
        </div>
      </div>
      <div className="h-px bg-slate-100 dark:bg-slate-800 w-full mb-8"></div>

      <div className="flex gap-8">
        <div className="flex-1 space-y-12">
          {/* Email Notifications Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Email alerts</h2>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">
                  Master Control
                </p>
              </div>
              <Switch
                checked={isMasterEmailOn}
                onChange={(enabled) => {
                  const newEmailPrefs = Object.keys(emailPrefs).reduce(
                    (acc, key) => {
                      if (key.startsWith('__')) return acc; // Skip __typename
                      return { ...acc, [key]: enabled };
                    },
                    {} as Record<string, boolean>,
                  );
                  updatePref({ email: newEmailPrefs });
                }}
              />
            </div>

            <div className="space-y-8 pl-1 border-l-2 border-slate-50 dark:border-slate-800">
              <PreferenceRow
                title="Ticket confirmations"
                description="Receive an email when you purchase or receive a ticket"
                checked={!!prefs.email?.ticketConfirmation}
                onChange={(val) => updatePref({ email: { ticketConfirmation: val } })}
              />
              <PreferenceRow
                title="Event reminders"
                description="Reminders sent before events you're registered for"
                checked={!!prefs.email?.eventReminders}
                onChange={(val) => updatePref({ email: { eventReminders: val } })}
              />
              <PreferenceRow
                title="Ticket assignments"
                description="When someone assigns a ticket seat to you"
                checked={!!prefs.email?.ticketAssigned}
                onChange={(val) => updatePref({ email: { ticketAssigned: val } })}
              />
              <PreferenceRow
                title="Assignment revoked"
                description="When a ticket assigned to you is taken back"
                checked={!!prefs.email?.assignmentRevoked}
                onChange={(val) => updatePref({ email: { assignmentRevoked: val } })}
              />
              <PreferenceRow
                title="Post-event follow-ups"
                description="Emails sent after events you attended"
                checked={!!prefs.email?.postEventFollowUp}
                onChange={(val) => updatePref({ email: { postEventFollowUp: val } })}
              />
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* SMS Notifications Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">SMS updates</h2>
                <div
                  className={`flex items-center gap-2 mt-1 text-[10px] font-black uppercase tracking-widest ${prefs.sms?.masterOptOut ? 'text-slate-400' : 'text-emerald-500'}`}
                >
                  {!prefs.sms?.masterOptOut ? 'Active' : 'Paused'}
                </div>
              </div>
              <Switch
                checked={!prefs.sms?.masterOptOut}
                onChange={(enabled) => updatePref({ sms: { masterOptOut: !enabled } })}
              />
            </div>

            {prefs.sms?.masterOptOut && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4 rounded-xl mb-6">
                <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed font-bold">
                  All SMS notifications are paused. Re-enable to receive event-day updates.
                </p>
              </div>
            )}

            <div
              className={`space-y-8 pl-1 border-l-2 border-slate-50 dark:border-slate-800 ${prefs.sms?.masterOptOut ? 'opacity-30 pointer-events-none' : ''}`}
            >
              <PreferenceRow
                title="Event day reminders"
                description="SMS reminder on the day of your event"
                checked={!!prefs.sms?.eventDayReminders}
                onChange={(val) => updatePref({ sms: { eventDayReminders: val } })}
              />
              <PreferenceRow
                title="Check-in confirmation"
                description="SMS when you are checked in at an event"
                checked={!!prefs.sms?.checkInConfirmation}
                onChange={(val) => updatePref({ sms: { checkInConfirmation: val } })}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;
