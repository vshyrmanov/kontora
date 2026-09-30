# Контора

Система прийому відвідувачів і видачі документів: запис візитів, графік видачі, профілі клієнтів, статистика відвідуваності.

| Частина | Стек |
| --- | --- |
| `apps/web` | React 18, TypeScript, Vite, React Router 7, TanStack Query |
| `apps/api` | Node 22, Express 5, TypeScript, Mongoose 8, JWT |
| `packages/contracts` | Спільні zod-схеми, DTO-типи, логіка дат і статусів |
| БД | MongoDB 6+ (потрібні `$dateDiff` і `$lookup` з `pipeline`) |

## Швидкий старт

```bash
npm install                      # створює package-lock.json — закомітьте його
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker run -d --name kontora-mongo -p 27017:27017 mongo:7   # або свій MongoDB

npm run build -w @kontora/contracts
npm run seed -- --demo           # адміністратор + демо-дані
npm run dev:api                  # http://localhost:4000
npm run dev:web                  # http://localhost:5173
```

Вхід: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` з `apps/api/.env` (за замовчуванням `admin@kontora.local` / `admin12345`, змініть перед продакшеном).

Увесь стек у Docker: `cp .env.example .env && docker compose up --build`, далі http://localhost:8080. Seed у контейнері: `docker compose exec api node apps/api/dist/scripts/seed.js --demo`.

## Скрипти

| Команда | Що робить |
| --- | --- |
| `npm run typecheck` | Перевірка типів у всіх пакетах |
| `npm test` | Тести: контракти, утиліти фронту, інтеграційні тести API (MongoDB у памʼяті) |
| `npm run build` | Продакшен-збірка контрактів, API і фронту |

## Архітектура

```
packages/contracts/src
  documents.ts   типи документів і стандартні строки оформлення
  dates.ts       дати YYYY-MM-DD, часові пояси (без бібліотек)
  status.ts      статус видачі: waiting | today | overdue | issued
  series.ts      ряди для чартів (день / тиждень / місяць)
  schemas.ts     zod-схеми запитів — ті самі на фронті й бекенді
  dto.ts         форми відповідей API

apps/api/src
  config/env.ts        валідація змінних оточення
  models/              Client, Visit, User, Counter (атомарна нумерація К-2026/0001)
  modules/<feature>/   *.routes.ts (HTTP) → *.service.ts (логіка, Mongo)
  middleware/          auth (JWT, ролі), error-handler (єдиний формат помилок)

apps/web/src
  api/        http-клієнт, типізовані ендпоінти, хуки React Query
  auth/       сесія, захищені маршрути
  features/   сторінки: overview, visits, pickups, clients, stats, auth
  shared/     UI-компоненти, чарти, форматування, тема
  styles/     токени кольорів (світла/темна тема) і стилі
```

Принципи:

- **Контракт один.** Фронт і бек імпортують схеми й типи з `@kontora/contracts`, тож зміна поля ламає збірку в обох місцях одночасно.
- **Час установи.** «Сьогодні», фільтри за датами й статистика рахуються в `APP_TIMEZONE`. Момент візиту зберігається як `Date` (UTC), дати видачі — як `YYYY-MM-DD`.
- **Статус видачі не зберігається**, а обчислюється з `pickupDate`, `issuedAt` і сьогоднішньої дати, тому не застаріває.
- **Фільтри в URL.** Посиланням на відфільтрований список можна поділитися.
- **Один формат помилок:** `{ error: { code, message, details? } }`.

## API

Усі маршрути, крім `/api/health` і `/api/auth/login`, вимагають заголовок `Authorization: Bearer <token>`.

| Метод | Шлях | Опис |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Поточний користувач |
| GET | `/api/dashboard` | Зведення для головної |
| GET | `/api/clients?q&page&limit` | Клієнти з лічильниками візитів |
| POST | `/api/clients` | Створити клієнта (409, якщо телефон уже є) |
| GET | `/api/clients/:id` | Профіль і історія візитів |
| PATCH | `/api/clients/:id` | Оновити клієнта |
| GET | `/api/visits?q&type&status&clientId&from&to&page&limit` | Візити; `status`: `all` \| `planned` \| `done` |
| POST | `/api/visits` | `{ clientId \| newClient, date, type, pickupDate, note? }`; новий клієнт зі знайомим телефоном привʼязується до наявного |
| GET / PATCH | `/api/visits/:id` | Отримати / змінити візит |
| DELETE | `/api/visits/:id` | Видалити (лише `admin`) |
| POST / DELETE | `/api/visits/:id/issue` | Позначити документ виданим / скасувати видачу |
| GET | `/api/pickups?mode&q&from&to&page&limit` | Графік видачі; `mode`: `pending` \| `issued` \| `all` |
| GET | `/api/stats?from&to&type` | Статистика й ряди для чартів |

## Ролі

- `registrar` — усе, крім видалення візитів.
- `admin` — повний доступ.

## Що далі

- Керування користувачами (CRUD працівників) і зміна пароля.
- Редагування та скасування візитів в інтерфейсі (API вже є).
- SMS/email-нагадування клієнтам про готовність документа.
- Журнал дій (хто видав документ).
- httpOnly-cookie замість токена в `localStorage`, якщо фронт і API на одному домені.
