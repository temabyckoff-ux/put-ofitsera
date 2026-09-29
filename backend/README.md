# Закрытая бета «Путь офицера»

GitHub Pages остаётся фронтендом игры. Доступ и заявки обрабатываются Cloudflare Worker + KV. GitHub Pages сам по себе не запускает серверный код, поэтому секрет Telegram-бота нельзя помещать в `app.js` или другие публичные файлы.

## Что уже подготовлено

- `worker.js` — API `/api/auth`, Telegram webhook `/api/telegram`, проверка подписи Telegram `initData`.
- `wrangler.toml` — конфигурация Cloudflare Worker/KV.
- `../access.js` — закрывает игру внутри Telegram до одобрения.
- `dev-mode.js` больше не принимает секретный URL-параметр; полный тестовый режим включается только после серверной авторизации администратора.

## Что нужно один раз настроить владельцу

1. Создать бесплатный аккаунт Cloudflare.
2. Создать KV namespace с именем `ACCESS` и подставить его ID в `wrangler.toml`.
3. В каталоге `backend` выполнить `wrangler login`, затем `wrangler deploy`.
4. Добавить секреты Worker:
   - `BOT_TOKEN` — токен бота от BotFather;
   - `ADMIN_CHAT_ID` — Telegram ID владельца;
   - `ADMIN_IDS` — при необходимости список администраторов через запятую.
5. Установить webhook бота на `https://<worker-url>/api/telegram`.
6. В `access.js` заменить `https://REPLACE_WITH_WORKER_URL` на URL Worker.

## Поведение

Новый игрок открывает Mini App → сервер проверяет подписанные Telegram-данные → если игрока нет, создаётся заявка `pending` и владельцу приходит сообщение с кнопками `Разрешить / Отклонить` → после разрешения игрок может открыть игру.

Администратор определяется на сервере по `ADMIN_CHAT_ID`/`ADMIN_IDS`, поэтому URL-параметром получить полный доступ нельзя.

## Важно

Не помещать `BOT_TOKEN` в GitHub, `access.js`, `app.js` или `wrangler.toml`. Telegram рекомендует проверять `Telegram.WebApp.initData` на сервере перед использованием данных пользователя.
