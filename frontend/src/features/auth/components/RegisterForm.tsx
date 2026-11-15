import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { decodeTokenToUser } from '@/lib/auth/decodeToken';
import { tokenStore } from '@/lib/auth/tokenStore';
import { toast } from 'sonner';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [role, setRole] = useState('attendee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setIsLoading(true);

    try {
      const response = await authApi.register({
        email,
        password,
        name,
        role,
        timezone,
      });

      tokenStore.set(response.accessToken);
      const user = response.user ?? decodeTokenToUser(response.accessToken);
      if (user) setUser(user);
      toast.success('Account created successfully!');
      navigate('/dashboard/events');
    } catch (err: unknown) {
      const errPayload =
        (err as { response?: { data?: { errors?: string[] | string } } }).response?.data?.errors ||
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Registration failed';
      if (Array.isArray(errPayload)) {
        errPayload.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(errPayload);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Select
        id="role"
        label="Account Role"
        name="role"
        icon="badge"
        required
        defaultValue="attendee"
        options={[
          { label: 'Attendee', value: 'attendee' },
          { label: 'Organizer', value: 'organizer' },
          { label: 'Guest', value: 'guest' },
          { label: 'Host', value: 'host' },
        ]}
        onChange={(val) => setRole(val)}
      />
      <Input
        id="full-name"
        label="Full name"
        name="full-name"
        icon="person"
        placeholder="John Doe"
        required
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
      />

      <Input
        id="email"
        label="Email"
        name="email"
        icon="mail"
        placeholder="name@company.com"
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="password"
          label="Password"
          name="password"
          icon="lock"
          placeholder="••••••••"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <Input
          id="confirm-password"
          label="Confirm Password"
          name="confirm-password"
          icon="lock_clock"
          placeholder="••••••••"
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-start gap-3 mt-2">
        <input
          className="mt-1 w-4 h-4 cursor-pointer accent-primary"
          id="terms"
          name="terms"
          required
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          disabled={isLoading}
        />
        <label
          className="text-sm text-slate-600 dark:text-slate-400 leading-snug cursor-pointer select-none"
          htmlFor="terms"
        >
          I agree to the{' '}
          <a className="text-primary hover:underline font-medium" href="#">
            Terms of Service
          </a>{' '}
          and{' '}
          <a className="text-primary hover:underline font-medium" href="#">
            Privacy Policy
          </a>
        </label>
      </div>

      <Button className="w-full mt-4" size="lg" type="submit" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-lg">
              progress_activity
            </span>
            Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
