import React, { useState } from 'react';
import {
  Wine,
  Shield,
  ChefHat,
  GlassWater,
  Flame,
  UtensilsCrossed,
  Sparkles,
  Lock,
  User as UserIcon,
  Building2,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Role, ROLE_DEFINITIONS } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  head_bartender: Wine,
  head_chef: ChefHat,
  bartender: GlassWater,
  cook: Flame,
  waiter: UtensilsCrossed,
};

export const AuthScreen: React.FC = () => {
  const { login, quickLogin, registerVenue, venue } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state (prefill default BAR777 for convenience, user can change)
  const [venueCode, setVenueCode] = useState(venue.venueCode || 'BAR777');
  const [loginInput, setLoginInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCode, setNewVenueCode] = useState('');
  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = login(venueCode, loginInput, passwordInput);
    if (!res.success) {
      setLoginError(res.error || 'Ошибка входа');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim() || !newVenueCode.trim() || !newAdminLogin.trim()) {
      return;
    }
    registerVenue(newVenueName, newVenueCode, newAdminLogin, newAdminPassword);
    setRegisterSuccess(true);
  };

  const demoRoles: Role[] = [
    'admin',
    'head_bartender',
    'head_chef',
    'bartender',
    'cook',
    'waiter',
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between px-4 py-6 sm:py-10 max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="text-center pt-2 pb-6">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-amber-950/40 border border-amber-500/30 shadow-lg shadow-amber-500/10 mb-3.5">
          <Wine className="w-9 h-9 text-amber-400" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-400">
            BAR<span className="text-neutral-100">OPS</span>
          </h1>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            B2B SaaS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xs mx-auto">
          Мобильная операционная система для баров, кухонь и ресторанного сервиса
        </p>
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl p-5 sm:p-6 backdrop-blur-md">
        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950/80 border border-neutral-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              activeTab === 'login'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Вход в заведение
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLoginError(null);
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              activeTab === 'register'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Регистрация заведения
          </button>
        </div>

        {/* Tab 1: Login Form (Strictly 3 fields: Code, Login, Password; NO role picker) */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                1. Код заведения
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={venueCode}
                  onChange={(e) => setVenueCode(e.target.value.toUpperCase())}
                  placeholder="Например, BAR777"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 uppercase font-mono tracking-wider transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                2. Логин сотрудника
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="admin / head_bar / cook ..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                3. Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 italic">
              * Роль определяется автоматически из вашего профиля сотрудника.
            </p>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition"
            >
              Войти в систему
            </button>
          </form>
        )}

        {/* Tab 2: Register New Venue Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {registerSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Заведение успешно зарегистрировано! Выполняется вход...</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Название заведения
              </label>
              <input
                type="text"
                required
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                placeholder="«Мята Lounge», «Паб Дублин»..."
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Уникальный код заведения
              </label>
              <input
                type="text"
                required
                value={newVenueCode}
                onChange={(e) => setNewVenueCode(e.target.value.toUpperCase())}
                placeholder="BAR777 / CRAFT01"
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono uppercase tracking-wider transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Логин владельца (Администратор)
              </label>
              <input
                type="text"
                required
                value={newAdminLogin}
                onChange={(e) => setNewAdminLogin(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Пароль администратора
              </label>
              <input
                type="password"
                required
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700/80 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              Создателю заведения автоматически присваиваются полные права <strong>«Администратор»</strong> с доступом ко всем точкам и настройкам.
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-[0.99] transition"
            >
              Зарегистрировать и войти
            </button>
          </form>
        )}

        {/* Quick Demo Login Block (1-click for all 6 roles) */}
        <div className="mt-6 pt-5 border-t border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Быстрый демо-вход (1 клик)</span>
            </div>
            <span className="text-[10px] text-neutral-400">для тестирования</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoRoles.map((role) => {
              const def = ROLE_DEFINITIONS[role];
              const Icon = ROLE_ICONS[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickLogin(role)}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/40 hover:bg-neutral-800/80 active:scale-95 transition text-left group"
                >
                  <div className="flex items-center gap-1.5 w-full mb-1">
                    <Icon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-semibold text-neutral-200 truncate">
                      {def.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 truncate w-full">
                    Цех: {def.department === 'all' ? 'Все' : def.department === 'bar' ? 'Бар' : def.department === 'kitchen' ? 'Кухня' : 'Зал'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info & PWA / Download Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <div>Код демо-заведения: <span className="font-mono text-amber-400 font-semibold">{venue.venueCode}</span></div>
        <div className="flex items-center gap-2">
          <a
            href="/barops-project.zip"
            download="barops-project.zip"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-amber-300 hover:border-amber-500/40 transition active:scale-95"
            title="Скачать полный архив проекта (.zip)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Скачать код (.zip)</span>
          </a>
          <PWAInstallButton compact />
        </div>
      </div>
    </div>
  );
};
