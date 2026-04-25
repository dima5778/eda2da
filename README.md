🍴 Проект «eda2da» (Кулинарный помощник) — Backend Engine
Данный документ является техническим описанием текущего состояния проекта. Бэкенд-часть («Двигатель») полностью реализована, протестирована и готова к интеграции с фронтендом.
🏗 Архитектура и Стек технологий
Тип системы: Трёхуровневое веб-приложение (Three-Tier Architecture).
Backend: Python 3.12 + Django 5.0.
API: Django REST Framework (DRF) 3.15.
Database: PostgreSQL 16.
Containerization: Docker / Docker Compose.
Auth: JWT (JSON Web Token) через djangorestframework-simplejwt.
Documentation: Swagger UI через drf-spectacular.
📁 Структура репозитория (Monorepo)
/backend — Исходный код сервера.
/config — Глобальные настройки Django, маршрутизация API и Swagger.
/users — Управление пользователями, ролями (GUEST, USER, SUBSCRIBER, MODERATOR) и JWT.
/recipes — Модели рецептов, ингредиентов и логика масштабирования порций.
/mealplan — Логика планирования питания и агрегации списка покупок.
/frontend — Заготовка под React-приложение.
/db — Схемы базы данных (ERD).
docker-compose.yml — Оркестрация всех сервисов.
🗄 Модель данных (Database Schema)
Реализованы следующие сущности:
User (Custom Model): Расширенный профиль с полями role, is_subscriber, preferences.
Ingredient: Справочник продуктов (название, единица измерения, калорийность, флаг аллергена).
Recipe: Заголовок рецепта (КБЖУ, сложность, время готовки, статус модерации).
RecipeComposition: Промежуточная таблица Many-to-Many между Рецептом и Ингредиентом с указанием веса (quantity).
MealPlan: План питания пользователя на диапазон дат.
MealPlanRecipe: Привязка конкретного рецепта к дате и типу приема пищи (Завтрак/Обед/Ужин).
⚙️ Ключевая бизнес-логика (Business Logic)
Масштабирование порций (scale_ingredients): Метод в модели Recipe, динамически пересчитывающий вес всех ингредиентов при изменении количества порций.
Генератор списка покупок (generate_shopping_list): Метод в модели MealPlan, который выполняет агрегацию (суммирование) всех ингредиентов из разных рецептов за выбранный период времени.
Система прав доступа:
AllowAny: Регистрация и просмотр списка проверенных рецептов.
IsAuthenticated: Управление личными планами питания и профилем.
IsAuthenticatedOrReadOnly: Создание контента (рецептов).
Admin/Moderator: Доступ к админ-панели и флагу is_moderated.
🚀 Инструкция по запуску для Разработчика / ИИ
Для развертывания проекта необходимо:
Создать файл .env на основе .env.example.
Запустить контейнеры:
code
Bash
docker compose up --build -d
Выполнить миграции базы данных:
code
Bash
docker compose exec backend python manage.py migrate
Создать суперпользователя:
code
Bash
docker compose exec backend python manage.py createsuperuser
📍 API Endpoints (Тестирование)
Полная интерактивная документация доступна после запуска по адресу:
👉 http://localhost:8000/api/schema/swagger-ui/
Основные маршруты:
POST /api/users/register/ — Регистрация.
POST /api/users/login/ — Получение JWT-токенов.
GET /api/recipes/recipes/ — Список всех одобренных рецептов.
GET /api/mealplan/plans/{id}/shopping_list/ — Генерация списка продуктов для плана.
Текущий статус проекта:
Бэкенд-часть полностью завершена. Все функциональные требования Практик №1–10 реализованы. Система готова к подключению фронтенд-интерфейса и реализации пользовательских сценариев.
В гитхабе вот как выглядит дерево должны быть также и уменя  


Name		
dima5778
dima5778
Create .env.example
9ef875b
 · 
last week
.github/workflows
Create frontend.yml
last week
backend
Create manage.py
last week
db
Create erd.png
last week
docs/source
Create s
last week
frontend
Create vite.config.js
last week
.env.example
Create .env.example
last week
CHANGELOG.md
Create CHANGELOG.md
last week
README.md
Update README.md
last week
docker-compose.yml
Create docker-compose.yml
last week
Repository files navigation
README
eda2da — Кулинарный помощник
Веб-приложение для поиска рецептов по ингредиентам, планирования питания и генерации списков покупок.

Стек: React + Django REST Framework + PostgreSQL
Методология: Scrum (5 спринтов по 2 недели)
Документация: GitHub Wiki

Быстрый старт (Docker Compose)
Требования
Docker >= 24.0
Docker Compose >= 2.0
Запуск
# 1. Клонировать репозиторий
git clone https://github.com/<org>/eda2da.git
cd eda2da

# 2. Скопировать и заполнить переменные окружения
cp .env.example .env

# 3. Поднять все сервисы
docker compose up --build
Приложение будет доступно по адресам:

Сервис	URL
Frontend (React)	http://localhost:5173
Backend API	http://localhost:8000/api/
Swagger UI	http://localhost:8000/api/schema/swagger-ui/
pgAdmin	http://localhost:5050
Переменные окружения
Скопируйте .env.example в .env и заполните значения:

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
Структура репозитория
eda2da/
├── frontend/               # React + Vite (JavaScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   ├── package.json
│   └── vite.config.js
├── backend/                # Python 3.12 / Django REST Framework
│   ├── recipes/            # Модели Recipe, Ingredient
│   ├── users/              # Модели User, Subscription
│   ├── mealplan/           # Модель MealPlan
│   ├── config/             # settings.py, urls.py
│   ├── requirements.txt
│   └── manage.py
├── db/                     # Миграции PostgreSQL, ERD-схемы
│   └── erd.png
├── docs/                   # ТЗ, диаграммы, Sphinx-документация
│   └── source/
├── .github/
│   └── workflows/
│       ├── backend.yml     # CI: pytest + pylint
│       └── frontend.yml    # CI: Jest + ESLint
├── docker-compose.yml
├── .env.example
├── CHANGELOG.md
└── README.md
Запуск без Docker
Backend
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Frontend
cd frontend
npm install
npm run dev
Тестирование
# Backend (pytest)
cd backend
pytest --cov=. --cov-report=term-missing

# Frontend (Jest)
cd frontend
npm test
Стратегия ветвления (Git Flow)
Ветка	Назначение
main	Стабильная production-ветка
develop	Основная ветка разработки
feature/sprint-N-<name>	Задачи спринта
hotfix/<description>	Срочные исправления в production
Все изменения вносятся через Pull Request с code review минимум от одного участника.
Commit-сообщения: feat:, fix:, docs:, test:, refactor: (Conventional Commits).

Команда (группа ИКБО-63-23)
Роль	Участник
Product Owner / Аналитик	Поспелов Д.Д.
Scrum Master / Тестировщик	Жулёв Е.А.
Frontend / Backend разработчик	Оганнисян Н.Г.
Backend / Технический писатель	Головач Н.Е.
