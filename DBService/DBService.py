import logging
import fastapi
from RedisService import RedisService

logger = logging.getLogger(__name__)

app = fastapi.FastAPI()
redis_service = RedisService()

@app.get("/")
def read_root():
    return {"Hello": "World"}



@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down DBService...")
    await redis_service.close()