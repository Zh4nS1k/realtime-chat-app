'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { registerUser } from "@/lib/actions";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";

const translations = {
  ru: {
    title: "Регистрация",
    subtitle: "Создайте аккаунт и начните общаться.",
    email: "Email",
    username: "Имя пользователя",
    password: "Пароль",
    submit: "Создать аккаунт",
    haveAccount: "Уже есть аккаунт?",
    login: "Войти",
    theme: "Тема",
    language: "Язык",
    loading: "Загрузка...",
    ru: "Рус",
    en: "Eng",
    error: "Ошибка регистрации",
  },
  en: {
    title: "Sign up",
    subtitle: "Create an account and start chatting.",
    email: "Email",
    username: "Username",
    password: "Password",
    submit: "Create account",
    haveAccount: "Already have an account?",
    login: "Sign in",
    theme: "Theme",
    language: "Language",
    loading: "Loading...",
    ru: "Рус",
    en: "Eng",
    error: "Signup error",
  },
};

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, token, hydrate, isHydrated } = useAuthStore();
  const { language, setLanguage, theme, toggleTheme, hydrate: hydrateUi } = useUiStore();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const copy = translations[language];

  useEffect(() => {
    hydrate();
    hydrateUi();
  }, [hydrate, hydrateUi]);

  useEffect(() => {
    if (isHydrated && token) {
      router.replace("/");
    }
  }, [token, isHydrated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await registerUser({ email, username, password });
      setAuth(data);
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(message || copy.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white/90 p-8 shadow-xl ring-1 ring-slate-100 backdrop-blur">
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="text-sm font-semibold text-slate-800">{copy.language}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage("ru")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${language === "ru" ? "bg-emerald-500 text-white" : "text-slate-600"}`}
            >
              {copy.ru}
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${language === "en" ? "bg-emerald-500 text-white" : "text-slate-600"}`}
            >
              {copy.en}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {copy.theme}: {theme === "dark" ? "Dark" : "Light"}
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
        <p className="text-sm text-slate-500">{copy.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">{copy.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">{copy.username}</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">{copy.password}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? copy.loading : copy.submit}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          {copy.haveAccount}{" "}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            {copy.login}
          </Link>
        </p>
      </div>
    </main>
  );
}
