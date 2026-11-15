import React from 'react';
import DatePicker from '@/components/ui/date-picker';
import TimePicker from '@/components/ui/time-picker';
import Select from '@/components/ui/select';

interface ScheduleStepProps {
  startDate: string;
  onStartDateChange: (date: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  addToGoogleCalendar: boolean;
  onToggleButtonChange: (val: boolean) => void;
}

const timezoneOptions = [
  { value: 'Pacific/Los_Angeles', label: '(GMT-08:00) Pacific Time - Los Angeles' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time - New York' },
  { value: 'Europe/London', label: '(GMT+00:00) Greenwich Mean Time - London' },
];

const ScheduleStep: React.FC<ScheduleStepProps> = ({
  startDate,
  onStartDateChange,
  startTime,
  onStartTimeChange,
  endDate,
  onEndDateChange,
  endTime,
  onEndTimeChange,
  timezone,
  onTimezoneChange,
  addToGoogleCalendar,
  onToggleButtonChange,
}) => {
  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Event Schedule</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Define the timeline for your upcoming experience. Precision in scheduling ensures a
          seamless guest journey.
        </p>
      </header>

      <div className="space-y-8">
        {/* Start Date/Time */}
        <div className="space-y-4">
          <label className="text-[0.6875rem] font-bold tracking-widest uppercase text-muted-foreground px-1 leading-none">
            Start Timeline
          </label>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker date={startDate} onChange={onStartDateChange} placeholder="Start Date" />
            <TimePicker time={startTime} onChange={onStartTimeChange} placeholder="Start Time" />
          </div>
        </div>

        {/* End Date/Time */}
        <div className="space-y-4">
          <label className="text-[0.6875rem] font-bold tracking-widest uppercase text-muted-foreground px-1 leading-none">
            End Timeline
          </label>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker date={endDate} onChange={onEndDateChange} placeholder="End Date" />
            <TimePicker time={endTime} onChange={onEndTimeChange} placeholder="End Time" />
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-4">
          <label className="text-[0.6875rem] font-bold tracking-widest uppercase text-muted-foreground px-1 leading-none">
            Timezone Context
          </label>
          <Select
            icon="public"
            options={timezoneOptions}
            defaultValue={timezone}
            onChange={onTimezoneChange}
          />
        </div>

        {/* Toggle Section */}
        <div className="bg-muted/30 p-6 rounded-xl flex items-center justify-between border border-border">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">event_repeat</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Add to Google Calendar</h4>
              <p className="text-xs text-muted-foreground">
                Automatically sync event updates to guest calendars.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={addToGoogleCalendar}
              onChange={(e) => onToggleButtonChange(e.target.checked)}
            />
            <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </section>
  );
};

export default ScheduleStep;
