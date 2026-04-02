# TrustMark

Creator-focused product authentication platform with off-chain QR lifecycle records, brand catalog management, and order fulfillment workflows.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Setup](#backend-setup)
3. [Environment Variables](#environment-variables)
4. [Docker / Database](#docker--database)
5. [API Reference](#api-reference)
6. [Security](#security)
7. [Production Deployment](#production-deployment)

---

## Architecture

| Layer | Technology |
|---|---|
| Backend API | Spring Boot 3.2, Java 21 |
| Database | MySQL 8.0 (Docker) |
| Security | Spring Security + CORS policy |
| QR + Identity | Off-chain QR payload lifecycle |
| ORM / Migration | Hibernate JPA + Flyway |
| Client App | Expo Router + React Native |

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

### Database Migrations

Flyway migrations apply automatically on startup from `src/main/resources/db/migration/`.

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
| `none` | JPA does nothing | When Flyway manages everything |

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
| GET | `/orders` | List orders |

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
