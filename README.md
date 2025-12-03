# Realtime Chat (DM + Group)

Next.js + TypeScript клиент и Express + Socket.IO бэкенд. Авторизация, MongoDB, Zustand, Tailwind и UploadThing.

## Возможности
- Регистрация, вход, выход. Пароли хэшируются (`bcryptjs`), приватные маршруты закрыты.
- Личные чаты (DM) и групповые чаты (минимум 3 участника).
- Сообщения доставляются в реальном времени через WebSocket (Socket.IO).
- История сообщений хранится в MongoDB и подгружается при открытии чата.
- Загрузка изображений через UploadThing, превью в ленте сообщений.

## Технологии
- Next.js 16 (App Router), React, TypeScript, Tailwind CSS.
- Zustand для клиентского стейта.
- MongoDB (Mongoose) для хранения пользователей, чатов и сообщений.
- Socket.IO для realtime.
- UploadThing для загрузки картинок.

## Подготовка окружения
1. Скопируйте переменные из `.env` в `client/.env.local` (уже добавлено примером) и оставьте `.env` в корне для бэкенда (`PORT=4000`, `MONGODB_URI`, `JWT_SECRET`, `UPLOADTHING_TOKEN`).  
   В `client/.env.local` уже прописаны `NEXT_PUBLIC_API_URL=http://localhost:4000`, `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000`, `NEXT_PUBLIC_SOCKET_PATH=/socket.io`.
2. Установите зависимости:
   ```bash
   cd client && npm install
   cd ../backend && npm install
   ```

## Запуск
### Локально (два процесса)
```bash
# терминал 1
cd backend
npm run dev   # Express + Socket.IO на 4000

# терминал 2
cd client
npm run dev   # Next фронт на 3000
```
Перейдите на `http://localhost:3000`, создайте 3 пользователя (A/B/C) и проверьте DM и группу; API бэкенда слушает на `http://localhost:4000`.

### Docker
```bash
docker-compose up --build
```
Поднимет бэкенд на 4001 и фронт на 3000.

## Структура (основное)
- `client/src/app/api/*` — REST API (auth, users, conversations, messages, uploadthing).
- `client/src/pages/api/socket.ts` — Socket.IO сервер, привязанный к Next.
- `client/src/store/*` — Zustand стейты (auth, chats).
- `client/src/app/(auth)` — страницы логина/регистрации.
- `client/src/app/page.tsx` — основной интерфейс чатов (DM + Group, отправка текстов и картинок).

## Быстрые подсказки для демо
1. Зарегистрируйте 3 аккаунта (A, B, C) в разных окнах/браузерах.
2. Через поиск создайте DM между A и B, отправьте сообщения — они появятся realtime.
3. Создайте группу (минимум A, B, C), отправьте сообщения всеми тремя пользователями.
4. Перезагрузите страницу у любого — история подтянется из MongoDB.
