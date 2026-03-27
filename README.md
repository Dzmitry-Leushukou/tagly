# tagly

## Stack
- Postgres 18
- Python 3.13
- FastAPI
- Uvicorn

## Installation
1. Clone repository
2. ```docker compose up```

## Architecture
### Backend

#### Auth service
Auth service handles user authentication and registration. Issues JWT tokens (access_token + refresh_token) on successful login.

#### DBService
DBService provides database access layer. Connects to PostgreSQL and Redis cache. Creates tables on startup if they don't exist.


## Endpoints

### Auth service
Base url: `localhost:8000`

#### `/auth`
**URL:** `localhost:8000/auth`

**Method:** `POST`

**Request body:**
```json
{
  "login": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "status": "Success",
  "access_token": "jwt_token",
  "refresh_token": "jwt_token"
}
```

#### `/register`
**URL:** `localhost:8000/register`

**Method:** `POST`

**Request body:**
```json
{
  "login": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "status": "Success"
}
```

**Error responses:**
- `401` — User already exists / Registration failed

### DBService
Base url: `localhost:8001`

#### `/user/{login}`
**URL:** `localhost:8001/user/{login}`

**Method:** `GET`

**Response:**
```json
{
  "login": "string",
  "hashed_password": "string",
  "description": "string"
}
```

**Error responses:**
- `404` — User not found

#### `/user`
**URL:** `localhost:8001/user`

**Method:** `POST`

**Request body:**
```json
{
  "login": "string",
  "hashed_password": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "login": "string"
}
```

**Error responses:**
- `409` — User already exists
- `500` — Internal server error

## Data models

#### User
- `login` (string, unique, primary key)
- `hashed_password` (string, bcrypt)
- `description` (string, optional)