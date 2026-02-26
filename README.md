# AI Finance

A starter full-stack repository for an AI-powered personal finance product.

Current state:
- `backend/` is a Django 6 starter project with two apps (`users`, `transactions`) created but not yet modeled.
- `frontend/` currently contains the Expo examples collection, plus many sample apps (not yet wired to the Django backend).

## Repository Structure

```text
ai_finance/
├── backend/
│   ├── config/                 # Django project settings + URL config
│   ├── users/                  # Planned user/account domain app
│   ├── transactions/           # Planned transaction domain app
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── README.md               # Expo examples documentation
│   ├── with-router/            # Example app templates
│   ├── with-router-ai/
│   └── ... many other Expo examples
└── .gitignore
```

## Tech Stack

Backend:
- Python 3.12+
- Django 6.0.2
- Django REST Framework 3.16.1
- django-cors-headers 4.9.0
- SQLite (default local DB)

Frontend:
- Expo / React Native example projects
- JavaScript / TypeScript depending on selected example

## What Works Right Now

Backend:
- Django project boots successfully
- Admin route is available at `/admin/`
- SQLite database is configured
- Two domain apps (`users`, `transactions`) are scaffolded

Frontend:
- Example Expo apps are available under `frontend/`
- Frontend is not yet standardized to a single app target for this repo

## Quick Start

### 1. Clone and enter the repo

```bash
git clone https://github.com/OderoCeasar/AI_Finance.git
cd AI_Finance
```

### 2. Run the backend (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend URLs:
- App: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`

### 3. Run a frontend example (Expo)

Pick one frontend example folder, then run it:

```bash
cd frontend/with-router
pnpm install
pnpm expo start
```

You can substitute `with-router` with any example in `frontend/`.

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

At the moment, no custom REST endpoints are wired in `backend/config/urls.py`.
Only the admin route is active:
- `GET /admin/`

Planned API surface (suggested):
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/insights`
- `POST /api/ai/categorize`

## Recommended Next Milestones

1. Define core data models in `users` and `transactions` apps.
2. Add DRF serializers, viewsets, and URL routing under `/api/`.
3. Pick one frontend app target (for example `with-router`) and remove unused examples.
4. Add `.env` support and production-safe settings split.
5. Add tests for model logic and API behavior.
6. Add CI (lint + tests) and deployment config.

## Development Notes

- Root `.gitignore` excludes Python virtualenvs, SQLite DB, environment files, Expo artifacts, and common lock files.
- Keep only one JS package manager lock file per app (`package-lock.json` or `yarn.lock` or `bun.lock`).

## License

No license file is currently present. Add a `LICENSE` file if this project will be distributed.
