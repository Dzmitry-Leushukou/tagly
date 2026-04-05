import os
import logging
from openai import OpenAI
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_deepseek_api_key() -> str:
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY not set in environment")
    return api_key

def get_deepseek_api_url() -> str:
    api_url = os.environ.get("DEEPSEEK_API_URL")
    if not api_url:
        raise ValueError("DEEPSEEK_API_URL not set in environment")
    return api_url

def create_client() -> OpenAI:
    return OpenAI(
        api_key=get_deepseek_api_key(),
        base_url=get_deepseek_api_url()
    )

def send_completion_request(
    message: str,
    system_prompt: str,
    model: str = "deepseek-chat"
) -> Optional[str]:
    try:
        client = create_client()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            stream=False
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Request failed: {e}")
        return None