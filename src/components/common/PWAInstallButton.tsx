import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 active:scale-95 transition ${
          compact ? 'text-xs' : 'text-sm px-3 py-1.5'
        }`}
        title="Установить приложение на устройство"
        aria-label="Установить PWA приложение"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span>Установить PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-neutral-800 active:scale-95 transition ${
            compact ? 'text-xs' : 'text-sm px-3 py-1.5'
          }`}
          aria-label="Инструкция по установке на iPhone"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>На экран iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-neutral-900 p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-100">Установка на iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-neutral-300">
                <div className="flex gap-3 items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">1</span>
                  <p>В браузере Safari нажмите иконку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх) в нижней панели.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">2</span>
                  <p>Прокрутите меню вниз и выберите <strong>«На экран «Домой»</strong>.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">3</span>
                  <p>Нажмите <strong>«Добавить»</strong> в правом верхнем углу. Приложение будет запускаться в полноэкранном режиме.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-500/40 bg-neutral-900/90 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-amber-300 shadow-lg animate-bounce">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
      <span>Офлайн-режим — данные сохраняются локально</span>
    </div>
  );
};
