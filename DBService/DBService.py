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


# ==================== Posts Endpoints ====================

class CreatePostRequest(BaseModel):
    content: str
    author_id: int


@app.post("/posts")
def create_post(request: CreatePostRequest):
    try:
        post = postgres_service.create_post(content=request.content, author_id=request.author_id)
        return post
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


# ==================== Tags Endpoints ====================

class CreateTagRequest(BaseModel):
    name: str


@app.post("/tags")
def create_tag(request: CreateTagRequest):
    try:
        existing = postgres_service.get_tag_by_name(request.name)
        if existing is not None:
            raise fastapi.HTTPException(
                status_code=409,
                detail="Tag already exists",
                headers={"X-Tag-Id": str(existing["id"])}
            )
        tag_id = postgres_service.create_tag(name=request.name)
        return {"id": tag_id, "name": request.name}
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tag: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/tags/by_name/{name}")
def get_tag_by_name(name: str):
    try:
        tag = postgres_service.get_tag_by_name(name)
        if tag is None:
            raise fastapi.HTTPException(status_code=404, detail="Tag not found")
        return tag
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tag: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


# ==================== Post Tags Endpoints ====================

class CreatePostTagRequest(BaseModel):
    post_id: int
    tag_id: int


@app.post("/post_tags")
def create_post_tag(request: CreatePostTagRequest):
    try:
        postgres_service.add_post_tag(post_id=request.post_id, tag_id=request.tag_id)
        return fastapi.Response(status_code=201, content="Post-tag link created")
    except Exception as e:
        if "duplicate key" in str(e).lower() or "already exists" in str(e).lower():
            raise fastapi.HTTPException(status_code=409, detail="Post-tag link already exists")
        logger.error(f"Error creating post_tag: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")
    