# tagly

Платформа контента с персонализированными рекомендациями.

## Stack
- Postgres 17
- Python 3.13
- FastAPI
- Uvicorn
- Redis (кэш)
- DeepSeek AI (генерация тегов)

## Installation
```bash
docker compose up
```

## API Base URLs
| Service | URL |
|---------|-----|
| Auth Service | `http://localhost:8000` |
| DBService | `http://localhost:8001` |
| PostService | `http://localhost:8002` |

## Architecture

### Auth Service
Регистрация, авторизация, выдача JWT-токенов (access_token + refresh_token).

### DBService
Слой работы с PostgreSQL и Redis. Хранит пользователей, посты, теги, фидбек.

### PostService
Создание постов, рекомендации, фидбек. Использует гибридную систему рекомендаций (exploitation + exploration). Теги генерируются автоматически через DeepSeek AI.

---

## Все эндпоинты

### Auth Service
Base URL: `http://localhost:8000`

#### `POST /register`
Регистрация нового пользователя.

**Request body:**
```json
{
  "login": "username",
  "password": "password123"
}
```

**Response `200`:**
```json
{ "status": "Success" }
```

**Errors:**
- `401` — User already exists

---

#### `POST /auth`
Вход, получение токенов.

**Request body:**
```json
{
  "login": "username",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "status": "Success",
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Errors:**
- `401` — Wrong login or password

---

#### `POST /refresh`
Обновить access_token по refresh_token.

**Request body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response `200`:**
```json
{
  "status": "Success",
  "access_token": "eyJ...new...",
  "refresh_token": "eyJ...new..."
}
```

**Errors:**
- `401` — Invalid or expired refresh token

---

#### `GET /verify`
Проверить токен. Нужен заголовок `Authorization: Bearer <token>`.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{ "login": "username" }
```

**Errors:**
- `401` — Invalid or expired token

---

### DBService
Base URL: `http://localhost:8001`

#### `GET /user/{login}`
Получить пользователя по логину.

**Response `200`:**
```json
{
  "id": 1,
  "login": "username",
  "hashed_password": "$2b$...",
  "description": "Описание",
  "preference_vector": { "python": 0.5, "cars": 0.3 }
}
```

**Errors:**
- `404` — User not found

---

#### `POST /user`
Создать пользователя (используется Auth Service).

**Request body:**
```json
{
  "login": "username",
  "hashed_password": "$2b$...",
  "description": "Описание (необязательно)"
}
```

**Response `200`:**
```
"username"
```

**Errors:**
- `409` — User already exists

---

#### `PATCH /user/{login}/preference_vector`
Обновить вектор предпочтений пользователя.

**Request body:**
```json
{
  "preference_vector": { "python": 0.5, "cars": 0.3 }
}
```

**Response `200`:**
```json
{ "status": "ok", "preference_vector": { "python": 0.5, "cars": 0.3 } }
```

---

#### `POST /posts`
Создать пост в БД (используется PostService).

**Request body:**
```json
{
  "content": "Текст поста...",
  "author_id": 1
}
```

**Response `200`:**
```json
{
  "id": 1,
  "content": "Текст поста...",
  "created_at": "2026-04-06T12:00:00",
  "author_id": 1
}
```

---

#### `GET /posts`
Получить все посты с тегами.

**Response `200`:**
```json
[
  {
    "id": 1,
    "content": "Текст поста...",
    "created_at": "2026-04-06T12:00:00",
    "author_id": 1,
    "author_login": "username",
    "tags": [
      { "id": 1, "name": "python" },
      { "id": 2, "name": "async" }
    ]
  }
]
```

---

#### `GET /posts/{post_id}/tags`
Получить теги конкретного поста.

**Response `200`:**
```json
[
  { "id": 1, "name": "python" },
  { "id": 2, "name": "async" }
]
```

**Errors:**
- `404` — Post not found

---

#### `POST /tags`
Создать тег.

**Request body:**
```json
{ "name": "python" }
```

**Response `200`:**
```json
{ "id": 1, "name": "python" }
```

**Errors:**
- `409` — Tag already exists (в заголовке `X-Tag-Id` — ID существующего тега)

---

#### `GET /tags/by_name/{name}`
Найти тег по имени.

**Response `200`:**
```json
{ "id": 1, "name": "python" }
```

