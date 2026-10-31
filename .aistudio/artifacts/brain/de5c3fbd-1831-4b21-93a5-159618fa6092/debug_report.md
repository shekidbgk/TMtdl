# Технический отчёт (Debug Report) — Исправление отображения в Google AI Studio Preview

## 1. Симптом ошибки
На скриншоте мобильного браузера Chrome во вкладке **Preview** внутри Google AI Studio вместо интерфейса приложения отображалась серая иконка ошибки загрузки фрейма (`ERR_FAILED` / `Blocked request`).

![Скриншот ошибки пользователя](/public/assets/aistudio/Screenshot_2026-10-31-06-36-36-177_com.android.chrome_db8c5d25.jpg)

---

## 2. В чём была причина (Root Cause Analysis)

В ходе диагностики контейнера, конфигурации `Nginx` (`/etc/nginx/user_auth_verification.lua`) и `Vite 8` были выявлены **3 взаимосвязанные причины**:

### Причина №1: Конфликт агрессивного Service Worker (`vite-plugin-pwa` в режиме `devOptions.enabled: true`) с авторизационным мостом AI Studio в `<iframe>`
1. Вкладка **Preview** в Google AI Studio открывает приложение внутри кросс-доменного `<iframe>` (`aistudio.google.com` → `ais-dev-...run.app`).
2. При открытии Preview прокси-сервер AI Studio (`user_auth_verification.lua`) выполняет многошаговую проверку авторизации через цепочку `302 Redirect`:
   - `/?__session_index=0` → `/__cookie_check.html` → `https://aistudio.google.com/applet-auth-bridge` → `/?__aistudio_auth_token=...` → `302 Redirect` на `/`.
3. Плагин `vite-plugin-pwa` с включённой опцией `devOptions: { enabled: true }` генерировал файл `/dev-sw.js?dev-sw`, который регистрировал в Workbox правило:
   ```js
   workbox.precacheAndRoute([{ url: "index.html", revision: "..." }]);
   workbox.registerRoute(
     new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
       allowlist: [/^\/$/]
     })
   );
   ```
4. **Что происходило в мобильном Chrome**:
   - Правило `NavigationRoute` проверяет только `url.pathname` (`/`), игнорируя query-параметры (`?__aistudio_auth_token=...` и `?__session_index=0`), и перехватывало навигационные запросы внутри `<iframe>` до того, как Nginx мог установить авторизационную cookie `__SECURE-aistudio_auth_token`.
   - При фоновом прекэшировании `index.html` в момент истечения сессии Workbox сохранял в `CacheStorage` ответ со статусом редиректа (`response.redirected === true`). По спецификации Chromium, если Service Worker возвращает перенаправленный ответ на навигационный запрос документа с `redirect !== 'manual'`, браузер немедленно прерывает загрузку фрейма с фатальной ошибкой **`ERR_FAILED` (серая иконка сломанной страницы)**.

### Причина №2: Блокировка внешних `Host` заголовков в Vite 8 (`403 Forbidden`)
В проекте используется **Vite 8 (`^8.3.0`)**, в котором по умолчанию включена строгая защита `server.allowedHosts`. При обращении по внешнему домену (`ais-dev-...run.app`) без `allowedHosts: true` Vite возвращал:
```http
HTTP/1.1 403 Forbidden
Blocked request. This host ("ais-dev-...run.app") is not allowed.
```

### Причина №3: Использование `window.confirm()` внутри sandboxed iframe
В компоненте `SettingsView.tsx` для кнопки «Сброс демо» использовался нативный вызов `window.confirm()`, который блокируется политикой безопасности кросс-доменного `<iframe>` в AI Studio.

---

## 3. Что было сделано для исправления

1. **Самоисцеляющийся (Self-Healing) Service Worker Middleware для `/dev-sw.js`**:
   - В `vite.config.ts` добавлен специальный middleware `aiStudioIframeSafePwaPlugin`, который перехватывает запросы браузера к старому `/dev-sw.js?dev-sw`, `/workbox-*` и `/registerSW.js`.
   - Если в мобильном браузере остался зарегистрированный старый Service Worker, при открытии вкладки Preview браузер получает обновлённый скрипт, который **автоматически очищает повреждённый `CacheStorage`**, вызывает `self.registration.unregister()` и перезагружает окно клиента.

2. **Безопасная работа PWA в `<iframe>` и Standalone-режиме (`index.html`, `/public/sw.js`, `/public/manifest.json`)**:
   - В `index.html` добавлен ранний защитный скрипт: когда приложение открыто внутри `<iframe>` (`window.self !== window.top`, т.е. во вкладке Preview в AI Studio), любые старые Service Workers и кэши `workbox-*` принудительно удаляются, чтобы не мешать авторизационным редиректам AI Studio.
   - Когда приложение открыто в отдельной вкладке или установлено как PWA (`window.self === window.top`), регистрируется лёгкий `/sw.js`, который не перехватывает навигационные редиректы.
   - Созданы статические `/public/manifest.json` и `/public/manifest.webmanifest`.

3. **Разрешение всех хостов в `vite.config.ts`**:
   - В секцию `server` добавлены `port: 3000`, `host: '0.0.0.0'` и `allowedHosts: true`. Теперь запросы с любых доменов `*.run.app` проходят без ошибки `403 Forbidden`.

4. **Замена `window.confirm` на кастомное модальное окно**:
   - В `src/components/settings/SettingsView.tsx` системный диалог заменён на встроенное модальное окно подтверждения сброса демо-данных.

5. **Обновление архива исходного кода**:
   - Удалена папка `dev-dist` со старым бандлом Workbox.
   - Пересобран архив `/public/barops-project.zip` со всеми исправлениями.
