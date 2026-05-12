# 🍴 eda2da — Кулинарный помощник

> Полнофункциональное веб-приложение для поиска рецептов, планирования питания, генерации списков покупок и персонализированных рекомендаций.

[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Django%20%2B%20PostgreSQL-blue)](#)
[![Methodology](https://img.shields.io/badge/Methodology-Scrum-orange)](#)
[![Status](https://img.shields.io/badge/Status-Full%20Stack%20Ready-success)](#)
[![Docs](https://img.shields.io/badge/Docs-GitHub%20Wiki-lightgrey)](#)

---

## 📑 Содержание

1. [О проекте](#-о-проекте)
2. [Архитектура и стек технологий](#-архитектура-и-стек-технологий)
3. [Структура репозитория](#-структура-репозитория)
4. [Модель данных](#-модель-данных)
5. [Бизнес-логика](#%EF%B8%8F-ключевая-бизнес-логика)
6. [Быстрый старт (Docker)](#-быстрый-старт-docker-compose)
7. [Запуск без Docker](#-запуск-без-docker)
8. [Переменные окружения](#-переменные-окружения)
9. [API Endpoints](#-api-endpoints)
10. [Тестирование](#-тестирование)
11. [Git Flow](#-стратегия-ветвления-git-flow)
12. [Команда](#-команда-икбо-63-23)
13. [Статус проекта](#-текущий-статус-проекта)

---

## 🎯 О проекте

**eda2da** — трёхуровневое веб-приложение, которое помогает пользователям:

- 🔍 находить и фильтровать рецепты по ингредиентам, категории и КБЖУ;
- 📅 планировать питание на день, неделю или произвольный период;
- 🛒 автоматически формировать сводный список покупок;
- ⚖️ масштабировать порции с пересчётом веса и КБЖУ в реальном времени;
- ❤️ добавлять рецепты в избранное и оценивать их звёздами;
- 💬 оставлять отзывы на рецепты;
- 🚫 указывать персональные аллергены — рецепты с такими ингредиентами подсвечиваются;
- ✨ получать персональные рекомендации на основе избранного и оценок;
- 👥 разграничивать роли: гость, пользователь (Free / Pro / Family), администратор.

Проект полностью завершён: реализованы бэкенд и фронтенд, покрыты все пользовательские сценарии.

---

## 🏗 Архитектура и стек технологий

| Слой | Технология |
|------|-----------|
| **Тип системы** | Three-Tier Architecture |
| **Backend** | Python 3.12 + Django 5.0 |
| **API** | Django REST Framework 3.15 |
| **Database** | PostgreSQL 16 |
| **Containerization** | Docker / Docker Compose |
| **Auth** | JWT (`djangorestframework-simplejwt`) |
| **Documentation** | Swagger UI (`drf-spectacular`) |
| **Frontend** | React 18 + Vite (JavaScript) |
| **UI** | Inline styles, кастомная дизайн-система, тёмная/светлая тема |

---

## 📁 Структура репозитория

```
eda2da/
├── frontend/                   # React 18 + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js        # Centralized API client
│   │   ├── components/         # Landing-page компоненты
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Features.jsx
│   │   │   ├── Pricing.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AppContext.jsx  # Темы, i18n (ru/en), глобальное состояние
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Публичная посадочная страница
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx   # Основной SPA-дашборд (~2700 строк)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # Python 3.12 / Django REST Framework
│   ├── config/                 # settings.py, urls.py, Swagger
│   ├── users/                  # Пользователи, роли, JWT, аллергены
│   │   ├── models.py           # User, UserExclusion
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── recipes/                # Рецепты, ингредиенты, отзывы, рейтинги
│   │   ├── models.py           # Recipe, Ingredient, RecipeComposition,
│   │   │                       # Favorite, Rating, Review
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── migrations/
│   ├── mealplan/               # Планы питания, список покупок
│   ├── requirements.txt
│   └── manage.py
│
├── db/
│   └── erd.png                 # ERD-диаграмма
│
├── docs/                       # ТЗ, диаграммы, отчёты СИПИ
│
├── docker-compose.yml
├── .env.example
├── CHANGELOG.md
└── README.md
```

---

## 🗄 Модель данных

| Сущность | Назначение |
|----------|-----------|
| **User** *(Custom Model)* | Профиль: `role` (free/pro/family), `is_subscriber`, `bio`, `avatar` |
| **UserExclusion** | Персональные аллергены пользователя (M2M User ↔ Ingredient) |
| **Ingredient** | Справочник продуктов: название, ед. измерения, калорийность на 100г |
| **Recipe** | Рецепт: КБЖУ, сложность, время готовки, категория, статус модерации, `rejection_reason` |
| **RecipeComposition** | M2M «Рецепт ↔ Ингредиент» с количеством (`quantity`) |
| **Favorite** | Избранные рецепты пользователя |
| **Rating** | Оценка рецепта (1–5 звёзд), уникально на пару user+recipe |
| **Review** | Текстовый отзыв; `is_approved` — флаг видимости (модерация) |
| **MealPlan** | План питания на диапазон дат |
| **MealPlanRecipe** | Привязка рецепта к дате и приёму пищи (Завтрак / Обед / Ужин) |

ERD-диаграмма доступна в `db/erd.png`.

---

## ⚙️ Ключевая бизнес-логика

### ⚖️ Масштабирование порций
В модальном окне рецепта можно выбрать количество порций (×½, ×1, ×2, ×3, ×4) — все ингредиенты и КБЖУ пересчитываются в реальном времени.

### 🛒 Генератор списка покупок
`MealPlan.generate_shopping_list` агрегирует ингредиенты всех рецептов плана, суммируя одинаковые позиции.

### ✨ Персональные рекомендации
Эндпоинт `/recipes/recommendations/` находит рецепты, которые разделяют ингредиенты с теми, что пользователь добавил в избранное или оценил ≥4 звёзды. При малом количестве совпадений дополняется топом по среднему рейтингу.

### 🚫 Персональные аллергены (User Exclusions)
Пользователь задаёт список ингредиентов-аллергенов в профиле. В карточках и модальных окнах рецептов такие ингредиенты подсвечиваются красным с предупреждением ⚠️. На уровне API `get_queryset` исключает рецепты, содержащие запрещённые ингредиенты.

### 💬 Модерация отзывов (Admin)
Администратор видит все отзывы в отдельной вкладке панели. Доступны: скрыть (`is_approved=False`), показать снова, удалить. Обычные пользователи видят только одобренные отзывы.

### 📋 Модерация рецептов (Admin)
Новые рецепты от пользователей попадают в очередь на проверку (`is_moderated=False`). Администратор одобряет или отклоняет их с указанием причины, которая отображается автору.

### 🔐 Система прав доступа

| Уровень | Возможности |
|---------|-------------|
| `AllowAny` | Регистрация, просмотр Landing, одобренные рецепты |
| `IsAuthenticated` | Планы питания, избранное, оценки, отзывы, аллергены |
| `IsAuthenticatedOrReadOnly` | Создание рецептов |
| `IsAdminUser` | Модерация рецептов и отзывов, просмотр всех пользователей |

### 💳 Тарифные планы

| План | Ограничения |
|------|-------------|
| **Free** | До 50 рецептов, планы питания не более 7 дней |
| **Pro** | Неограниченные рецепты, любые сроки планов |
| **Family** | Все возможности Pro |

---

## 🚀 Быстрый старт (Docker Compose)

### Требования
- Docker `>= 24.0`
- Docker Compose `>= 2.0`

### Запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/dima5778/eda2da.git
cd eda2da

# 2. Скопировать и заполнить переменные окружения
cp .env.example .env

# 3. Поднять все сервисы
docker compose up --build -d

# 4. Применить миграции
docker compose exec backend python manage.py migrate

# 5. Создать суперпользователя (администратор)
docker compose exec backend python manage.py createsuperuser
```

### Доступные сервисы

| Сервис | URL |
|--------|-----|
| 🖥 Frontend (React) | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:8000/api/ |
| 📘 Swagger UI | http://localhost:8000/api/schema/swagger-ui/ |
| 🐘 pgAdmin | http://localhost:5050 |

---

## 💻 Запуск без Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔧 Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
POSTGRES_DB=eda2da
POSTGRES_USER=eda2da_user
POSTGRES_PASSWORD=your-db-password
POSTGRES_HOST=db
POSTGRES_PORT=5432

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60        # минуты
JWT_REFRESH_TOKEN_LIFETIME=7        # дни

# pgAdmin
PGADMIN_EMAIL=admin@eda2da.ru
PGADMIN_PASSWORD=admin
```

---

## 📍 API Endpoints

Полная интерактивная документация: 👉 **http://localhost:8000/api/schema/swagger-ui/**

### Пользователи (`/api/users/`)

| Метод | Endpoint | Доступ | Описание |
|-------|----------|--------|----------|
| `POST` | `/register/` | Все | Регистрация |
| `POST` | `/login/` | Все | Получение JWT-токенов |
| `POST` | `/token/refresh/` | Все | Обновление access-токена |
| `GET/PATCH` | `/me/` | Auth | Профиль текущего пользователя |
| `POST` | `/me/change_password/` | Auth | Смена пароля |
| `GET` | `/me/exclusions/` | Auth | Список аллергенов пользователя |
| `POST` | `/me/exclusions/add/` | Auth | Добавить аллерген |
| `DELETE` | `/me/exclusions/{ingredient_id}/` | Auth | Удалить аллерген |

### Рецепты (`/api/recipes/`)

| Метод | Endpoint | Доступ | Описание |
|-------|----------|--------|----------|
| `GET` | `/recipes/` | Все | Список рецептов (фильтры: search, category, КБЖУ) |
| `POST` | `/recipes/` | Auth | Создать рецепт |
| `GET/PATCH/DELETE` | `/recipes/{id}/` | Auth | Просмотр / редактирование / удаление |
| `POST` | `/recipes/{id}/favorite/` | Auth | Переключить избранное |
| `POST` | `/recipes/{id}/rate/` | Auth | Поставить оценку (1–5) |
| `GET/POST` | `/recipes/{id}/reviews/` | Auth | Отзывы рецепта |
| `POST` | `/recipes/{id}/approve/` | Admin | Одобрить рецепт |
| `POST` | `/recipes/{id}/reject/` | Admin | Отклонить с причиной |
| `GET` | `/recipes/pending/` | Admin | Очередь на модерацию |
| `GET` | `/recipes/recommendations/` | Auth | Персональные рекомендации |
| `GET` | `/recipes/all_reviews/` | Admin | Все отзывы |
| `DELETE` | `/recipes/reviews/{id}/` | Admin | Удалить отзыв |
| `POST` | `/recipes/reviews/{id}/hide/` | Admin | Скрыть отзыв |
| `POST` | `/recipes/reviews/{id}/approve/` | Admin | Показать отзыв |
| `GET` | `/ingredients/` | Все | Справочник ингредиентов (поиск: `?search=`) |

### Планы питания (`/api/mealplan/`)

| Метод | Endpoint | Доступ | Описание |
|-------|----------|--------|----------|
| `GET/POST` | `/plans/` | Auth | Список / создание плана |
| `GET/PATCH/DELETE` | `/plans/{id}/` | Auth | Управление планом |
| `GET` | `/plans/{id}/shopping_list/` | Auth | Список покупок для плана |
| `POST` | `/mealplan-recipes/` | Auth | Добавить рецепт в план |
| `DELETE` | `/mealplan-recipes/{id}/` | Auth | Убрать рецепт из плана |

---

## 🖥 Фронтенд: основные экраны

| Экран | Описание |
|-------|----------|
| **Landing** | Публичная страница с описанием продукта, тарифами, отзывами |
| **Login / Register** | JWT-авторизация |
| **Dashboard → Главная** | Статистика, избранное, персональные рекомендации |
| **Dashboard → Рецепты** | Сетка рецептов, поиск, фильтры по категории и КБЖУ, лимит Free |
| **Модальное окно рецепта** | Фото, описание, КБЖУ, масштабирование порций, ингредиенты с подсветкой аллергенов, пошаговая инструкция, звёзды, отзывы |
| **Dashboard → Планы питания** | Недельный планировщик с добавлением рецептов по дням |
| **Dashboard → Покупки** | Автогенерируемый агрегированный список |
| **Dashboard → Профиль** | Редактирование данных, смена пароля, аватар, управление аллергенами |
| **Dashboard → Админ** | Вкладки: рецепты на модерации / все рецепты / все отзывы |

Поддерживаются **тёмная и светлая темы**, язык интерфейса **RU / EN**.

---

## 🧪 Тестирование

```bash
# Backend (pytest)
cd backend
pytest --cov=. --cov-report=term-missing

# Frontend (Vite build check)
cd frontend
npm run build
```

---

## 🌿 Стратегия ветвления (Git Flow)

| Ветка | Назначение |
|-------|-----------|
| `main` | Стабильная production-ветка |
| `develop` | Основная ветка разработки |
| `feature/sprint-N-<name>` | Задачи спринта |
| `hotfix/<description>` | Срочные исправления в production |

> 🔍 Все изменения вносятся через **Pull Request** с code review минимум от одного участника.
>
> 📝 Commit-сообщения: `feat:`, `fix:`, `docs:`, `test:`, `refactor:` ([Conventional Commits](https://www.conventionalcommits.org/)).

---

## 👥 Команда (ИКБО-63-23)

| Роль | Участник |
|------|---------|
| 📊 Product Owner / Аналитик | **Поспелов Д.Д.** |
| 🎯 Scrum Master / Тестировщик | **Жулёв Е.А.** |
| 💻 Frontend / Backend разработчик | **Оганнисян Н.Г.** |
| ⚙️ Backend / Технический писатель | **Головач Н.Е.** |

---

## ✅ Текущий статус проекта

> **Проект полностью завершён: бэкенд и фронтенд реализованы.**
> Все функциональные требования Практик №1–8 реализованы и задокументированы.

### Реализованный функционал

- [x] Регистрация, авторизация (JWT), роли пользователей
- [x] CRUD рецептов с фото, КБЖУ, категорией, инструкцией
- [x] Модерация рецептов администратором (одобрить / отклонить с причиной)
- [x] Избранное и рейтинг рецептов (1–5 звёзд)
- [x] Отзывы к рецептам с модерацией (скрыть / показать / удалить)
- [x] Фильтрация рецептов по категории, поиску и КБЖУ
- [x] Масштабирование порций с пересчётом ингредиентов и КБЖУ
- [x] Персональные аллергены — подсветка опасных ингредиентов
- [x] Персональные рекомендации рецептов
- [x] Планирование питания по дням недели
- [x] Автоматическая генерация списка покупок
- [x] Тарифные планы: Free (50 рецептов, 7 дней плана) / Pro / Family
- [x] Тёмная / светлая тема
- [x] Двуязычный интерфейс (RU / EN)
- [x] Адаптивный SPA-дашборд
- [x] Модальное окно рецепта (overlay)
- [x] Административная панель с тремя вкладками

---

<p align="center">
  <sub>Сделано с ❤️ группой Astral · РТУ МИРЭА · Scrum, 5 спринтов по 2 недели</sub>
</p>