**Errors:**
- `404` — Tag not found

---

#### `GET /tags`
Получить все теги (с пагинацией).

**Query params:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `limit` | int | 50 | Количество тегов на странице |
| `offset` | int | 0 | Смещение |

**Пример:** `GET /tags?limit=20&offset=40`

**Response `200`:**
```json
[
  { "id": 1, "name": "async" },
  { "id": 2, "name": "python" }
]
```

---

#### `POST /post_tags`
Связать пост с тегом.

**Request body:**
```json
{
  "post_id": 1,
  "tag_id": 3
}
```

**Response `201`:**
```
Post-tag link created
```

**Errors:**
- `409` — Post-tag link already exists

---

#### `POST /user_feedback`
Записать фидбек пользователя на пост.

**Request body:**
```json
{
  "user_id": 1,
  "post_id": 5,
  "feedback_type": "like"
}
```

**Response `201`:**
```
Feedback recorded
```

**Errors:**
- `400` — feedback_type must be "like" or "dislike"

---

#### `GET /user_feedback/{user_id}/{post_id}`
Получить фидбек пользователя на конкретный пост.

**Response `200`:**
```json
{
  "id": 1,
  "user_id": 1,
  "post_id": 5,
  "feedback_type": "like",
  "created_at": "2026-04-06T14:00:00"
}
```

**Errors:**
- `404` — Feedback not found

---

#### `POST /shown_posts`
Записать что пост был показан пользователю (в рамках батча рекомендаций).

**Request body:**
```json
{
  "user_id": 1,
  "post_id": 5,
  "batch_number": 1
}
```

**Response `201`:**
```
Shown post recorded
```

---

#### `GET /user/{user_id}/shown_posts`
Получить посты, показанные пользователю, с номерами батчей.

**Response `200`:**
```json
{ "5": 1, "12": 1, "3": 2 }
```

---

#### `GET /user/{user_id}/max_batch`
Получить максимальный номер батча у пользователя.

**Response `200`:**
```json
{ "max_batch": 2 }
```

---

#### `GET /user/{login}/posts`
Получить все посты пользователя с пагинацией. Посты отсортированы по дате публикации (новые — первыми).

**Path params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `login` | string | Логин пользователя |

**Query params:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `limit` | int | 20 | Количество постов на странице |
| `offset` | int | 0 | Смещение |

**Response `200`:**
```json
{
  "posts": [
    {
      "id": 10,
      "content": "Интересный пост...",
      "created_at": "2026-04-06T12:00:00",
      "author_id": 2,
      "author_login": "username",
      "tags": [
        { "id": 3, "name": "python" }
      ]
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

**Errors:**
- `404` — User not found

---

### PostService
Base URL: `http://localhost:8002`

#### `POST /post`
Создать пост. Теги генерируются автоматически через DeepSeek AI.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request body:**
```json
{
  "content": "Текст моего поста..."
}
```

**Response `200`:**
```json
{
  "post_id": 15,
  "tags": ["python", "async", "fastapi"]
}
```

**Errors:**
- `401` — Missing or invalid token
- `500` — Failed to create post or generate tags

---

#### `GET /recommendations`
Получить персонализированные рекомендации.

Без авторизации — случайные посты. С авторизацией — гибрид:
- **Exploitation** (по умолчанию 4) — посты, релевантные preference_vector
- **Exploration** (по умолчанию 1) — случайные посты для разнообразия

