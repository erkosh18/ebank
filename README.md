# QPay PWA

Это PWA-обёртка вокруг исходного `index.html`. Основная логика QPay сохранена; добавлены manifest, Service Worker, офлайн-индикатор, установка, обновление версии, локальное сохранение состояния и заготовка Push API.

## Структура

- `index.html` — исходное приложение с PWA-интеграцией.
- `manifest.json` — standalone, portrait, theme `#6c5ce7`, иконки 72–512 и maskable.
- `sw.js` — precache и стратегии:
  - HTML: network-first;
  - статика: cache-first;
  - API/JSON: network-first с кешированием последнего успешного ответа.
- `offline.html` — экран отсутствия соединения.
- `icons/` — иконки PWA.
- `README.md` — инструкция.

## Запуск

Service Worker не работает из обычного `file://`. Запускайте сайт через HTTPS или локальный сервер.

### Вариант Python

```bash
python -m http.server 8080
```

После этого откройте:

`http://localhost:8080/`

Для полноценного install prompt на реальном устройстве используйте HTTPS. `localhost` подходит для локального тестирования Service Worker.

## Проверка PWA

1. Откройте приложение в Chrome/Edge.
2. DevTools → Application:
   - Manifest — проверьте имя, `standalone`, `portrait`, тему и иконки.
   - Service Workers — проверьте регистрацию и состояние `activated`.
   - Cache Storage — проверьте precache.
3. DevTools → Network → включите Offline.
4. Обновите страницу: HTML должен обслуживаться через network-first с fallback на cache/offline.
5. Откройте приложение без сети и проверьте индикатор офлайн-режима.
6. Измените данные QPay, обновите страницу и проверьте сохранение состояния в `localStorage` (`qpay_state_v1`).
7. Установите PWA через браузер. На iOS используйте «Поделиться» → «На экран Домой».

## Lighthouse

1. Запустите приложение через `http://localhost:8080` или HTTPS.
2. Chrome DevTools → Lighthouse.
3. Выберите режим Mobile или Desktop.
4. Запустите аудит как минимум для:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
   - PWA
5. Для PWA проверьте manifest, installability и Service Worker.
6. После изменений очистите Cache Storage и выполните повторный аудит.

## Push-уведомления

В `index.html` предусмотрены:
- `Notification.requestPermission()`;
- `ServiceWorkerRegistration.pushManager`;
- обработчик `push` в `sw.js`.

Для реальных push-уведомлений нужен backend и VAPID public key. Заготовка не запрашивает разрешение автоматически.

## Важно

Это клиентская PWA-оболочка. Реальные банковские операции, авторизация, платежи и push-доставка должны выполняться через защищённый сервер/API. `localStorage` не следует использовать для хранения реальных секретов, PIN-кодов или банковских данных.
