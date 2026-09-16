# LivePresentations

## Requisitos

- Node.js 20+
- Python 3.12+

## Instalación y ejecución

### 1. Clonar e instalar dependencias

**Windows (PowerShell):**

```powershell
git clone <url> LivePresentations
cd LivePresentations

# Backend - crear venv en la raíz
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r apps/backend/requirements.txt

# Frontend (otra terminal)
cd apps/frontend
npm install
```

**Linux / macOS:**

```bash
git clone <url> LivePresentations
cd LivePresentations

# Backend - crear venv en la raíz
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/backend/requirements.txt

# Frontend (otra terminal)
cd apps/frontend
npm install
```

> Si `python` no existe usa `python3` y `pip3`. La base de datos se crea automáticamente en `instance/livepresentations.db`.

### 2. Ejecutar

Ejecuta ambos comandos desde la **raíz** del proyecto con el venv activado.

**Windows:**

```powershell
# Terminal 1 - Backend (desde la raíz)
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000 --app-dir apps/backend

# Alternativa estando dentro de apps/backend:
# cd apps/backend; ..\..\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

**Linux / macOS:**

```bash
# Terminal 1 - Backend (desde la raíz)
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 --app-dir apps/backend

# Alternativa estando dentro de apps/backend:
# cd apps/backend && source ../../.venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

### 3. URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
