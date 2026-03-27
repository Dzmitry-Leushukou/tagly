import logging
import fastapi
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



@app.post("/user")
def create_user(login:str, hashed_password:str, description:str=None):
    try:
        if description is None:
            description = ""
        user_id = postgres_service.create_user(login=login, hashed_password=hashed_password, description=description)
        return user_id
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise fastapi.HTTPException(status_code=404, detail="Internal server error")
    