# Практическое занятие №23: Контейнеризация приложений с Docker

**Студент:** Кайзер Даниил Дмитриевич  
**Группа:** ЭФБО-08-24  
**Дисциплина:** Фронтенд и бэкенд разработка  
**ОС:** Arch Linux (нативный Docker, без WSL)

---

## 1. Цель

Реализация системы балансировки нагрузки с использованием Docker Compose, где каждый компонент приложения запущен в изолированном контейнере. Замена ручного запуска серверов (практика №22) на оркестрацию через Docker.

---

## 2. Архитектура решения

### Компоненты системы

| Сервис | Образ / Путь | Порт | Назначение |
|--------|-------------|------|------------|
| `nginx` | `nginx:latest` | 80→80 | Балансировщик нагрузки (точка входа) |
| `backend1` | `./backend` (Dockerfile) | 3000 (внутр.) | Экземпляр бэкенда #1 |
| `backend2` | `./backend` (Dockerfile) | 3000 (внутр.) | Экземпляр бэкенда #2 |
| `mongodb` | `mongo:6` | 27017 (внутр.) | База данных (хранение пользователей, товаров) |
| `redis` | `redis:7` | 6379 (внутр.) | Кэш-сервер (ускорение ответов) |
| `frontend` | Запускается на хосте | 3003 | Клиентское React-приложение |

> 🔒 Порты БД и Redis **не проброшены на хост** — доступ только из внутренней Docker-сети `app-network`.

### Алгоритмы балансировки

- **Round Robin** (по умолчанию в Nginx) — запросы распределяются по кругу между `backend1` и `backend2`.
- **Backup server** — резервный экземпляр используется только при недоступности основных (настраивается в `nginx.conf`).
- **Отказоустойчивость**:
  ```nginx
  server backend1:3000 max_fails=2 fail_timeout=30s;
  ```
  - `max_fails=2`: сервер исключается из ротации после 2 неудачных попыток.
  - `fail_timeout=30s`: сервер не используется в течение 30 секунд для восстановления.

### Структура проекта

```
practic23/
├── docker-compose.yml          # Оркестрация: 5 сервисов + сеть + тома
├── backend/
│   ├── Dockerfile              # Сборка Node.js приложения
│   ├── .dockerignore           # Исключения при сборке (node_modules, .env)
│   ├── package.json            # Зависимости (express, mongoose, redis, etc.)
│   ├── server.js               # Точка входа (с polyfill для crypto)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # Подключение к MongoDB (с опциями для Docker)
│   │   │   ├── initAdmin.js    # Скрипт инициализации администратора
│   │   │   └── swagger.js      # Настройка Swagger UI
│   │   ├── routes/             # Маршруты API (auth, products, users)
│   │   └── services/           # Бизнес-логика (CacheService, etc.)
│   └── uploads/                # Папка для загруженных файлов
├── nginx/
│   └── nginx.conf              # Конфиг балансировщика (upstream, CORS, proxy)
├── frontend/                   # React-приложение (запускается на хосте)
│   ├── src/
│   │   ├── api/                # Axios-клиент с интерцепторами
│   │   └── pages/              # Компоненты: Login, ProductsList, etc.
│   └── package.json
└── README.md                   # Этот файл
```

---

## 3. Инструкция по запуску

### Предварительные требования (Arch Linux)

```bash
# 1. Установить Docker и Compose
sudo pacman -S docker docker-compose

# 2. Запустить и включить демон Docker
sudo systemctl enable --now docker

# 3. Добавить пользователя в группу docker (чтобы не писать sudo)
sudo usermod -aG docker $USER
newgrp docker  # Применить группу без перезагрузки

# 4. Проверить установку
docker --version
docker compose version
```

### Запуск всего стека

```bash
# 1. Перейти в папку проекта
cd practic23

# 2. Собрать и запустить все сервисы
docker compose up --build

# 3. (Опционально) Запустить в фоновом режиме
# docker compose up --build -d
```

