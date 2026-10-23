# Resume Optimizer

Turn your CV into a structured, editable format and generate a LaTeX resume tailored to a specific job offer — powered by an LLM, running entirely on your machine.

## Features

- **CV parsing** — paste your CV (plain text or LaTeX); an LLM extracts it into structured JSON (summary, education, experiences, projects, skills, languages, interests).
- **Editable review** — correct, add or remove items per section, and mark items as *required* so they are never dropped.
- **Job offer extraction** — paste a job offer or its URL; a LangGraph agent fetches the page and keeps only the offer.
- **Job adaptation** — paste a job offer; the LLM keeps only the most relevant items. It is instructed to never invent content and to always keep required items.
- **Cover letter** — when a job offer is given, generate an English cover letter built only from your CV and the offer; edit it, copy it as plain text or download it as a PDF.
- **LaTeX export** — generate a `.tex` resume from a clean template, either from the current session or from a previously saved JSON.
- **Separate personal info** — your name and contact details are kept in their own `personal_info.json`, used only for the resume header and never sent to the LLM.
- **JSON export / import** — save your structured CV and personal info, and reuse them later without re-parsing.

## How it works

```
React + Vite (localhost:5173) ──/api──▶ FastAPI (localhost:8000) ──▶ Groq LLM API
```

1. **Parse** — `POST /api/v1/resume/parse`
2. **Edit** — in the browser, nothing is stored server-side
3. **Adapt** *(optional)* — `POST /api/v1/resume/adapt`
4. **Export** — `POST /api/v1/latex/generate` returns `cv.tex`
5. **Cover letter** *(optional)* — `POST /api/v1/cover-letter/generate`, then `POST /api/v1/cover-letter/pdf`

There is no database: your data lives in the browser session and in the JSON files you choose to download.

## Tech stack

| Layer    | Tools |
|----------|-------|
| Backend  | Python 3.13, FastAPI, Pydantic / pydantic-settings, [uv](https://docs.astral.sh/uv/) |
| Frontend | React 19, TypeScript (strict), Vite, npm |
| Agents   | [LangGraph](https://langchain-ai.github.io/langgraph/) + [langchain-groq](https://python.langchain.com/docs/integrations/chat/groq/) |
| LLM      | [Groq](https://console.groq.com/) — `openai/gpt-oss-120b` by default |
| Output   | LaTeX (`CV_template.tex`) for the resume, PDF via [reportlab](https://www.reportlab.com/) for the cover letter |

## Getting started

### Prerequisites

- Python 3.13+ and [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 20+ and npm
- A free [Groq API key](https://console.groq.com/keys)
- *(optional)* A LaTeX distribution (TeX Live, MiKTeX) or [Overleaf](https://www.overleaf.com/) to compile the generated `.tex` into a PDF

### Backend

```bash
cd backend
uv sync
cp .env.example .env        # then set GROQ_API_KEY in .env
uv run uvicorn app.main:app --reload
```

API docs are available at http://localhost:8000/docs.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

### Configuration

| Variable       | Description                  | Default                 |
|----------------|------------------------------|-------------------------|
| `GROQ_API_KEY` | Your Groq API key (required) | —                       |
| `GROQ_MODEL`   | Groq model to use            | `openai/gpt-oss-120b`   |

## Project structure

```
backend/app/
├── main.py        # app wiring only
├── config.py      # settings from .env
├── routers/       # HTTP endpoints (/api/v1/...)
├── services/      # business logic (LLM calls, parsing, LaTeX generation)
└── schemas/       # Pydantic request/response models
frontend/src/
├── pages/         # one component per step
├── components/    # reusable UI
├── services/      # API calls
└── types/         # TypeScript types
```

## Roadmap

- [ ] Agent-based pipeline (e.g. LangGraph): an experience-selection agent followed by a hallucination-check agent that verifies every output item exists in the source CV
- [ ] Add different CV templates
- [ ] Support for other LLM providers and local models
- [ ] PDF compilation directly from the app

## Privacy

Your CV is sent to the configured LLM provider (Groq by default) for parsing and adaptation. Nothing else leaves your machine.

## License

[GNU Affero General Public License v3.0](LICENSE). You may use, modify and self-host this project; if you run a modified version as a network service, you must make its source code available under the same license.
