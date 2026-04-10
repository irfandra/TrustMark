# TrustMark

Creator-focused product authentication platform with off-chain QR lifecycle records, brand catalog management, and order fulfillment workflows.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Frontend Component Architecture](#frontend-component-architecture)
3. [Backend Setup](#backend-setup)
4. [Environment Variables](#environment-variables)
5. [Docker / Database](#docker--database)
6. [API Reference](#api-reference)
7. [Security](#security)
8. [Production Deployment](#production-deployment)

---

## Architecture

| Layer | Technology |
|---|---|
| Backend API | Spring Boot 3.2, Java 21 |
| Database | MySQL 8.0 (Docker) |
| Security | Spring Security + CORS policy |
| QR + Identity | Off-chain QR payload lifecycle |
| ORM / Schema Init | Hibernate JPA + MySQL init SQL |
| Client App | Expo Router + React Native |

---

## Frontend Component Architecture

The project uses a feature-oriented structure to keep UI logic easy to navigate and maintain.

### Folder Structure

```
components/
├── context/           # React Context providers and global state
├── screens/           # Screen-specific components grouped by feature
├── shared/            # Reusable components used across multiple screens
└── ui/                # Basic UI widgets and low-level building blocks
```

### Guidelines

1. Place screen components in `screens/{feature}/`.
2. Place cross-screen reusable components in `shared/`.
3. Place atomic/presentational widgets in `ui/`.
4. Keep one component per file and use descriptive file names.
5. Update all import paths when moving files.

### Import Example

```jsx
import { useRole } from '../../components/context/RoleContext';
import UserHome from '../../components/screens/user/home';
```

---

## Backend Setup

### Prerequisites

- Java 21+
- Maven 3.6+
- MySQL 8.0+ (or Docker)

### Quick Start

```bash
# 1. Start MySQL via Docker
cd backend
docker-compose up -d

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — set DB_PASSWORD and CORS_ORIGINS.

# 3. Build and run
mvn clean install
mvn spring-boot:run
```

The server starts at `http://localhost:8080`. Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`

### Build a JAR

```bash
mvn clean package -DskipTests
java -jar target/backend-1.0.0.jar
```

### Run Tests

```bash
mvn test
```

### Database Schema Initialization

Database schema and seed data are initialized from `backend/db/init/001_init.sql` when MySQL starts with a fresh volume.

---

## Environment Variables

Create `backend/.env` (never commit it):

```properties
DB_USERNAME=root
DB_PASSWORD=your_password
DATABASE_MODE=validate

CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### `DATABASE_MODE` Options

| Value | Behaviour | When to use |
|---|---|---|
| `create` | Drop + recreate schema | First-time setup only ⚠️ destroys data |
| `validate` | Validate schema, no changes | Normal development & production |
| `update` | Auto-update schema | Use with caution |
| `none` | JPA does nothing | External/manual schema management |

Workflow: set `create` once → start app → stop → change to `validate`.

---

## Docker / Database

The `docker-compose.yml` in `backend/` starts **MySQL only**; the Spring Boot app runs locally.

```bash
# Start MySQL
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f mysql

# Stop (keeps data)
docker-compose down

# Stop and wipe data
docker-compose down -v

# MySQL CLI
docker-compose exec mysql mysql -u root -p

# Dump DB
docker-compose exec mysql mysqldump -u root -p${DB_PASSWORD} digital_seal > backup.sql
```

MySQL is accessible at `localhost:3306`, database `digital_seal`.

---

## API Reference

Base URL: `http://localhost:8080/api/v1`

Interactive docs: `http://localhost:8080/api/v1/swagger-ui.html`  
OpenAPI JSON: `http://localhost:8080/api/v1/v3/api-docs`

### Core Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/brands` | List brands |
| GET | `/collections` | List collections |
| GET | `/products` | List products |
| GET | `/shipments` | List shipments |

All endpoints currently run in no-auth mode.

### Standard Response Format

Success:
```json
{ "success": true, "data": { ... }, "message": "...", "timestamp": "..." }
```

Error:
```json
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "..." }, "timestamp": "..." }
```

### Common Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad request body |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate or invalid current state |

---

## Security

| Feature | Implementation |
|---|---|
| Authentication | Disabled (public API mode) |
| CORS | Configurable via `CORS_ORIGINS` env var |

---

## Production Deployment

```bash
# Build
mvn clean package -DskipTests

# Required environment variables
export DB_USERNAME=<db-user>
export DB_PASSWORD=<secure-password>
export DATABASE_MODE=validate
export CORS_ORIGINS=https://yourdomain.com

# Run
java -jar target/backend-1.0.0.jar
```

Disable debug logging in `application.yml`:
```yaml
logging:
  level:
    com.digitalseal: INFO
    org.springframework.security: WARN
```

### Troubleshooting

| Problem | Fix |
|---|---|
| Port in use | Change `server.port` in `application.yml` |
| DB connection error | Verify MySQL running, check credentials, ensure `digital_seal` DB exists |
| CORS errors | Add frontend URL to `CORS_ORIGINS` |