> ⏱ Первая сборка займёт 5–10 минут (скачивание образов, установка зависимостей).

### Запуск фронтенда (на хосте)

```bash
# В отдельном терминале, в папке frontend:
cd frontend
PORT=3003 npm start
```

> Фронтенд запускается **на хосте**, а не в Docker, чтобы упростить разработку и отладку.

### Остановка и очистка

```bash
# Остановить контейнеры (данные сохраняются в томах)
docker compose down

# Полная очистка (удалит тома с данными БД!)
# docker compose down -v
```

---

## 4. Тестирование и проверка

### ✅ Проверка балансировки

```bash
# Запросы должны чередоваться между backend-1 и backend-2
curl http://localhost/api/check-balance; echo
curl http://localhost/api/check-balance; echo
```

**Ожидаемый вывод:**
```json
{"message":"Response from backend server","serverId":"backend-1","port":"3000","instance":"backend3000"}
{"message":"Response from backend server","serverId":"backend-2","port":"3000","instance":"backend3000"}
```

### ✅ Проверка входа (аутентификация)

```bash
# Предварительно создать администратора (один раз):
docker compose exec backend1 node --experimental-global-webcrypto src/config/initAdmin.js

# Затем проверить вход:
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Ожидаемый ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

### ✅ Проверка отказоустойчивости

```bash
# 1. Остановить один backend-контейнер
docker compose stop backend1

# 2. Все запросы теперь идут на backend2
curl http://localhost/api/check-balance; echo
curl http://localhost/api/check-balance; echo

# 3. Вернуть сервис
docker compose start backend1
```

> Nginx автоматически исключит `backend1` из ротации на 30 секунд (`fail_timeout`), затем вернёт в баланс.

### ✅ Проверка через фронтенд

1.  Открой браузер: `http://localhost:3003`
2.  Войди: `admin@example.com` / `admin123`
3.  Убедись, что:
    -   Отображается список товаров
    -   Доступны кнопки **"Добавить товар"** и **"Управление пользователями"** (для админа)
    -   Запросы в DevTools → Network идут на `http://localhost/api/...`

### ✅ Проверка подключения к БД

```bash
# Подключиться к MongoDB внутри контейнера
docker compose exec mongodb mongosh tea_shop_db

# Проверить наличие администратора
db.users.findOne({ email: "admin@example.com" })

# Выйти
exit
```

---

## 5. Соответствие требованиям практики №23

| Требование | Реализация | Статус |
|------------|------------|--------|
| ≥2 backend-сервиса на Node.js | `backend1`, `backend2` в `docker-compose.yml` | ✅ |
| Nginx как балансировщик | Конфиг с `upstream`, `proxy_pass`, `max_fails` | ✅ |
| `docker-compose.yml` описывает весь стек | 5 сервисов + сеть `app-network` + том `mongo-data` | ✅ |
| `Dockerfile` для backend | Сборка на `node:18`, установка зависимостей, `CMD` | ✅ |
| Тестирование балансировки | Проверено через `curl`, чередование `serverId` | ✅ |
| Отказоустойчивость (`max_fails`/`fail_timeout`) | Добавлено в `nginx.conf` | ✅ |
| Health check при остановке контейнера | Трафик переключается автоматически | ✅ |
| Интеграция с фронтендом | Фронтенд на хосте, API через балансировщик | ✅ |

---

## 7. Полезные команды

```bash
# Просмотр запущенных контейнеров
docker compose ps

# Просмотр логов конкретного сервиса
docker compose logs -f backend1

# Вход внутрь контейнера для отладки
docker compose exec backend1 sh

# Перезапуск одного сервиса
docker compose restart nginx

# Очистка кэша сборки (если образ не обновляется)
docker builder prune -af

# Проверка синтаксиса nginx-конфига
docker compose exec nginx nginx -t
```

---
> 📌 **Примечание:** Проект разработан и протестирован на **Arch Linux** с нативным Docker. Для Windows/macOS может потребоваться корректировка путей и прав доступа к томам.