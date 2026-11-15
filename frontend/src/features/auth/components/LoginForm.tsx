import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { decodeTokenToUser } from '@/lib/auth/decodeToken';
import { tokenStore } from '@/lib/auth/tokenStore';
import { toast } from 'sonner';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });
      // Store the access token immediately
      tokenStore.set(response.accessToken);
      // Prefer user object from response body; fall back to decoding the JWT
      const user = response.user ?? decodeTokenToUser(response.accessToken);
      if (user) setUser(user);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const errPayload =
        (err as { response?: { data?: { errors?: string[] | string } } }).response?.data?.errors ||
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Login failed';
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
      <div>
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
        <div className="flex justify-end mt-2">
          <a
            className="text-sm font-semibold text-primary hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            href="#"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <Button className="w-full mt-2" size="lg" type="submit" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-lg">
              progress_activity
            </span>
            Logging in...
          </span>
        ) : (
          'Log In'
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
