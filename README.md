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
Auth service is entrance of our app. It`s authorize user and get access token if user is valid.

#### DBService
DBService is service for database of project. It`s connect to Postgre database and execute queries. If database doesnt exist, it create it.


### Frontend

## Data models

### PostgreSQL
#### User
- id
- login
- hashed_password
- description
- roleId
- interestId
#### Relo
- id
- name
- canDeletePost
- canDeleteUser

### Redis

#### User

- String: cache:{user_id}:{user_data}