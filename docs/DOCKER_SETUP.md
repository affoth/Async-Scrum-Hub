# 🐳 Docker Setup Guide

This guide explains how to use Docker Compose to run the entire Async Scrum Hub stack locally.

## **Prerequisites**

Make sure you have installed:
- Docker Desktop (version 24+)
- Docker Compose plugin (version 2.20+) — use `docker compose` (no hyphen)

Check versions:
```bash
docker --version
docker compose version
```

---

## **Quick Start**
### **1. Create .env file**
```bash
# Copy the example environment file
cp .env.example .env
```

Then open `.env` and set a real JWT secret key (required — the app won't start without it):
```bash
# Generate a secure key
openssl rand -hex 32

# Paste the output into .env as the value for JWT_SECRET_KEY
```

### **2. Start all services**
```bash
docker compose up --build
```

This command will:
1. Build Docker images for backend, frontend, and nginx
2. Start PostgreSQL database
3. Run Alembic migrations
4. Start FastAPI backend (internal port 8000, not exposed directly)
5. Start React frontend (internal port 5173, not exposed directly)
6. Start nginx reverse proxy on port 8443 (HTTPS)

### **3. Accept the self-signed certificate**

On first visit, your browser will warn about the self-signed certificate. Click **Advanced → Proceed** to accept it.

### **4. Access the application**

All traffic goes through nginx — do **not** access backend or frontend ports directly.

- **Application:** https://localhost:8443
- **API Documentation (Swagger):** https://localhost:8443/docs
- **API Documentation (ReDoc):** https://localhost:8443/redoc
- **Health Check:** https://localhost:8443/health

---

## **Docker Compose Commands**

### **Start services (detached mode)**
```bash
docker compose up -d
```

### **Stop services**
```bash
docker compose down
```

### **Stop services and remove volumes (WARNING: deletes database data)**
```bash
docker compose down -v
```

### **View logs**
```bash
# View all logs
docker compose logs -f

# View logs from specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### **Rebuild containers**
```bash
# Rebuild all services
docker compose up --build

# Rebuild specific service
docker compose build backend
```

### **Execute commands in running containers**
```bash
# Access backend container shell
docker compose exec backend bash

# Access PostgreSQL database
docker compose exec postgres psql -U scrumadmin -d async_scrum_hub

# Run Alembic migrations manually
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "migration name"
```

---

## **Docker Compose Architecture**

### **Services**

#### **1. postgres**
- **Image:** `postgres:15-alpine`
- **Port:** 5432
- **Container name:** `async-scrum-db`
- **Volume:** `postgres_data` (persists database between restarts)
- **Health check:** Verifies PostgreSQL is ready before starting backend

#### **2. backend**
- **Build:** `./backend/Dockerfile`
- **Port:** 8000
- **Container name:** `async-scrum-backend`
- **Dependencies:** Waits for postgres health check
- **Hot reload:** Code changes automatically reload the server
- **Command:** Runs migrations, then starts Uvicorn

#### **3. frontend**
- **Build:** `./frontend/Dockerfile.dev`
- **Port:** 5173 (internal only — not exposed to host)
- **Container name:** `async-scrum-frontend`
- **Dependencies:** Waits for backend to start
- **Hot reload:** Code changes automatically refresh the browser

#### **4. nginx**
- **Build:** `./nginx/Dockerfile`
- **Port:** 8443 → 443 (HTTPS reverse proxy)
- **Container name:** `async-scrum-nginx`
- **Role:** Single entry point for all traffic — routes `/api/`, `/ws/`, `/static/` to backend, everything else to frontend
- **TLS:** Self-signed certificate generated at build time

### **Resource Limits**

Each service has memory and CPU limits enforced by Docker:

| Service    | Memory | CPU  |
|------------|--------|------|
| `postgres` | 512m   | 0.5  |
| `backend`  | 512m   | 0.5  |
| `frontend` | 1g     | 0.5  |
| `nginx`    | 128m   | 0.25 |

If a container is OOM-killed you will see exit code `137` in the logs. Raise the limit for that service in `docker-compose.yml` if needed.

### **Networking**

All services are connected through a custom bridge network called `async-scrum-network`:
- Services can communicate using their service names as hostnames
- Example: Backend connects to database using hostname `postgres`

### **Volumes**

- **postgres_data:** Persistent storage for PostgreSQL data
  - Located in Docker's default volume directory
  - Survives container restarts
  - Deleted only with `docker compose down -v`

---

## **Troubleshooting**

### **Problem: JWT_SECRET_KEY missing**

**Error:** `pydantic_core.ValidationError: 1 validation error for Settings — JWT_SECRET_KEY — Field required`

**Solution:**
```bash
# Generate a key and add it to your .env file
openssl rand -hex 32
# Then set JWT_SECRET_KEY=<output> in .env
```

---

### **Problem: Port already in use**

**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Solution:**
```bash
# Find process using the port
lsof -i :8443  # or :8000 for backend, :5432 for postgres

# Kill the process
kill -9 <PID>

# Or use different ports in docker compose.yml
```

### **Problem: Database connection failed**

**Error:** `FATAL: password authentication failed`

**Solution:**
```bash
# Stop containers and remove volumes
docker compose down -v

# Start fresh
docker compose up --build
```

### **Problem: Migrations failed**

**Error:** `alembic.util.exc.CommandError: Can't locate revision identified by 'xxxx'`

**Solution:**
```bash
# Access backend container
docker compose exec backend bash

# Reset migrations (WARNING: destructive)
rm -rf migration/versions/*.py

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

### **Problem: Frontend won't load**

**Symptoms:** Browser shows "This site can't be reached" at https://localhost:8443

**Solution:**
```bash
# Check all containers are running
docker compose ps

# Check nginx logs first (it's the entry point)
docker compose logs nginx

# Then check frontend logs
docker compose logs frontend

# Rebuild if needed
docker compose up --build frontend nginx
```

### **Problem: Container OOM-killed (exit code 137)**

**Symptoms:** A service keeps restarting, logs show exit code `137`

**Solution:**
```bash
# Identify which service crashed
docker compose ps

# Raise that service's memory limit in docker-compose.yml, e.g. for frontend:
#   memory: 1g  →  memory: 2g

# Then restart
docker compose up -d
```

### **Problem: Hot reload not working**

**Symptoms:** Code changes don't trigger automatic reloading

**Solution:**
1. Make sure volumes are correctly mounted in `docker compose.yml`
2. For macOS users: Enable "VirtioFS" in Docker Desktop settings
3. Restart Docker Desktop

---

## **Development Workflow**

### **1. Making code changes**

- **Backend:** Edit files in `backend/src/` → Uvicorn auto-reloads
- **Frontend:** Edit files in `frontend/src/` → Vite auto-reloads
- **Database models:** Edit files in `backend/src/database/models/` → Create migration

### **2. Creating database migrations**

```bash
# Make changes to models in backend/src/database/models/

# Create migration (with descriptive name)
docker compose exec backend alembic revision --autogenerate -m "add standup and blocker tables"

# Review the generated migration file in backend/migration/versions/

# Apply migration
docker compose exec backend alembic upgrade head
```

### **3. Accessing the database**

```bash
# Option 1: psql command line
docker compose exec postgres psql -U scrumadmin -d async_scrum_hub

# Option 2: Install a GUI tool (e.g., pgAdmin, DBeaver)
# Connection details:
# Host: localhost
# Port: 5432
# User: scrumadmin
# Password: dev_password_123
# Database: async_scrum_hub
```

### **4. Installing new packages**

**Backend (Python):**
```bash
# Add package to backend/requirements.txt
echo "new-package==1.0.0" >> backend/requirements.txt

# Rebuild backend container
docker compose up --build backend
```

**Frontend (Node):**
```bash
# Access frontend container
docker compose exec frontend sh

# Install package
npm install new-package

# Exit container
exit

# Or rebuild frontend container
docker compose up --build frontend
```

---

## **Production Considerations**

This Docker Compose setup is for **local development only**. For production:

1. ✅ Use multi-stage builds to reduce image size
2. ✅ Use production WSGI server (not Uvicorn with `--reload`)
3. ✅ Set strong passwords and secrets
4. ✅ Enable HTTPS with proper certificates
5. ✅ Use managed database service (AWS RDS, Google Cloud SQL)
6. ✅ Add health checks and restart policies
7. ✅ Use Docker secrets for sensitive data
8. ✅ Configure proper logging and monitoring

---


