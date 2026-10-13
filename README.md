<h1 align="center">
  LivePresentations
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-111111?style=for-the-badge&logo=react">
  <img src="https://img.shields.io/badge/TypeScript-111111?style=for-the-badge&logo=typescript">
  <img src="https://img.shields.io/badge/Vite-111111?style=for-the-badge&logo=vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-111111?style=for-the-badge&logo=tailwindcss">
  <img src="https://img.shields.io/badge/Framer_Motion-111111?style=for-the-badge&logo=framer">
  <img src="https://img.shields.io/badge/Python-111111?style=for-the-badge&logo=python">
  <img src="https://img.shields.io/badge/FastAPI-111111?style=for-the-badge&logo=fastapi">
  <img src="https://img.shields.io/badge/SQLAlchemy-111111?style=for-the-badge&logo=sqlalchemy">
  <img src="https://img.shields.io/badge/Uvicorn-111111?style=for-the-badge">
</p>

<p align="center">
  <img src=".github/preview.png" alt="LivePresentations Preview"/>
</p>

LivePresentations is a platform for creating, presenting, and controlling slides in real-time from your mobile device. Features a visual editor with a draggable canvas, rooms with QR codes and WebSocket support, presenter/controller mode, interactive questions, project variables, and presentation export/import functionality.

---

## Features

- **Dashboard** to create and organize presentations, generate rooms with unique codes and QR codes, view active rooms, and join as a controller by scanning the QR code.
- **Visual editor** with a 1280×720 canvas where you can drag, resize, rotate, and reorder layers; add text with multiple fonts and optional background, images, shapes, videos from files or YouTube, icons, and syntax-highlighted code blocks.
- **Interactive questions** with configurable special blocks: customize block text and colors, define the question, answers, and up to two additional code blocks.
- **Participant raffle** using a list of names saved as a variable; draw randomly with an animated slider or spinning wheel, configure spin duration, and optionally exclude drawn names to avoid repetition during the presentation.
- **Fully customizable Q&A**: write your question and choose its color and alignment, set the number of answers to display (2-6), format (A-D letters, 1-4 numbers, or free text), customize each option's text, and mark the correct answer.
- **Project variables** reusable throughout the presentation: create numeric, text, boolean, list, and object variables with content validation and use them to power raffles and other content.
- **Configurable rooms**: when creating a room, decide whether to show navigation controls, fill the screen with the presentation, display an anti-spoiler countdown screen at the start, and whether the browser automatically enters fullscreen when presenting.
- **Live presentation** with two synchronized views: the presenter sees the current slide while the controller changes slides, highlights elements, triggers animations, expands code blocks with highlighted lines, and controls the entire Q&A flow from the mobile device.
- **Borderless fullscreen** that automatically adapts the size and position of all elements to the window size without black bars.
- **Export and import** complete presentations as `.zip` files that include general information, each slide separately, variables, and all uploaded assets, with support for the previous `.json` format.
- **Light and dark themes** switchable throughout the interface.
- **Google sign-in** next to email and password: new accounts take their name and picture from Google and can change both later. When the captcha is enabled, the Google button unlocks only after solving it.
- **Email verification** at sign-up with a one-time code sent through Resend. It cannot be skipped: no session is issued until the code is confirmed, and logging in again asks for it. Code lifetime and resend cooldown are configurable.
- **Cookie sessions**: a short-lived access token and a rotating refresh token in `HttpOnly` cookies, never readable from JavaScript or kept in browser storage.
- **Autosave** a couple of seconds after the last change, with a visible save status and a warning before leaving with unsaved work.
- **Public rooms**: an optional viewer link (`/watch/<code>`) lets anyone follow the presentation without an account. Viewers cannot control it; they can look back at earlier slides and return to the live one.
- **Richer editor**: 16 shape variants, lines and arrows, tables, freehand drawing, undo/redo history, duplicate, copy/paste, canvas alignment, layer ordering, keyboard nudging and zoom-to-fit.
- **Live annotations from the controller**: draw on the current slide with pen or highlighter, point with a laser pointer and black out the screen, all synced to the presenter in real time.
- **Tutorial library** inside the editor with guided step-by-step tours and a keyboard shortcut reference.
- **AI assistant** in a floating chat window that creates and edits slides through tool calls. It runs on the server and talks to the editor over a WebSocket: changes appear on the canvas as they happen, each one can be accepted or discarded, replies render Markdown, and the conversation is stored per presentation. Users bring their own API key (Gemini, NVIDIA NIM, OpenAI, Groq, OpenRouter, Mistral, DeepSeek or any OpenAI-compatible endpoint); keys are encrypted at rest and never returned to the browser. A usage dashboard shows tokens per day and per model.

---

## Architecture

