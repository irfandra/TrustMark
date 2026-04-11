# TrustMark

## System Requirement

- Docker
- Node.js >= 20.19.4
- npm >= 10

## First Start The Backend (MySQL + Java)

'''bash
cd backend
cp .env.example .env
docker compose up --build -d
'''
Backend and Docs Endpoint:
- API base: http://127.0.0.1:8082/api/v1
- Swagger UI: http://127.0.0.1:8082/api/v1/swagger-ui.html

## Start Frontend

Open a new terminal:


cd frontend
npm install
npm run start (select IOS)


set Frontend  API at "API_BASE" in apiClient.js:

- http://127.0.0.1:8082/api/v1

## Stop Services

To stop backend containers:


cd backend
docker compose down