**Headers (опционально):**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "recommendations": [
    {
      "id": 10,
      "content": "Интересный пост...",
      "created_at": "2026-04-06T12:00:00",
      "author_id": 2,
      "author_login": "otheruser",
      "tags": [
        { "id": 3, "name": "python" }
      ],
      "user_liked": true,
      "user_disliked": false
    }
  ]
}
```

Для авторизованных пользователей каждый пост содержит:
- `user_liked` — `true`, если пользователь лайкнул пост
- `user_disliked` — `true`, если пользователь дизлайкнул пост

Для неавторизованных пользователей оба поля всегда `false`.

**Errors:**
- `500` — Failed to get posts

---

#### `POST /feedback`
Оставить фидбек на пост. Обновляет preference_vector пользователя.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request body:**
```json
{
  "post_id": 10,
  "feedback_type": "like"
}
```

**Feedback types:**
- `"like"` — увеличивает preference тегов поста (+0.1)
- `"dislike"` — уменьшает preference тегов поста (-0.1)

**Response `200`:**
```json
{
  "status": "ok",
  "updated_vector": {
    "python": 0.5,
    "async": 0.3
  }
}
```

**Errors:**
- `401` — Missing or invalid token
- `400` — Invalid feedback_type
- `404` — Post not found

---

#### `POST /tags/favorite`
Выбрать интересующие теги (как сабреддиты на Reddit). Выбранные теги получают буст +0.5 к preference_vector. Остальные не меняются.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request body:**
```json
{
  "tag_ids": [1, 3, 5, 12, 20]
}
```

**Response `200`:**
```json
{
  "status": "ok",
  "updated_vector": {
    "python": 0.5,
    "cars": 0.5,
    "space": 0.5
  }
}
```

**Errors:**
- `401` — Missing or invalid token
- `400` — Tag not found / tag_ids is empty

---

#### `GET /tags`
Получить все теги (с пагинацией). Проксирует запрос в DBService.

**Query params:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `limit` | int | 50 | Количество тегов на странице |
| `offset` | int | 0 | Смещение |

**Response `200`:**
```json
{
  "tags": ["async", "cars", "python", "space", "sport"]
}
```

---

#### `GET /my-posts`
Получить все посты текущего авторизованного пользователя. Посты отсортированы по дате публикации (новые — первыми). Поддерживает пагинацию.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query params:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `limit` | int | 20 | Количество постов на странице |
| `offset` | int | 0 | Смещение |

**Response `200`:**
```json
{
  "posts": [
    {
      "id": 15,
      "content": "Текст моего поста...",
      "created_at": "2026-04-06T12:00:00",
      "author_id": 1,
      "author_login": "username",
      "tags": [
        { "id": 1, "name": "python" },
        { "id": 2, "name": "fastapi" }
      ]
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**Errors:**
- `401` — Missing or invalid token
- `404` — User not found

---

#### `GET /user/{login}/posts`
Получить все посты пользователя с указанным логином. Посты отсортированы по дате публикации (новые — первыми). Поддерживает пагинацию. Не требует авторизации.

**Path params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `login` | string | Логин пользователя |

**Query params:**
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `limit` | int | 20 | Количество постов на странице |
| `offset` | int | 0 | Смещение |

**Response `200`:**
```json
{
  "posts": [
    {
      "id": 10,
      "content": "Интересный пост...",
      "created_at": "2026-04-06T12:00:00",
      "author_id": 2,
      "author_login": "otheruser",
      "tags": [
        { "id": 3, "name": "python" }
      ]
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

**Errors:**
- `404` — User not found

---

#### `GET /{login}`
Получить полную информацию о пользователе по логину. Не требует авторизации.

**Path params:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `login` | string | Логин пользователя |

**Response `200`:**
```json
{
  "id": 1,
  "login": "username",
  "hashed_password": "$2b$...",
  "description": "Описание пользователя",
  "preference_vector": { "python": 0.5, "cars": 0.3 }
}
```

**Errors:**
- `404` — User not found

---

## Data models

### User
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | int (SERIAL) | ID пользователя |
| `login` | string (unique) | Логин |
| `hashed_password` | string (bcrypt) | Хэш пароля |
| `description` | string | Описание (опционально) |
| `preference_vector` | JSONB | Вектор предпочтений: `{ "tag_name": weight }` |

### Post
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | int (SERIAL) | ID поста |
| `content` | text | Текст поста |
| `created_at` | timestamp | Дата создания |
| `author_id` | int → users(id) | Автор |

### Tag
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | int (SERIAL) | ID тега |
| `name` | string (unique) | Название тега |

### Post-Tag связь
| Поле | Тип | Описание |
|------|-----|----------|
| `post_id` | int → posts(id) | ID поста |
| `tag_id` | int → tags(id) | ID тега |

### User Feedback
| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | int → users(id) | ID пользователя |
| `post_id` | int → posts(id) | ID поста |
| `feedback_type` | string | "like" или "dislike" |
| `created_at` | timestamp | Дата |

### Shown Posts
| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | int → users(id) | ID пользователя |
| `post_id` | int → posts(id) | ID поста |
| `batch_number` | int | Номер батча рекомендаций |
| `shown_at` | timestamp | Когда показан |
