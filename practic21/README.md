# Практическое занятие №21: Кэширование с использованием Redis

**Студент:** Кайзер Даниил Дмитриевич 
**Группа:** ЭФБО-08-24
**Дисциплина:** Фронтенд и бэкенд разработка  
**Тема:** Интеграция Redis для кэширования данных в учебном проекте "Мир чая".

## 1. Описание реализации

В рамках данного практического занятия была реализована система кэширования на базе **Redis** для снижения нагрузки на базу данных MongoDB и ускорения ответов сервера. Кэширование применяется к маршрутам чтения данных (GET-запросы) с автоматической инвалидацией при изменении данных.

### Ключевые изменения:

1.  **Интеграция Redis**:
    *   Подключена библиотека `redis` для взаимодействия с in-memory хранилищем.
    *   Реализован синглтон-сервис `CacheService` для управления подключением и операциями с кэшем.
    *   Настроено время жизни (TTL) для разных типов данных:
        *   Пользователи (`/api/users`): **60 секунд**.
        *   Товары (`/api/products`): **600 секунд (10 минут)**.

2.  **Архитектурные решения (SOLID & OOP)**:
    *   **SRP (Single Responsibility Principle)**: Логика работы с Redis вынесена в отдельный сервис (`src/services/CacheService.js`) и middleware (`src/middleware/cacheMiddleware.js`). Контроллеры не знают о наличии кэша.
    *   **OCP (Open-Closed Principle)**: Маршруты расширены функционалом кэширования через middleware, без изменения кода самих контроллеров.
    *   **Инкапсуляция**: Преобразование данных для кэша (сериализация/десериализация JSON) скрыто внутри сервиса.

3.  **Логика работы**:
    *   **Чтение (GET)**: Middleware проверяет наличие ключа в Redis. Если данные есть — возвращает их сразу (`source: "cache"`). Если нет — передает запрос контроллеру, получает ответ, сохраняет его в Redis и отдает клиенту (`source: "server"`).
    *   **Запись/Изменение/Удаление (POST/PUT/DELETE)**: Перед выполнением операции вызывается метод инвалидации кэша (`invalidatePattern`), который удаляет все ключи, связанные с изменяемой сущностью (например, `products:*`), чтобы клиент не получил устаревшие данные.

## 2. Структура проекта (Backend)

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # Подключение к MongoDB
│   │   └── swagger.js        # Конфигурация Swagger UI
│   ├── services/             # Новый слой сервисов
│   │   └── CacheService.js   # Сервис работы с Redis (Singleton)
│   ├── models/               # Mongoose Schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── RefreshToken.js
│   ├── repositories/         # Репозитории для MongoDB
│   │   ├── UserRepository.js
│   │   ├── ProductRepository.js
│   │   └── TokenRepository.js
│   ├── controllers/          # Бизнес-логика
│   │   ├── AuthController.js
│   │   ├── UserController.js
│   │   └── ProductController.js
│   ├── middleware/           # Express Middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── cacheMiddleware.js # Middleware для кэширования GET запросов
│   ├── routes/               # Маршрутизация с подключением кэша
│   │   └── index.js
│   └── uploads/              # Статические файлы
├── .env                      # Переменные окружения (MONGODB_URI, REDIS_URL)
├── server.js                 # Точка входа (инициализация DB и Redis)
└── package.json
```

## 3. Инструкция по запуску

### Предварительные требования
1.  Установленный **Node.js** (v16+).
2.  Установленная и запущенная **MongoDB**.
3.  Установленный и запущенный **Redis** (локально или через Docker).
4.  Менеджер пакетов `npm`.

### Шаг 1: Запуск Redis

**Вариант А: Через Docker (Рекомендуется)**
```bash
docker run -d --name redis-cache -p 6379:6379 redis
```

**Вариант Б: Локально на Arch Linux**
```bash
sudo systemctl start redis
# Или если службы нет:
redis-server
```

### Шаг 2: Настройка Backend

1.  Перейдите в папку `backend`:
    ```bash
    cd backend
    ```
2.  Установите зависимости (если еще не установлены):
    ```bash
    npm install
    npm install redis
    ```
3.  Создайте или обновите файл `.env`:
    ```env
    PORT=3000
    CLIENT_URL=http://localhost:3001
    ACCESS_SECRET=your_access_secret
    REFRESH_SECRET=your_refresh_secret
    
    # MongoDB
    MONGODB_URI=mongodb://127.0.0.1:27017/tea_shop_db
    
    # Redis (по умолчанию localhost:6379)
    REDIS_URL=redis://localhost:6379
    ```
4.  **(Опционально) Создайте администратора**, если база пуста:
    ```bash
    node src/config/initAdmin.js
    ```
5.  Запустите сервер:
    ```bash
    node server.js
    ```
    *Вы должны увидеть сообщения: `✅ Connected to MongoDB` и `✅ Connected to Redis`.*

### Шаг 3: Настройка Frontend

1.  В новом терминале перейдите в папку `frontend`:
    ```bash
    cd frontend
    ```
2.  Запустите клиентское приложение:
    ```bash
    npm start
    ```
3.  Приложение доступно по адресу `http://localhost:3001`.

## 4. Тестирование кэширования

### Данные для входа
*   **Email:** `admin@example.com`
*   **Пароль:** `admin123`

### Как проверить работу кэша:

1.  Откройте Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
2.  Авторизуйтесь через кнопку **Authorize** (используйте токен из `/api/auth/login`).
3.  Выполните запрос **GET /api/products**:
    *   **Первый раз:** В логах backend вы увидите `❄️ Cache MISS: products:all`. Ответ придет от сервера.
    *   **Второй раз (в течение 10 минут):** В логах backend вы увидите `💾 Cache HIT: products:all`. В теле ответа появится поле `"source": "cache"`.
4.  Измените любой товар через **PUT /api/products/{id}**:
    *   В логах backend вы увидите `🗑️ Invalidated ... keys for pattern: products:*`.
5.  Снова выполните **GET /api/products**:
    *   Снова будет `Cache MISS`, так как кэш был очищен при изменении товара.

## 5. Соответствие требованиям практики №21

| Требование | Реализация |
| :--- | :--- |
| **Подключение Redis** | Реализовано через `redis` client и сервис `CacheService`. |
| **Кэширование GET /users** | TTL 60 сек. Реализовано через `cacheMiddleware('users', 60)`. |
| **Кэширование GET /products** | TTL 600 сек. Реализовано через `cacheMiddleware('products', 600)`. |
| **Инвалидация кэша** | При POST/PUT/DELETE вызывается `cacheService.invalidatePattern()`. |
| **Принципы SOLID** | SRP (отдельный сервис кэша), OCP (middleware расширяет роуты). |