# tagly

## Stack
- Postgres 18
- Python 3.13
- FastAPI
- Uvicorn

## Installation
1. Clone repository
2. ```docker compose up```

## API Base URLs
| Service | URL |
|---------|-----|
| Auth Service | `http://localhost:8000` |
| DBService | `http://localhost:8001` |
| PostService | `http://localhost:8002` |

## Architecture
### Backend

#### Auth service
Auth service handles user authentication and registration. Issues JWT tokens (access_token + refresh_token) on successful login.

#### DBService
DBService provides database access layer. Connects to PostgreSQL and Redis cache. Creates tables on startup if they don't exist.

#### PostService
PostService handles post creation, recommendations, and feedback. Uses hybrid recommendation system (exploitation + exploration).


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

#### `/refresh`
**URL:** `localhost:8000/refresh`

**Method:** `POST`

**Description:** Refresh access token using refresh token. Use when access_token expires (30 min).

**Request body:**
```json
{
  "refresh_token": "jwt_token"
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

**Error responses:**
- `401` — Invalid or expired refresh token

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

### PostService
Base url: `localhost:8002`

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### `/post`
**URL:** `localhost:8002/post`

**Method:** `POST`

**Description:** Create a new post. Tags are auto-generated using AI.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request body:**
```json
{
  "content": "string"
}
```

**Response:**
```json
{
  "post_id": 1,
  "tags": ["tag1", "tag2"]
}
```

**Error responses:**
- `401` — Missing or invalid authorization token
- `500` — Failed to create post or generate tags

---

#### `/recommendations`
**URL:** `localhost:8002/recommendations`

**Method:** `GET`

**Description:** Get personalized post recommendations. Uses hybrid recommendation system:
- **Exploitation** (default: 4 posts) — posts sorted by relevance to user preferences
- **Exploration** (default: 1 post) — random posts for discovery

Configure via environment variables:
- `EXPLOITATION_COUNT=4` — number of relevant posts
- `EXPLORATION_COUNT=1` — number of random posts
- `SHUFFLE_RESULTS=False` — shuffle final list

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": 1,
      "content": "Post content...",
      "author_id": 1,
      "tags": [{"id": 1, "name": "tag1"}]
    }
  ]
}
```

**Note:** Without authorization, returns random posts.

---

#### `/feedback`
**URL:** `localhost:8002/feedback`

**Method:** `POST`

**Description:** Submit feedback on a post. Updates user preference vector.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request body:**
```json
{
  "post_id": 1,
  "feedback_type": "like"
}
```

**Feedback types:**
- `"like"` — increases preference for post tags (+0.1)
- `"dislike"` — decreases preference for post tags (-0.1)

**Response:**
```json
{
  "status": "ok",
  "updated_vector": {
    "tag1": 0.3,
    "tag2": -0.2
  }
}
```

**Error responses:**
- `401` — Missing or invalid authorization token
- `400` — Invalid feedback_type (must be "like" or "dislike")
- `404` — Post not found

## Data models

#### User
- `login` (string, unique, primary key)
- `hashed_password` (string, bcrypt)
- `description` (string, optional)