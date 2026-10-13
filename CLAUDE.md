# CLAUDE.md

## Project Overview

Local fullstack web application with a FastAPI backend and React + Vite frontend.

---

## Tech Stack

### Backend
- **Runtime**: Python 3.12+
- **Framework**: FastAPI
- **Config**: pydantic-settings + `.env`
- **Package manager**: uv
- **Typing**: strict — all functions must have type annotations

### Frontend
- **Framework**: React 18+
- **Bundler**: Vite
- **Language**: TypeScript (strict)
- **Package manager**: npm

### Database
- None

---

## Folder Structure

```
project/
├── CLAUDE.md
├── backend/
│   ├── pyproject.toml
│   ├── .env                  # local env vars, never commit
│   ├── .env.example          # committed template with dummy values
│   └── app/
│       ├── main.py           # FastAPI app init + router registration
│       ├── config.py         # pydantic-settings BaseSettings class
│       ├── routers/          # one file per resource (e.g. users.py)
│       ├── services/         # business logic, one file per domain
│       └── schemas/          # Pydantic models for request/response
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/       # reusable UI components
        ├── pages/            # one component per route
        ├── services/         # API call functions (fetch wrappers)
        └── types/            # TypeScript interfaces and types
```

---

## Backend Rules

### General
- Every function and method must have full type annotations (parameters + return type)
- Never put business logic in routers — routers call services, services do the work
- Schemas define the API contract; never expose internal data structures directly
- Keep `main.py` minimal: app creation, middleware, router includes only

### FastAPI conventions
- Use `APIRouter` in each router file, import and include in `main.py`
- Use Pydantic schemas for all request bodies and responses (`response_model=`)
- Use `status_code` explicitly on all endpoints
- Prefix all routers with `/api/v1/...`

### Config
- All configuration goes through `app/config.py` using `pydantic-settings`
- Load settings as a singleton: `get_settings()` with `@lru_cache`
- Never hardcode secrets or URLs — use `.env` variables
- Provide an `.env.example` with all required keys and dummy values

### File naming
- `snake_case` for all Python files and variables
- One router per resource, named after the resource (e.g. `routers/items.py`)
- One service per domain (e.g. `services/item_service.py`)

---

## Frontend Rules

### General
- TypeScript strict mode — no `any`, no implicit types
- One component per file, named in `PascalCase`
- API calls go exclusively in `src/services/` — never fetch directly in components
- Define all API response types in `src/types/`

### React conventions
- Prefer functional components with hooks
- Keep components focused — if a component exceeds ~100 lines, consider splitting it
- Props must be typed with an explicit interface

### File naming
- Components: `PascalCase.tsx`
- Services, utils, hooks: `camelCase.ts`
- Types: `camelCase.types.ts`

---

## Dev Setup

### Backend
```bash
cd backend
uv sync
cp .env.example .env
uv run uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### API base URL (local)
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Configure the proxy in `vite.config.ts` to forward `/api` to the backend

---

## What NOT to do

- Do not add a database unless explicitly requested
- Do not add tests or linting tooling unless explicitly requested
- Do not commit `.env` files
- Do not put logic in `main.py` beyond app wiring
- Do not use `any` in TypeScript
- Do not fetch data directly inside React components
