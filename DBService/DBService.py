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


@app.get("/user/{user_id}")
def read_user(user_id: int):
    user = redis_service.get(user_id)
    if user is None:
        user = postgres_service.get_user(user_id)
        if user is not None:
            redis_service.set(user_id, user)
            logger.info(f"User {user_id} retrieved from DB and cached")
        else:
            logger.info(f"User {user_id} not found in DB")
    else:
        logger.info(f"User {user_id} retrieved from cache")

    if user is None:
        raise fastapi.HTTPException(status_code=404, detail="User not found")

    return user