Monorepo with `apps/frontend` + `apps/backend` using feature-based architecture. Frontend: `React 19 + TypeScript + Vite + Tailwind 4 + Framer Motion + Zustand` organized under `src/features/` (`editor/`, `player/`, `room/`) with base components in `src/components/ui/` (`Button`, `Modal`, `Select`, `Checkbox`, `CodeBlock`). Room state managed with `useRoom` and presentation data validated with `zod` (`presentationDataSchema`). Backend: `FastAPI + SQLAlchemy 2.0 (async) + aiosqlite + Uvicorn` with `app/api/routes/` (`auth`, `users`, `presentations`, `rooms`, `uploads`, `ai`), `app/services/presentation_package.py` for zip operations, `app/services/ai/` for the provider layer (subclass `AIProvider` and register it to add a provider), and `app/ws/events/` for room events: each event is a `RoomEvent` subclass with a pydantic payload, registered with `@room_events.register`, while `SPECIALS_*/ELEMENT_*/CUSTOM_*` messages are still rebroadcast untouched so new element types need no backend change. SQLite database stored at `instance/livepresentations.db`. Frontend uses only `zustand` for external state management (`auth`/`theme`).

---

## Requirements

- Node 18+
- Python 3.10+
- Docker & Docker Compose (optional, for containerized deployment)

---

## Quick Start with Docker (Recommended)

The easiest way to get the project running is with Docker Compose:

```bash
git clone https://github.com/Zerik-Official/LivePresentations
cd LivePresentations
cp .env.example .env
docker-compose up
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

To stop the services:

```bash
docker-compose down
```

To rebuild the images:

```bash
docker-compose up --build
```

---

## Manual Setup (Development)

### Clone the repository

```bash
git clone https://github.com/Zerik-Official/LivePresentations
cd LivePresentations
```

### Frontend Setup

```bash
cd apps/frontend
npm install
```

### Backend Setup

**Windows:**

```bash
cd apps/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

**Linux / macOS:**

```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

---

## Running the Application

> For local network testing, ensure your presenter and controller are connected to the same network for real-time WebSocket communication.

### Frontend (Vite Development Server)

From the `apps/frontend` directory:

```bash
npm run dev -- --host
```

Available at `http://localhost:5173` and `http://<your-ip>:5173` for mobile devices.

### Backend (Uvicorn Development Server)

From the `apps/backend` directory:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at `http://localhost:8000`, documentation at `http://localhost:8000/docs`, WebSockets at `/ws/room/{code}` (live rooms) and `/ws/assistant/{presentation_id}` (AI assistant).

#### Configuration

Settings are read from `apps/backend/.env`:
- `SECRET_KEY`: JWT secret key (generate with `openssl rand -hex 32`)
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g., `http://localhost:5173,http://localhost:3000`)
- `ENABLE_TURNSTILLE_CAPTCHA`: Enable Cloudflare Turnstile CAPTCHA (default: `true`)
- `TURNSTILE_PUBLIC_KEY` & `TURNSTILE_PRIVATE_KEY`: Only required if CAPTCHA is enabled
- `UPLOAD_QUOTA_MB`: Maximum upload size per user in MB (default: 20)
- `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS`: Lifetime of the access token (default: 15 minutes) and of the refresh token that renews it (default: 30 days). Both travel in `HttpOnly` cookies; `COOKIE_SECURE` defaults to `true` in production and `COOKIE_DOMAIN` is optional.
- `EMAIL_VERIFICATION_ENABLED`: Require the emailed code before a new account can log in (default: `true`).
- `RESEND_API_KEY` / `EMAIL_FROM`: Resend credentials and sender (e.g. `LivePresentations <no-reply@yourdomain.com>`, on a domain verified in Resend). Without a key in development the code is printed in the backend log; in production the server refuses to start without it while verification is enabled.
- `OTP_EXPIRE_MINUTES` / `OTP_RESEND_COOLDOWN_SECONDS` / `OTP_MAX_ATTEMPTS`: How long a code is valid (default: 10), how often a new one can be requested (default: 60) and how many wrong tries a code allows (default: 5).
- `PUBLIC_ROOM_MAX_VIEWERS`: Maximum simultaneous viewers of a public room (default: 300).
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Web client ID that enables Google sign-in. Create it in Google Cloud Console → APIs & Services → Credentials and add your frontend origin (e.g. `http://localhost:5173`) to "Authorized JavaScript origins". Leave empty to hide the Google button.
- `AI_ENCRYPTION_KEY`: Key used to encrypt users' AI provider API keys at rest (generate with `openssl rand -hex 32`). Falls back to `SECRET_KEY` when empty; changing either makes stored keys unreadable.
- `AI_ALLOW_PRIVATE_BASE_URLS`: Allow `http://` and private-network URLs for the "OpenAI-compatible" provider, for self-hosted models such as Ollama (default: `false`; keep it off on shared servers).

If no `.env` file exists, CORS will be open to all origins. Set `CORS_ORIGINS` to your real origins in production: besides CORS, it is the list of sites allowed to open the app's WebSockets with a user's session.

In development, the frontend proxies API requests to `http://localhost:8000`. On desktop, open `http://<your-ip>:8000/docs` to test the API.

### Production Build

```bash
cd apps/frontend
npm run build
```

Generates `dist/` ready for deployment.

---

## Deployment

- [deploy/aws/README.md](deploy/aws/README.md) - Single EC2 deployment with Nginx reverse proxy and Docker Compose (`web` + `backend`, SQLite volume, no public backend ports).

---

## Documentation

For more detailed information, check the documentation in the `docs/` folder:

- [DOCKER.md](docs/DOCKER.md) - Comprehensive Docker and Docker Compose guide
- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Quick deployment reference
- [SETUP_COMPLETE.md](docs/SETUP_COMPLETE.md) - Setup verification and next steps

---