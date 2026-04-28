import logging
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from RedisService import RedisService
from PostgreService import PostgreService

logger = logging.getLogger(__name__)

app = fastapi.FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
redis_service = None
postgres_service = None

@app.on_event("startup")
async def startup_event():
    global redis_service, postgres_service
    logger.info("Initializing Redis and PostgreSQL services...")
    redis_service = RedisService()
    postgres_service = PostgreService()
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


@app.get("/posts")
def get_all_posts():
    try:
        posts = postgres_service.get_all_posts_with_tags()
        return posts
    except Exception as e:
        logger.error(f"Error getting all posts: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/posts/{post_id}/tags")
def get_post_tags(post_id: int):
    try:
        tags = postgres_service.get_post_tags(post_id)
        if not tags:
            post = postgres_service.execute_query("SELECT id FROM posts WHERE id = %s", (post_id,), fetch_one=True)
            if not post:
                raise fastapi.HTTPException(status_code=404, detail="Post not found")
        return tags
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post tags: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


class ShownPostRequest(BaseModel):
    user_id: int
    post_id: int
    batch_number: int


@app.post("/shown_posts")
def add_shown_post(request: ShownPostRequest):
    try:
        postgres_service.add_shown_post(
            user_id=request.user_id,
            post_id=request.post_id,
            batch_number=request.batch_number
        )
        return fastapi.Response(status_code=201, content="Shown post recorded")
    except Exception as e:
        logger.error(f"Error adding shown post: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


class PreferenceVectorRequest(BaseModel):
    preference_vector: dict


@app.patch("/user/{login}/preference_vector")
def update_preference_vector(login: str, request: PreferenceVectorRequest):
    try:
        user = postgres_service.get_user(login)
        if not user:
            raise fastapi.HTTPException(status_code=404, detail="User not found")
        
        postgres_service.update_user_preference_vector(
            login=login,
            preference_vector=request.preference_vector
        )
        redis_service.delete(login)
        logger.info(f"Invalidated cache for user {login}")
        return {"status": "ok", "preference_vector": request.preference_vector}
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preference vector: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


class UserFeedbackRequest(BaseModel):
    user_id: int
    post_id: int
    feedback_type: str


@app.post("/user_feedback")
def add_user_feedback(request: UserFeedbackRequest):
    try:
        if request.feedback_type not in ("like", "dislike"):
            raise fastapi.HTTPException(status_code=400, detail="feedback_type must be 'like' or 'dislike'")
        
        postgres_service.add_user_feedback(
            user_id=request.user_id,
            post_id=request.post_id,
            feedback_type=request.feedback_type
        )
        return fastapi.Response(status_code=201, content="Feedback recorded")
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding user feedback: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/user_feedback/{user_id}/{post_id}")
def get_user_feedback(user_id: int, post_id: int):
    try:
        feedback = postgres_service.get_user_feedback(user_id, post_id)
        if feedback is None:
            raise fastapi.HTTPException(status_code=404, detail="Feedback not found")
        return feedback
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user feedback: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/user/{user_id}/shown_posts")
def get_user_shown_posts(user_id: int):
    try:
        shown = postgres_service.get_user_shown_posts(user_id)
        return shown
    except Exception as e:
        logger.error(f"Error getting user shown posts: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/user/{user_id}/max_batch")
def get_max_batch_number(user_id: int):
    try:
        max_batch = postgres_service.get_max_batch_number(user_id)
        return {"max_batch": max_batch}
    except Exception as e:
        logger.error(f"Error getting max batch number: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/tags")
def get_all_tags(limit: int = 50, offset: int = 0):
    try:
        tags = postgres_service.get_all_tags(limit=limit, offset=offset)
        return tags
    except Exception as e:
        logger.error(f"Error getting all tags: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/user/{login}/posts")
def get_user_posts(login: str, limit: int = 20, offset: int = 0):
    try:
        user = postgres_service.get_user(login)
        if not user:
            raise fastapi.HTTPException(status_code=404, detail="User not found")

        posts, total_count = postgres_service.get_user_posts_with_tags(
            author_id=user["id"],
            limit=limit,
            offset=offset
        )
        return {
            "posts": posts,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user posts: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")


@app.get("/user/{login}/favorite_tags")
def get_user_favorite_tags(login: str, min_weight: float = 0.0):
    try:
        user = postgres_service.get_user(login)
        if not user:
            raise fastapi.HTTPException(status_code=404, detail="User not found")

        favorite_tags = postgres_service.get_user_favorite_tags(
            login=login,
            min_weight=min_weight
        )
        return favorite_tags
    except fastapi.HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user favorite tags: {e}")
        raise fastapi.HTTPException(status_code=500, detail="Internal server error")
    