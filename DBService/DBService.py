import logging
import fastapi
from pydantic import BaseModel
from RedisService import RedisService
from PostgreService import PostgreService

logger = logging.getLogger(__name__)

app = fastapi.FastAPI()
redis_service = RedisService()
postgres_service = PostgreService()

@app.on_event("startup")
async def startup_event():
    logger.info("DBService startup complete - all dependencies initialized")

@app.get("/")
def read_root():
    return {"DBService": "Alive"}

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down DBService...")
    redis_service.close()
    postgres_service.close()


@app.get("/user/{login}")
def get_user(login: str):
    user = redis_service.get(login)
    if user is None:
        user = postgres_service.get_user(login)
        if user is not None:
            redis_service.set(login, user)
            logger.info(f"User {login} retrieved from DB and cached")
        else:
            logger.info(f"User {login} not found in DB")
    else:
        logger.info(f"User {login} retrieved from cache")

    if user is None:
        raise fastapi.HTTPException(status_code=404, detail="User not found")

    return user



class CreateUserRequest(BaseModel):
    login: str
    hashed_password: str
    description: str | None = None


@app.post("/user")
def create_user(request: CreateUserRequest):
    try:
        if request.description is None:
            request.description = ""
        user_id = postgres_service.create_user(login=request.login, hashed_password=request.hashed_password, description=request.description)
        return user_id
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        if "duplicate key" in str(e).lower() or "already exists" in str(e).lower():
            raise fastapi.HTTPException(status_code=409, detail="User already exists")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")
    