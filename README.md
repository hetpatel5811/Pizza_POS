# Pizza_POS

Full-stack Pizza POS project with:
- FastAPI backend
- Next.js frontend

## Project Structure

- `POS BackendChatGPT/POS Backend` -> backend API
- `POS Frontend/POS Frontend` -> frontend app

## Backend Setup (FastAPI)

```powershell
cd "POS BackendChatGPT/POS Backend"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend API docs:
- `http://localhost:8000/docs`

## Frontend Setup (Next.js)

```powershell
cd "POS Frontend/POS Frontend"
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Frontend default URL:
- `http://localhost:3000`

## Docker Setup (Frontend + Backend + Postgres)

From project root:

```powershell
docker compose up --build
```

Run in background:

```powershell
docker compose up --build -d
```

Stop containers:

```powershell
docker compose down
```

Stop and remove DB volume too:

```powershell
docker compose down -v
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Postgres: `localhost:5432`

Docker files added:
- `POS BackendChatGPT/POS Backend/Dockerfile`
- `POS BackendChatGPT/POS Backend/.dockerignore`
- `POS Frontend/POS Frontend/Dockerfile`
- `POS Frontend/POS Frontend/.dockerignore`
- `docker-compose.yml`

## Environment Files

- Backend example: `POS BackendChatGPT/POS Backend/.env.example`
- Frontend example: `POS Frontend/POS Frontend/.env.local.example`

Keep real `.env` files private. They are ignored by `.gitignore`.
