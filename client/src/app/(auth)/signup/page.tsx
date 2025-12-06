'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { registerUser } from '@/lib/actions';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

const translations = {
  ru: {
    title: 'Регистрация',
    subtitle: 'Создайте аккаунт и начните общаться.',
    email: 'Email',
    username: 'Имя пользователя',
    password: 'Пароль',
    submit: 'Создать аккаунт',
    haveAccount: 'Уже есть аккаунт?',
    login: 'Войти',
    theme: 'Тема',
    language: 'Язык',
    loading: 'Загрузка...',
    ru: 'Рус',
    en: 'Eng',
    error: 'Ошибка регистрации',
  },
  en: {
    title: 'Sign up',
    subtitle: 'Create an account and start chatting.',
    email: 'Email',
    username: 'Username',
    password: 'Password',
    submit: 'Create account',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    theme: 'Theme',
    language: 'Language',
    loading: 'Loading...',
    ru: 'Рус',
    en: 'Eng',
    error: 'Signup error',
  },
};

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, token, hydrate, isHydrated } = useAuthStore();
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    hydrate: hydrateUi,
  } = useUiStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const copy = translations[language];

  useEffect(() => {
    hydrate();
    hydrateUi();
  }, [hydrate, hydrateUi]);

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/');
    }
  }, [token, isHydrated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await registerUser({ email, username, password });
      setAuth(data);
      router.push('/');
    } catch (err: unknown) {
      console.error(err);
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setError(message || copy.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ios-bg)] p-4 ios-animate-fade-in">
      <div className="w-full max-w-md space-y-6 ios-animate-scale-in">
        {/* Header Controls */}
        <div className="flex items-center justify-end gap-2">
          <div className="ios-glass flex items-center gap-1 rounded-full px-2 py-1.5 shadow-sm">
            <button
              onClick={() => setLanguage('ru')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                language === 'ru'
                  ? 'bg-[var(--ios-blue)] text-white shadow-sm'
                  : 'text-[var(--ios-text-secondary)] hover:text-[var(--ios-text-primary)]'
              }`}
            >
              {copy.ru}
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                language === 'en'
                  ? 'bg-[var(--ios-blue)] text-white shadow-sm'
                  : 'text-[var(--ios-text-secondary)] hover:text-[var(--ios-text-primary)]'
              }`}
            >
              {copy.en}
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className="ios-glass ios-button flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Card */}
        <div className="ios-glass rounded-3xl p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[var(--ios-text-primary)] mb-2">
              {copy.title}
            </h1>
            <p className="text-[15px] text-[var(--ios-text-secondary)]">
              {copy.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ios-text-secondary)] uppercase tracking-wide">
                {copy.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ios-input w-full rounded-2xl px-4 py-3.5 text-[15px] text-[var(--ios-text-primary)] placeholder:text-[var(--ios-text-tertiary)]"
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ios-text-secondary)] uppercase tracking-wide">
                {copy.username}
              </label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="ios-input w-full rounded-2xl px-4 py-3.5 text-[15px] text-[var(--ios-text-primary)] placeholder:text-[var(--ios-text-tertiary)]"
                placeholder="username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ios-text-secondary)] uppercase tracking-wide">
                {copy.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ios-input w-full rounded-2xl px-4 py-3.5 text-[15px] text-[var(--ios-text-primary)] placeholder:text-[var(--ios-text-tertiary)]"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-[var(--ios-red)]/10 border border-[var(--ios-red)]/20 px-4 py-3">
                <p className="text-sm font-semibold text-[var(--ios-red)]">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !username || !password}
              className="ios-button w-full rounded-2xl bg-gradient-to-r from-[var(--ios-blue)] to-[var(--ios-blue-dark)] px-6 py-4 text-[16px] font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {copy.loading}
                </span>
              ) : (
                copy.submit
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[15px] text-[var(--ios-text-secondary)]">
            {copy.haveAccount}{' '}
            <Link
              href="/login"
              className="font-semibold text-[var(--ios-blue)] hover:underline"
            >
              {copy.login}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
