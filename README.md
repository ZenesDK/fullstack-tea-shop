# Контрольная работа №4: Полнофункциональное веб-приложение "Мир чая"

**Студент:** Кайзер Даниил Дмитриевич  
**Группа:** ЭФБО-08-24  
**Дисциплина:** Фронтенд и бэкенд разработка  
**Семестр:** 4 семестр, 2025/2026 уч. год  
**Институт:** ИПТИП  
**Кафедра:** Индустриального программирования  
**Преподаватели:** Загородних Н.А., Краснослободцева Д.Б., Бочаров М.И.

---

## 📝 Описание проекта

В рамках контрольной работы №4 реализовано полнофункциональное веб-приложение **"Мир чая"** с полным циклом backend-разработки: от реляционных и NoSQL баз данных до кэширования, балансировки нагрузки и контейнеризации.

Проект демонстрирует:
- ✅ **Гибкость архитектуры** — возможность работы с разными СУБД (PostgreSQL, MongoDB) без изменения бизнес-логики
- ✅ **Производительность** — кэширование через Redis с автоматической инвалидацией
- ✅ **Масштабируемость** — балансировка нагрузки через Nginx (Round Robin + отказоустойчивость)
- ✅ **Портативность** — полная контейнеризация стека через Docker Compose
- ✅ **Безопасность** — JWT-аутентификация, RBAC (Role-Based Access Control), хеширование паролей
- ✅ **Чистый код** — принципы SOLID, паттерн Repository, middleware-архитектура

---

## 🏗️ Архитектура системы

### Компоненты системы
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    React (Port 3003)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Port 80)                          │
│              Load Balancer / Reverse Proxy                  │
└─────────┬────────────────────────────────┬──────────────────┘
          │                                │
          ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│   Backend #1    │              │   Backend #2    │
│  (Port 3000)    │              │  (Port 3000)    │
│  SERVER_ID=1    │              │  SERVER_ID=2    │
└─────────────────┘              └───────┬─────────┘
         │                               │
         └───────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │     Redis       │
│  (Port 27017)   │    │   (Port 6379)   │
│   (Database)    │    │    (Cache)      │
└─────────────────┘    └─────────────────┘
```

### Таблица сервисов
| Сервис | Образ / Путь | Порт | Назначение |
|--------|-------------|------|------------|
| `nginx` | `nginx:latest` | 80→80 | Балансировщик нагрузки, проксирование статики |
| `backend1` | `./backend` | 3000 (внутр.) | Экземпляр API #1 |
| `backend2` | `./backend` | 3000 (внутр.) | Экземпляр API #2 |
| `mongodb` | `mongo:6` | 27017 (внутр.) | Документоориентированная БД |
| `redis` | `redis:7` | 6379 (внутр.) | In-memory кэш |
| `frontend` | Запускается на хосте | 3003 | Клиентское React-приложение |

>  Порты БД и Redis **не проброшены на хост** — доступ только из внутренней Docker-сети `app-network`.

---

## 📚 Реализованные практические работы

###  Практика №19: Работа с реляционными СУБД (PostgreSQL)
- **Цель:** Миграция с JSON-хранилища на PostgreSQL.
- **Реализация:** 
  - Созданы таблицы `users`, `products`, `refresh_tokens` с внешними ключами.
  - Внедрён паттерн Repository для абстракции SQL-запросов.
  - Использован драйвер `pg` с пулом соединений и параметризованными запросами.
  - Реализован маппинг `snake_case` ↔ `camelCase`.

### 🔹 Практика №20: Работа с NoSQL СУБД (MongoDB)
- **Цель:** Миграция на документоориентированную СУБД.
- **Реализация:**
  - Mongoose-схемы с валидацией (`required`, `unique`, `enum`).
  - Сохранена архитектура Repository Pattern (DIP).
  - Автоматическая генерация `ObjectId`, гибкая структура документов.
  - Сравнительный анализ с PostgreSQL добавлен в документацию.

### 🔹 Практика №21: Кэширование с использованием Redis
- **Цель:** Снижение нагрузки на БД и ускорение ответов.
- **Реализация:**
  - Singleton-сервис `CacheService` + middleware `cacheMiddleware`.
  - TTL: `/api/users` → 60 сек, `/api/products` → 600 сек.
  - Автоматическая инвалидация при POST/PUT/DELETE (`invalidatePattern`).
  - Ответы содержат метаданные: `"source": "cache" | "server"`.

###  Практика №22: Балансировка нагрузки
- **Цель:** Распределение трафика между экземплярами backend.
- **Реализация:**
  - Nginx `upstream` с алгоритмом Round Robin.
  - Отказоустойчивость: `max_fails=2 fail_timeout=30s`.
  - Резервный сервер (`backup`) для graceful degradation.
  - Тестирование чередования ответов и failover-сценариев.

### 🔹 Практика №23: Контейнеризация с Docker
- **Цель:** Развёртывание микросервисного стека.
- **Реализация:**
  - `Dockerfile` на базе `node:18` (Debian).
  - `docker-compose.yml` с 5 сервисами, сетью `app-network` и именованным томом `mongo-data`.
  - Nginx обращается к backend по именам сервисов (`backend1:3000`).
  - Polyfill для Web Crypto API решён на уровне кода.

---

## ️ Технологический стек

| Слой | Технологии |
|------|------------|
| **Frontend** | React 19, React Router DOM 7, Axios 1, Sass, localStorage (tokens/role) |
| **Backend** | Node.js 18, Express 5, JWT, bcrypt, Multer, Swagger UI |
| **Базы данных** | PostgreSQL (pg), MongoDB (Mongoose), Redis (redis) |
| **DevOps** | Docker, Docker Compose, Nginx, HAProxy (альтернатива) |
| **ОС** | Arch Linux (нативный Docker, без WSL) |

---

## 📁 Структура проекта

```
kr4-control-work/
├── backend/
│   ├── src/
│   │   ├── config/           # db.js, initAdmin.js, swagger.js
│   │   ├── models/           # Mongoose схемы
│   │   ├── repositories/     # Абстракция доступа к данным (SOLID)
│   │   ├── controllers/      # Бизнес-логика
│   │   ├── services/         # CacheService.js
│   │   ├── middleware/       # auth, role, cache, upload
│   │   └── routes/           # Маршрутизация
│   ├── uploads/              # Статические файлы
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── server.js             # Точка входа + crypto polyfill
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client + interceptors
│   │   ├── pages/            # Login, Register, ProductsList, UsersManagement
│   │   └── App.jsx
│   └── package.json
├── nginx/
│   └── nginx.conf            # Балансировщик + CORS + uploads proxy
├── docker-compose.yml        # Оркестрация всего стека
── haproxy.cfg               # Альтернативный балансировщик
└── README.md                 # Этот файл
```

---

## 🚀 Инструкция по запуску

### Вариант А: Docker Compose (рекомендуется)

1. **Установка Docker (Arch Linux)**
   ```bash
   sudo pacman -S docker docker-compose
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Запуск стека**
   ```bash
   cd kr4-control-work
   docker compose up --build
   # Для фонового режима: docker compose up -d --build
   ```

