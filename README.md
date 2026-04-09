# OptiFi

A starter full-stack repository for an AI-powered personal finance product(OptiFi).

Current state:
- `backend/` working Django REST backend with auth, transactions, analytics, predictions, recommendations, and M-Pesa integration routes
- `mobile/` Expo app with implemented screens and API client hooks

## Repository Structure

```text
AI_Finance/
├── backend/
│   ├── config/                 # Django project settings + URL config
│   ├── users/                  # Auth + profile domain app
│   ├── transactions/           # Transactions, budgets, savings goals
│   ├── analytics/              # Dashboard + category breakdown
│   ├── predictions/            # Forecast + latest prediction
│   ├── recommendations/        # List + generate recommendations
│   ├── mpesa/                  # M-Pesa integration endpoints
│   ├── manage.py
│   └── requirements.txt
├── mobile/
│   ├── app/                    # Expo Router screens
│   ├── screens/                # Shared screens
│   ├── lib/                    # API client + auth helpers
│   ├── assets/
│   └── README.md               # Expo project notes
└── .gitignore
```

## Tech Stack

Backend:
- Python 3.12+
- Django 6.0.2
- Django REST Framework 3.16.1
- django-cors-headers 4.9.0
- SQLite (default local DB)

Mobile:
- Expo / React Native example projects
- JavaScript / TypeScript depending on selected example

## What Works Right Now

Backend:
- Django project boots successfully
- Admin route is available at `/admin/`
- SQLite database is configured
- Auth endpoints are wired (register/login/profile/refresh/password reset/Google sign-in)
- Transactions, budgets, savings goals, and categories APIs are wired
- Analytics, predictions, and recommendations endpoints are wired
- M-Pesa integration endpoints are wired

Mobile:
- Expo app is set up with file-based routing under `mobile/app/`
- Screens and API client helpers are implemented under `mobile/screens/` and `mobile/lib/`
- API base URL is configurable via `EXPO_PUBLIC_API_BASE_URL`

## Quick Start

### 1. Clone and enter the repo

```bash
git clone https://github.com/OderoCeasar/AI_Finance.git 
cd AI_Finance
```

### 2. Run the backend (Django)
python3 = Linux
python = Windows

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py runserver

# Creating admin user
python3 manage.py createsuperuser
```

Backend URLs:
- App: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`

### 3. Run a frontend (Expo)

Run the Expo app from `mobile/`:

```bash
cd mobile
pnpm install
pnpm start
```

## Environment and Configuration

Backend settings live in `backend/config/settings.py`.
Current defaults:
- `DEBUG = True`
- SQLite DB file: `backend/db.sqlite3`
- `ALLOWED_HOSTS = []`

Before production, you should:
- Move `SECRET_KEY` to environment variables
- Set `DEBUG = False`
- Configure `ALLOWED_HOSTS`
- Add CORS/CSRF origins for your frontend domain(s)
- Switch to PostgreSQL (recommended)

## API Status

The REST API is wired under the `/api/` prefix. Key endpoints include:

Auth:
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/google/`
- `GET /api/auth/profile/`
- `POST /api/auth/refresh/`
- `POST /api/auth/password-reset/`
- `POST /api/auth/password-reset/confirm/`

Transactions & Budgets:
- `GET/POST /api/transactions/`
- `PATCH/DELETE /api/transactions/{id}/`
- `GET/POST /api/budgets/`
- `GET/POST /api/savings-goals/`
- `GET/POST /api/categories/`

Analytics:
- `GET /api/analytics/dashboard/`
- `GET /api/analytics/spending-trend/`
- `GET /api/analytics/category-breakdown/`

Predictions:
- `POST /api/predictions/forecast/`
- `GET /api/predictions/latest/`

Recommendations:
- `GET /api/recommendations/`
- `POST /api/recommendations/generate/`

M-Pesa Integrations:
- `GET /api/integrations/mpesa/status/`
- `POST /api/integrations/mpesa/connect/`
- `POST /api/integrations/mpesa/confirm/`
- `POST /api/integrations/mpesa/disconnect/`
- `POST /api/integrations/mpesa/transactions/import/`

Planned API surface (suggested):
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/insights`
- `POST /api/ai/categorize`


## Development Notes

- Root `.gitignore` excludes Python virtualenvs, SQLite DB, environment files, Expo artifacts, and common lock files.
- Keep only one JS package manager lock file per app (`package-lock.json` or `yarn.lock` or `bun.lock`).

## License

No license file is currently present. Add a `LICENSE` file if this project will be distributed.
