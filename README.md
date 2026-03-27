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

## Endpoints

### Auth service
Base url: ```localhost:8000```
#### /auth
Base url: ```localhost:8000/auth```

Method: ```GET```

Params:
- login
- plain_password

Return:
- jwt_token

#### /refresh
Base url: ```localhost:8000/refresh```

Method: ```GET```

Params:
- jwt_token


Return:
- jwt_token

#### /logout
Base url: ```localhost:8000/logout```

Method: ```GET```

Params:
- jwt_token

#### /register
Base url: ```localhost:8000/register```

Method: ```GET```

Params:
- login
- plain_password

Return:
- jwt_token

### DBService
Base url: ```localhost:8001/```

#### /user
Base url: ```localhost:8001/user```

Method: ```GET```

Params:
- jwt_token

Return:
- user_data

#### /user
Base url: ```localhost:8001/user```

Method: ```POST```

Params:
- jwt_token
- user_data

## Data models

#### User
- login (unique)
- hashed_password
- description
- roleId (FK)
- interestId (FK)
#### Relo
- id
- name
- canDeletePost
- canDeleteUser

### Redis

#### User

- String: cache:{user_id}:{user_data}