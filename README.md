# AI Assessment Creator

Full-stack AI-powered assessment generator. Teachers create an assignment brief, an LLM produces a structured question paper, and the result is delivered in real time via WebSocket and rendered as a clean, printable exam paper.

## Stack

**Frontend** — Next.js 14 (App Router) · TypeScript · Tailwind · Zustand · `socket.io-client`
**Backend** — Node.js · Express · TypeScript · MongoDB (Mongoose) · Redis · BullMQ · Socket.IO
**AI** — Pluggable LLM service (Groq / OpenAI / Anthropic / mock). Output is strictly parsed into a JSON schema — raw LLM text is never rendered.

## Architecture

```
                          ┌────────────────────────┐
   Teacher (Browser)      │  Next.js Frontend       │
   ──────────────────►    │  - Zustand store        │
                          │  - Socket.IO client     │
                          └────────────┬────────────┘
                                       │ POST /api/assignments
                                       ▼
                          ┌────────────────────────┐
                          │  Express API            │
                          │  - Validates input      │
                          │  - Creates Mongo doc    │
                          │  - Enqueues BullMQ job  │
                          └────────────┬────────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │  Redis + BullMQ Worker  │
                          │  - Builds prompt        │
                          │  - Calls LLM            │
                          │  - Parses JSON          │
                          │  - Saves to MongoDB     │
                          │  - Emits via Socket.IO  │
                          └────────────┬────────────┘
                                       │ assignment:update
                                       ▼
                          Teacher sees structured paper
```

## Features

### Assignment Creation
- File upload (PDF / TXT, optional)
- Due date, question types (MCQ / Short / Long / True-False), per-type count + marks
- Additional instructions
- Client + server validation (no empty / negative values)
- Zustand global store; Socket.IO room subscription per assignment

### AI Generation
- Input → structured prompt with strict JSON schema directive
- LLM response parsed and validated against schema before persisting
- Sections (A, B, …), per-question difficulty (easy / moderate / hard) and marks

### Output Page
- Student info header (Name / Roll No. / Section)
- Grouped sections with title and instruction
- Difficulty badges + marks per question
- Action bar: Regenerate · Download PDF
- Mobile responsive, print-friendly

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB running locally (`mongodb://localhost:27017`) or Atlas
- Redis running locally (`redis://localhost:6379`)
- An LLM API key (optional — falls back to deterministic mock generator)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # edit values
npm run dev            # starts API + worker on :4000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

### Environment

`backend/.env`
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/assessment_creator
REDIS_URL=redis://localhost:6379
LLM_PROVIDER=groq              # mock | openai | anthropic | groq
GROQ_API_KEY=gsk_...           # https://console.groq.com/keys
GROQ_MODEL=openai/gpt-oss-120b
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
CORS_ORIGIN=http://localhost:3000
```

`frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## API

| Method | Path                              | Purpose                              |
|--------|-----------------------------------|--------------------------------------|
| POST   | `/api/assignments`                | Create assignment & enqueue job      |
| GET    | `/api/assignments/:id`            | Fetch assignment + generated paper   |
| POST   | `/api/assignments/:id/regenerate` | Re-run generation                    |
| GET    | `/api/health`                     | Liveness                             |

### WebSocket events (room = `assignment:<id>`)
- `assignment:status` — `queued | processing | completed | failed`
- `assignment:update` — final structured paper payload

## Project layout

```
.
├── backend/
│   ├── src/
│   │   ├── config/        env + constants
│   │   ├── db/            mongo + redis clients
│   │   ├── models/        Mongoose schemas
│   │   ├── routes/        Express routes
│   │   ├── queue/         BullMQ queue + worker
│   │   ├── services/      LLM + parser
│   │   ├── ws/            Socket.IO bootstrap
│   │   └── index.ts
│   └── package.json
└── frontend/
    ├── app/
    │   ├── page.tsx              create form
    │   └── output/[id]/page.tsx  generated paper
    ├── components/
    ├── store/                    zustand
    ├── lib/                      api + socket
    └── package.json
```

## Notes
- LLM output is parsed via `JSON.parse` inside a `try/catch` and validated with a schema check before persistence — raw text never reaches the UI.
- The worker is started in the same process as the API for local DX; in production deploy it as a separate process.
- PDF download uses client-side rendering for fidelity to the on-screen layout.
