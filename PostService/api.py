import asyncio
import json
import logging
import os
import random
import aiohttp
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from DeepseekService import send_completion_request

logger = logging.getLogger(__name__)

app = FastAPI(title="Post service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TAG_SYSTEM_PROMPT = """Ты — классификатор текстов. Твоя задача: выделить ключевые темы (теги) из текста поста.
Теги должны быть:
- конкретными (не "разное", а "спорт", "футбол", "путешествия")
- на русском языке
- от 1 до 5 штук на пост
- отсортированными по релевантности (самый важный первый)

Отвечай ТОЛЬКО в формате JSON-массива строк. Никаких пояснений, лишних слов, запятых в конце или Markdown.
Пример правильного ответа: ["спорт", "футбол", "чемпионат"]"""

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8000")
DB_SERVICE_URL = os.getenv("DB_SERVICE_URL", "http://db-service:8001")

FEEDBACK_STEP = 0.1
PREFERENCE_MIN = -1.0
PREFERENCE_MAX = 1.0

EXPLOITATION_COUNT = int(os.getenv("EXPLOITATION_COUNT", "4"))
EXPLORATION_COUNT = int(os.getenv("EXPLORATION_COUNT", "1"))
SHUFFLE_RESULTS = os.getenv("SHUFFLE_RESULTS", "False").lower() in ("true", "1", "yes")
bearer_scheme = HTTPBearer(auto_error=False)


async def _verify_token_and_get_login(token: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{AUTH_SERVICE_URL}/verify",
            headers={"Authorization": f"Bearer {token}"}
        ) as verify_resp:
            if verify_resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            verify_data = await verify_resp.json()

    user_login = verify_data.get("login")
    if not user_login:
        raise HTTPException(status_code=401, detail="Login not found in token")

    return user_login


async def get_current_user_login(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)
) -> str:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    return await _verify_token_and_get_login(credentials.credentials)


async def get_optional_user_login(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)
) -> str | None:
    if not credentials or not credentials.credentials:
        return None

    if credentials.scheme.lower() != "bearer":
        return None

    try:
        return await _verify_token_and_get_login(credentials.credentials)
    except HTTPException:
        return None


class PostCreateRequest(BaseModel):
    content: str


class PostCreateResponse(BaseModel):
    post_id: int
    tags: list[str]


class FeedbackRequest(BaseModel):
    post_id: int
    feedback_type: str


class FeedbackResponse(BaseModel):
    status: str
    updated_vector: dict


class FavoriteTagsRequest(BaseModel):
    tag_ids: list[int]


class FavoriteTagsResponse(BaseModel):
    status: str
    updated_vector: dict


TAG_PREFERENCE_BOOST = 0.5


@app.get("/")
async def read_root():
    return {"Status": "Post service alive!"}


@app.post("/post", response_model=PostCreateResponse)
async def create_post(
    request: PostCreateRequest,
    author_login: str = Depends(get_current_user_login)
):
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{DB_SERVICE_URL}/user/{author_login}") as user_resp:
            if user_resp.status != 200:
                raise HTTPException(status_code=404, detail="Author not found")
            user_data = await user_resp.json()
            author_id = user_data["id"]

        tags_json = send_completion_request(
            message=request.content,
            system_prompt=TAG_SYSTEM_PROMPT,
            model="deepseek-chat"
        )
        if not tags_json:
            raise HTTPException(status_code=500, detail="Failed to get tags from DeepSeek")

        try:
            tags = json.loads(tags_json)
            if not isinstance(tags, list):
                tags = []
        except json.JSONDecodeError:
            tags = []

        tags = tags[:5]

        post_data = {
            "content": request.content,
            "author_id": author_id
        }
        async with session.post(f"{DB_SERVICE_URL}/posts", json=post_data) as post_resp:
            if post_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to create post")
            post = await post_resp.json()
            post_id = post["id"]

        created_tags = []
        for tag_name in tags:
            tag_id = None

            async with session.post(f"{DB_SERVICE_URL}/tags", json={"name": tag_name}) as tag_resp:
                if tag_resp.status == 200:
                    tag = await tag_resp.json()
                    tag_id = tag["id"]
                elif tag_resp.status == 409:
                    async with session.get(f"{DB_SERVICE_URL}/tags/by_name/{tag_name}") as get_resp:
                        if get_resp.status == 200:
                            tag = await get_resp.json()
                            tag_id = tag["id"]

            if tag_id is None:
                logger.warning(f"Failed to get/create tag '{tag_name}' for post {post_id}")
                continue

            async with session.post(
                f"{DB_SERVICE_URL}/post_tags",
                json={"post_id": post_id, "tag_id": tag_id}
            ) as link_resp:
                if link_resp.status not in (200, 201, 409):
                    logger.warning(f"Failed to link tag '{tag_name}' to post {post_id}")

            created_tags.append(tag_name)

    return {"post_id": post_id, "tags": created_tags}


@app.get("/recommendations")
async def get_recommendations(user_login: str | None = Depends(get_optional_user_login)):
    user_id = None
    preference_vector = {}

    async with aiohttp.ClientSession() as session:
        if user_login:
            async with session.get(f"{DB_SERVICE_URL}/user/{user_login}") as user_resp:
                if user_resp.status == 200:
                    user_data = await user_resp.json()
                    user_id = user_data["id"]
                    preference_vector = user_data.get("preference_vector", {}) or {}

        async with session.get(f"{DB_SERVICE_URL}/posts") as posts_resp:
            if posts_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get posts")
            all_posts = await posts_resp.json()

        shown_post_ids = set()
        if user_id:
            shown = await _get_shown_posts(session, user_id)
            shown_post_ids = set()
            for post_id in shown.keys():
                try:
                    shown_post_ids.add(int(post_id))
                except (TypeError, ValueError):
                    continue

        if not user_id or not preference_vector or not any(v != 0 for v in preference_vector.values()):
            available_posts = [p for p in all_posts if p["id"] not in shown_post_ids]
            random.shuffle(available_posts)
            total_count = EXPLOITATION_COUNT + EXPLORATION_COUNT
            recommended = available_posts[:total_count]
            exploitation_count = 0
            exploration_count = len(recommended)
            if not preference_vector:
                logger.info(f"Recommendations (no preference vector): exploitation=0, exploration={exploration_count}")
            else:
                logger.info(f"Recommendations (unauthorized): exploitation=0, exploration={exploration_count}")
        else:
            unseen_posts = [p for p in all_posts if p["id"] not in shown_post_ids]

            scored_posts = []
            for post in unseen_posts:
                post_tags = [tag["name"] for tag in post.get("tags", [])]
                relevance = sum(preference_vector.get(tag, 0) for tag in post_tags)
                scored_posts.append((relevance, post))

            scored_posts.sort(key=lambda x: (-x[0], x[1]["id"]))

            exploitation_posts = [post for _, post in scored_posts[:EXPLOITATION_COUNT]]
            exploitation_post_ids = {p["id"] for p in exploitation_posts}

            remaining_posts = [p for p in unseen_posts if p["id"] not in exploitation_post_ids]
            random.shuffle(remaining_posts)
            exploration_posts = remaining_posts[:EXPLORATION_COUNT]

            if len(exploitation_posts) < EXPLOITATION_COUNT:
                needed = EXPLOITATION_COUNT - len(exploitation_posts)
                available_for_fill = [p for p in remaining_posts if p["id"] not in [ep["id"] for ep in exploration_posts]]
                random.shuffle(available_for_fill)
                additional = available_for_fill[:needed]
                exploitation_posts.extend(additional)
                exploration_posts = [p for p in exploration_posts if p["id"] not in [p2["id"] for p2 in additional]]

            if len(exploration_posts) < EXPLORATION_COUNT:
                needed = EXPLORATION_COUNT - len(exploration_posts)
                taken_ids = {p["id"] for p in exploitation_posts} | {p["id"] for p in exploration_posts}
                remaining_for_explore = [p for p in unseen_posts if p["id"] not in taken_ids]
                random.shuffle(remaining_for_explore)
                exploration_posts.extend(remaining_for_explore[:needed])

            recommended = exploitation_posts + exploration_posts

            if SHUFFLE_RESULTS:
                random.shuffle(recommended)

            exploitation_count = len(exploitation_posts)
            exploration_count = len(exploration_posts)
            logger.info(f"Recommendations: exploitation={exploitation_count}, exploration={exploration_count}")

        if user_id:
            batch_number = await _get_next_batch_number(session, user_id)
            for post in recommended:
                await _record_shown_post(session, user_id, post["id"], batch_number)

    # Add author_login and like/dislike flags to each recommended post
    feedback_by_post_id = {}
    if user_id and recommended:
        async with aiohttp.ClientSession() as feedback_session:
            tasks = [
                _fetch_feedback_type(feedback_session, user_id, post["id"])
                for post in recommended
            ]
            feedback_types = await asyncio.gather(*tasks)

        for post, feedback_type in zip(recommended, feedback_types):
            if feedback_type:
                feedback_by_post_id[post["id"]] = feedback_type

    result_posts = []
    for post in recommended:
        feedback_type = feedback_by_post_id.get(post["id"])
        result_posts.append({
            "id": post["id"],
            "content": post["content"],
            "created_at": post["created_at"],
            "author_id": post["author_id"],
            "author_login": post.get("author_login"),
            "tags": post.get("tags", []),
            "user_liked": feedback_type == "like",
            "user_disliked": feedback_type == "dislike"
        })

    return {"recommendations": result_posts}


async def _get_shown_posts(session: aiohttp.ClientSession, user_id: int) -> dict:
    try:
        async with session.get(f"{DB_SERVICE_URL}/user/{user_id}/shown_posts") as resp:
            if resp.status == 200:
                return await resp.json()
    except Exception as e:
        logger.error(f"Error getting shown posts: {e}")
    return {}


async def _get_next_batch_number(session: aiohttp.ClientSession, user_id: int) -> int:
    try:
        async with session.get(f"{DB_SERVICE_URL}/user/{user_id}/max_batch") as resp:
            if resp.status == 200:
                data = await resp.json()
                return data.get("max_batch", 0) + 1
    except Exception as e:
        logger.error(f"Error getting max batch: {e}")
    return 1


async def _record_shown_post(session: aiohttp.ClientSession, user_id: int, post_id: int, batch_number: int):
    try:
        async with session.post(
            f"{DB_SERVICE_URL}/shown_posts",
            json={"user_id": user_id, "post_id": post_id, "batch_number": batch_number}
        ) as resp:
            if resp.status not in (200, 201):
                logger.warning(f"Failed to record shown post: user_id={user_id}, post_id={post_id}")
    except Exception as e:
        logger.error(f"Error recording shown post: {e}")


async def _fetch_feedback_type(session: aiohttp.ClientSession, user_id: int, post_id: int) -> str | None:
    try:
        async with session.get(f"{DB_SERVICE_URL}/user_feedback/{user_id}/{post_id}") as feedback_resp:
            if feedback_resp.status == 200:
                feedback_data = await feedback_resp.json()
                return feedback_data.get("feedback_type")
    except Exception as e:
        logger.warning(f"Failed to get feedback for post {post_id}: {e}")
    return None


@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    user_login: str = Depends(get_current_user_login)
):
    if request.feedback_type not in ("like", "dislike"):
        raise HTTPException(status_code=400, detail="feedback_type must be 'like' or 'dislike'")

    async with aiohttp.ClientSession() as session:
        async with session.get(f"{DB_SERVICE_URL}/user/{user_login}") as user_resp:
            if user_resp.status != 200:
                raise HTTPException(status_code=404, detail="User not found")
            user_data = await user_resp.json()
            user_id = user_data["id"]
            preference_vector = user_data.get("preference_vector", {}) or {}

        async with session.get(f"{DB_SERVICE_URL}/posts/{request.post_id}/tags") as tags_resp:
            if tags_resp.status == 404:
                raise HTTPException(status_code=404, detail="Post not found")
            if tags_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get post tags")
            post_tags = await tags_resp.json()

        delta = FEEDBACK_STEP if request.feedback_type == "like" else -FEEDBACK_STEP

        for tag_info in post_tags:
            tag_name = tag_info["name"]
            current_weight = preference_vector.get(tag_name, 0)
            new_weight = current_weight + delta
            new_weight = max(PREFERENCE_MIN, min(PREFERENCE_MAX, new_weight))
            
            if abs(new_weight) < 1e-9:
                preference_vector.pop(tag_name, None)
            else:
                preference_vector[tag_name] = round(new_weight, 2)

        async with session.patch(
            f"{DB_SERVICE_URL}/user/{user_login}/preference_vector",
            json={"preference_vector": preference_vector}
        ) as patch_resp:
            if patch_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to update preference vector")
            logger.info(f"Updated preference_vector for {user_login}: {preference_vector}")

        async with session.post(
            f"{DB_SERVICE_URL}/user_feedback",
            json={"user_id": user_id, "post_id": request.post_id, "feedback_type": request.feedback_type}
        ) as feedback_resp:
            if feedback_resp.status not in (200, 201):
                logger.warning(f"Failed to record feedback: {feedback_resp.status}")

    return {"status": "ok", "updated_vector": preference_vector}


@app.post("/tags/favorite", response_model=FavoriteTagsResponse)
async def set_favorite_tags(
    request: FavoriteTagsRequest,
    user_login: str = Depends(get_current_user_login)
):
    if not request.tag_ids:
        raise HTTPException(status_code=400, detail="tag_ids cannot be empty")

    async with aiohttp.ClientSession() as session:
        async with session.get(f"{DB_SERVICE_URL}/user/{user_login}") as user_resp:
            if user_resp.status != 200:
                raise HTTPException(status_code=404, detail="User not found")
            user_data = await user_resp.json()
            preference_vector = user_data.get("preference_vector", {}) or {}

        # Get all tags and build id -> name mapping
        all_tags = []
        offset = 0
        limit = 100
        while True:
            async with session.get(f"{DB_SERVICE_URL}/tags?limit={limit}&offset={offset}") as tags_resp:
                if tags_resp.status != 200:
                    raise HTTPException(status_code=500, detail="Failed to get tags")
                tags = await tags_resp.json()
                if not tags:
                    break
                all_tags.extend(tags)
                if len(tags) < limit:
                    break
                offset += limit

        tag_id_to_name = {tag["id"]: tag["name"] for tag in all_tags}

        # Validate requested tag IDs
        for tag_id in request.tag_ids:
            if tag_id not in tag_id_to_name:
                raise HTTPException(status_code=400, detail=f"Tag with id={tag_id} not found")

        # Boost selected tags, leave others unchanged
        for tag_id in request.tag_ids:
            tag_name = tag_id_to_name[tag_id]
            current = preference_vector.get(tag_name, 0)
            new_weight = current + TAG_PREFERENCE_BOOST
            new_weight = max(PREFERENCE_MIN, min(PREFERENCE_MAX, new_weight))
            preference_vector[tag_name] = round(new_weight, 2)

        # Clean up zeros
        preference_vector = {k: v for k, v in preference_vector.items() if abs(v) > 1e-9}

        async with session.patch(
            f"{DB_SERVICE_URL}/user/{user_login}/preference_vector",
            json={"preference_vector": preference_vector}
        ) as patch_resp:
            if patch_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to update preference vector")

    return {"status": "ok", "updated_vector": preference_vector}


@app.get("/tags")
async def get_all_tags(limit: int = 50, offset: int = 0):
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{DB_SERVICE_URL}/tags?limit={limit}&offset={offset}") as tags_resp:
            if tags_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get tags")
            tags = await tags_resp.json()

    return {"tags": [tag["name"] for tag in tags]}


@app.get("/tags/my")
async def get_my_favorite_tags(user_login: str = Depends(get_current_user_login)):
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{DB_SERVICE_URL}/user/{user_login}/favorite_tags") as tags_resp:
            if tags_resp.status == 404:
                raise HTTPException(status_code=404, detail="User not found")
            if tags_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get favorite tags")
            favorite_tags = await tags_resp.json()

    return {"tags": favorite_tags}


@app.get("/my-posts")
async def get_my_posts(
    limit: int = 20,
    offset: int = 0,
    author_login: str = Depends(get_current_user_login)
):
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{DB_SERVICE_URL}/user/{author_login}/posts?limit={limit}&offset={offset}"
        ) as posts_resp:
            if posts_resp.status == 404:
                raise HTTPException(status_code=404, detail="User not found")
            if posts_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get posts")
            data = await posts_resp.json()

    return data


@app.get("/user/{login}/posts")
async def get_user_posts(
    login: str,
    limit: int = 20,
    offset: int = 0
):
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{DB_SERVICE_URL}/user/{login}/posts?limit={limit}&offset={offset}"
        ) as posts_resp:
            if posts_resp.status == 404:
                raise HTTPException(status_code=404, detail="User not found")
            if posts_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get posts")
            data = await posts_resp.json()

    return data


@app.get("/{login}")
async def get_user_info(login: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{DB_SERVICE_URL}/user/{login}") as user_resp:
            if user_resp.status == 404:
                raise HTTPException(status_code=404, detail="User not found")
            if user_resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get user info")
            user_data = await user_resp.json()

    return user_data
