import json
import logging
import aiohttp
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from DeepseekService import send_completion_request

logger = logging.getLogger(__name__)

app = FastAPI(title="Post service")

TAG_SYSTEM_PROMPT = """Ты — классификатор текстов. Твоя задача: выделить ключевые темы (теги) из текста поста.
Теги должны быть:
- конкретными (не "разное", а "спорт", "футбол", "путешествия")
- на русском языке
- от 1 до 5 штук на пост
- отсортированными по релевантности (самый важный первый)

Отвечай ТОЛЬКО в формате JSON-массива строк. Никаких пояснений, лишних слов, запятых в конце или Markdown.
Пример правильного ответа: ["спорт", "футбол", "чемпионат"]"""

AUTH_SERVICE_URL = "http://auth:8000"
DB_SERVICE_URL = "http://db-service:8001"


class PostCreateRequest(BaseModel):
    content: str


class PostCreateResponse(BaseModel):
    post_id: int
    tags: list[str]


@app.get("/")
async def read_root():
    return {"Status": "Post service alive!"}


@app.post("/post", response_model=PostCreateResponse)
async def create_post(
    request: PostCreateRequest,
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.split(" ", 1)[1]
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{AUTH_SERVICE_URL}/verify",
            headers={"Authorization": f"Bearer {token}"}
        ) as verify_resp:
            if verify_resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            verify_data = await verify_resp.json()
            author_login = verify_data.get("login")
        
        if not author_login:
            raise HTTPException(status_code=401, detail="Login not found in token")
        
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
