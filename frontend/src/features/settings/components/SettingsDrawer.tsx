import React, { useState } from 'react';
import { X, User, Bell, Shield, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import ProfileSection from './sections/ProfileSection';
import NotificationsSection from './sections/NotificationsSection';
import SecuritySection from './sections/SecuritySection';
import DangerZoneSection from './sections/DangerZoneSection';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SectionId = 'profile' | 'notifications' | 'security' | 'danger';

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  if (!isOpen) return null;

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User className="size-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="size-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="size-4" /> },
    { id: 'danger', label: 'Danger Zone', icon: <AlertCircle className="size-4" /> },
  ] as const;

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'security':
        return <SecuritySection />;
      case 'danger':
        return <DangerZoneSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel (720px) */}
      <div className="relative w-full md:w-[720px] bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col md:flex-row animate-in slide-in-from-right-full duration-500">
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">
            Account Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* SIDEBAR (Desktop) */}
        <aside className="hidden md:flex flex-col w-[160px] bg-slate-50/50 dark:bg-slate-900/10 border-r border-slate-100 dark:border-slate-800 py-12 shrink-0">
          <div className="px-6 mb-12 flex items-center gap-3">
            <SettingsIcon className="size-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Settings
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 group ${
                  activeSection === section.id
                    ? 'text-slate-900 dark:text-white border-l-[3px] border-primary bg-primary/5'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-l-[3px] border-transparent hover:bg-slate-50/50'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* MOBILE TAB STRIP */}
        <div className="md:hidden flex overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                activeSection === section.id
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-slate-400 border-transparent'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* MAIN PANEL */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 custom-scrollbar relative">
          <div className="px-8 md:px-12 py-10 md:py-16">
            {/* Main Header Desktop */}
            <header className="mb-12 hidden md:block group">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white capitalize animate-in slide-in-from-left-4 duration-500">
                {activeSection === 'danger' ? 'Danger Zone' : `${activeSection} settings`}
              </h1>
              <div className="h-1.5 w-12 bg-primary mt-4 rounded-full transition-all duration-500 group-hover:w-24 shrink-0" />
            </header>

            <div className="animate-in slide-in-from-bottom-2 duration-300">{renderSection()}</div>
          </div>

          {/* Close Action (Desktop) */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-all z-10 hidden md:block"
          >
            <X className="size-6" />
          </button>
        </main>
      </div>
    </div>
  );
};

export default SettingsDrawer;
