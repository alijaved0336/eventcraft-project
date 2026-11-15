import React, { useState, useRef, ChangeEvent } from 'react';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Loader2, Mail, Phone, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSection: React.FC = () => {
  const {
    user,
    loading,
    formData,
    setFormData,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    requestEmailChange,
    setPassword,
    isAvatarUploading,
  } = useProfileSettings();

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const isDirty = (field: keyof typeof formData) => {
    if (!user) return false;
    return formData[field] !== user[field];
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (!user) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Avatar Group */}
      <section className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 overflow-hidden border-2 border-white shadow-sm">
            {isAvatarUploading ? (
              <Loader2 className="animate-spin text-primary" />
            ) : user.avatar ? (
              <img
                src={`/api/users/${user._id}/avatar`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user.name.charAt(0)}</span>
            )}
          </div>
          {isAvatarUploading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center rounded-full">
              <Loader2 className="animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Profile photo</span>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="text-xs font-bold px-4 h-9"
              disabled={isAvatarUploading}
            >
              Upload photo
            </Button>
            <button
              onClick={removeAvatar}
              className={`text-xs font-bold transition-colors ${user.avatar ? 'text-red-500 hover:text-red-600' : 'text-slate-300 cursor-not-allowed'}`}
              disabled={!user.avatar || isAvatarUploading}
            >
              Remove
            </button>
          </div>
        </div>
      </section>

      {/* Name Group */}
      <section className="space-y-3">
        <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
          Display name
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
            <Input
              value={formData.name || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="pl-10 h-11 bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-sm font-medium focus:ring-primary/20"
            />
          </div>
          {isDirty('name') && (
            <Button
              onClick={() => updateProfile({ name: formData.name })}
              className="px-8 h-11 text-xs font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 shrink-0"
            >
              Save Changes
            </Button>
          )}
        </div>
      </section>

      {/* Email Group */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
              Email address
            </label>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {user.email}
            </span>
          </div>
          {!isChangingEmail && (
            <button
              onClick={() => setIsChangingEmail(true)}
              className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {emailSent && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              Verification link sent to {newEmail || user.email}
            </span>
          </div>
        )}

        {isChangingEmail && (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                New Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
                <Input
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                  className="pl-10 h-10 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsChangingEmail(false);
                  setEmailSent(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <Button
                onClick={async () => {
                  if (newEmail) {
                    await requestEmailChange(newEmail);
                    setEmailSent(true);
                  }
                }}
                disabled={!newEmail}
                className="px-6 h-10 text-[10px] font-black uppercase tracking-widest"
              >
                Send Verification
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Phone Group */}
      <section className="space-y-3">
        <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
          Phone number
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="pl-10 h-11 bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-sm focus:ring-primary/20"
            />
          </div>
          {isDirty('phone') && (
            <Button
              onClick={() => updateProfile({ phone: formData.phone })}
              className="px-8 h-11 text-xs font-black uppercase tracking-widest bg-slate-900 text-white"
            >
              Save
            </Button>
          )}
        </div>
      </section>

      {/* Bio Group */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
            Bio
          </label>
          <span className="text-[10px] font-bold text-slate-300 tracking-tight">
            {(formData.bio || '').length} / 300
          </span>
        </div>
        <textarea
          value={formData.bio || ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setFormData({ ...formData, bio: e.target.value.slice(0, 300) })
          }
          rows={3}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed resize-none transition-all outline-none"
          placeholder="Tell us a little about yourself..."
        />
        {isDirty('bio') && (
          <div className="flex justify-end">
            <Button
              onClick={() => updateProfile({ bio: formData.bio })}
              size="sm"
              className="px-6 text-[10px] font-black uppercase tracking-widest"
            >
              Update Bio
            </Button>
          </div>
        )}
      </section>

      {/* Password Section */}
      <section className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Signed in with Google
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                You can set a password to enable email login
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsSettingPassword(!isSettingPassword)}
            variant="outline"
            size="sm"
            className="text-[10px] font-black uppercase tracking-widest px-4"
          >
            {isSettingPassword ? 'Cancel' : 'Set password'}
          </Button>
        </div>

        {isSettingPassword && (
          <div className="p-8 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  if (newPassword !== confirmPassword) {
                    toast.error('Passwords do not match');
                    return;
                  }
                  await setPassword(newPassword);
                  setIsSettingPassword(false);
                }}
                disabled={!newPassword || newPassword !== confirmPassword}
                className="px-8 h-11 text-xs font-black uppercase tracking-widest"
              >
                Save Password
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Connected Accounts */}
      <section className="space-y-4 pb-12">
        <label className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
          Connected Accounts
        </label>
        <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center font-black text-indigo-600">
              G
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Google Account</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Connected
                </span>
              </div>
            </div>
          </div>
          <div className="group relative">
            <button
              className="px-5 py-2 text-xs font-black text-slate-200 cursor-not-allowed uppercase tracking-widest"
              disabled
            >
              Disconnect
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl">
              Minimum one sign-in method required
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfileSection;
