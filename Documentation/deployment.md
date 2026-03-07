# Deployment

## Prerequisites
- Docker and Docker Compose installed on the host machine
- Access to the server / VPS
- Environment variables configured (see below)

## Deployment Process

1. SSH into the server
2. Clone the repository
```
   git clone https://github.com/Plymouth-University/comp2003-2025-2026-team-23.git
   cd comp2003-2025-2026-team-23/SourceCode
```
3. Copy and configure the environment and settings files
```
   cp backend/.env.example backend/.env
   nano backend/.env
   nano frontend/settings.js
```
4. Build and start the containers
```
   docker compose up --build -d
```
5. Confirm containers are running
```
   docker compose ps
```

## Services
| Service | Description | Port |
|---|---|---|
| `backend` | Backend API | `3000` |
| `frontend` | Peelback Frontend | `80` / `443` |


# Frontend
## Settings
Edit the values in `settings.js` before deploying.

| Variable | Description | Example |
|---|---|---|
| `backendURL` | URL that the backend is running on | `http://127.0.0.1:3000/api` |

# Backend
## Settings
Edit the values in `.env` before deploying.

| Variable | Description | Example |
|---|---|---|
| `OPENAI_API_KEY` | API key generated for chatGPT | [] |
| `port` | Port that the backend will run on (Default 3000) | `3000` |
| `frontendURL` | URL that the frontend is running on | `http://127.0.0.1:80` |
| `testingMode` | Defines if the api should actually ping the ai or not | `False` |

## Stopping
```
docker compose down
```

## Updating
To deploy a new version:
```
git pull
docker compose up --build -d
```

## Logs
```
docker compose logs -f            # all services
docker compose logs -f backend    # backend only
docker compose logs -f frontend   # frontend only
```