3. **Инициализация администратора**
   ```bash
   docker compose exec backend1 node --experimental-global-webcrypto src/config/initAdmin.js
   ```

4. **Запуск фронтенда (на хосте)**
   ```bash
   cd frontend
   PORT=3003 npm start
   ```
   Приложение доступно: `http://localhost:3003`

### Вариант Б: Локальный запуск

1. **Запуск БД и кэша**
   ```bash
   # MongoDB
   mongod --dbpath ~/mongo-data --port 27017
   # Redis
   sudo systemctl start redis
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   # Создайте .env с MONGODB_URI, REDIS_URL, CLIENT_URL=http://localhost:3003
   node src/config/initAdmin.js
   PORT=3000 node server.js
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   PORT=3003 npm start
   ```

---

## 🧪 Тестирование и проверка

### 🔐 Аутентификация
```bash
# Вход
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
# Ответ: {"accessToken":"...","refreshToken":"..."}
```

### ️ Балансировка нагрузки
```bash
# Запросы чередуются между backend-1 и backend-2
curl http://localhost/api/check-balance; echo
curl http://localhost/api/check-balance; echo
# Ответы: {"serverId":"backend-1",...} / {"serverId":"backend-2",...}
```

### 💾 Кэширование
```bash
# Первый запрос (Cache MISS)
curl http://localhost/api/products
# Логи backend: ❄️ Cache MISS: products:all

# Второй запрос (Cache HIT)
curl http://localhost/api/products
# Логи backend: 💾 Cache HIT: products:all
# Ответ содержит: "source": "cache"
```

### 🛡️ Отказоустойчивость
```bash
# Остановить backend1
docker compose stop backend1

# Все запросы идут на backend2
curl http://localhost/api/check-balance

# Вернуть сервис
docker compose start backend1
# Через 30 сек (fail_timeout) балансировка восстанавливается
```

###  Проверка БД
```bash
docker compose exec mongodb mongosh tea_shop_db
> db.users.findOne({ email: "admin@example.com" })
> exit
```

---

## ✅ Соответствие требованиям

| Практика | Требование | Реализация | Статус |
|----------|------------|------------|--------|
| **№19** | Использование PostgreSQL | Полная миграция, таблицы с FK, пул соединений | ✅ |
| **№19** | CRUD операции | Реализованы через параметризованные SQL-запросы | ✅ |
| **№19** | Чистый код (SOLID) | Паттерн Repository, разделение слоёв | ✅ |
| **№20** | Использование MongoDB | Mongoose схемы, валидация, гибкая структура | ✅ |
| **№20** | Подключение из Node.js | Singleton-подключение, async/await | ✅ |
| **№21** | Подключение Redis | Сервис `CacheService`, middleware | ✅ |
| **№21** | Кэширование GET /users & /products | TTL 60с / 600с, инвалидация при мутациях | ✅ |
| **№22** | ≥2 backend-сервера | Серверы на 3000, 3001, 3002 (локально) / контейнеры | ✅ |
| **№22** | Nginx как балансировщик | `upstream`, `proxy_pass`, `max_fails` | ✅ |
| **№22** | Отказоустойчивость | `max_fails=2`, `fail_timeout=30s`, backup | ✅ |
| **№23** | Dockerfile для backend | `node:18`,多层缓存, `CMD` | ✅ |
| **№23** | docker-compose.yml | 5 сервисов, сеть, тома, переменные окружения | ✅ |
| **№23** | Тестирование в WSL/Docker | Проверено через `curl`, логи, `docker compose` | ✅ |

---
> 📌 **Примечание:** Проект разработан и протестирован на **Arch Linux** с нативным Docker. Репозиторий открыт для проверки. Все практические работы №19–№23 интегрированы в единый стек и успешно проходят тесты балансировки, кэширования и отказоустойчивости.