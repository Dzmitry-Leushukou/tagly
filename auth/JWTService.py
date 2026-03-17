import os
from jose import jwt
from datetime import datetime, timedelta, timezone


class JWTService:
    def __init__(self):
        self.SECRET_KEY = os.getenv("SECRET_KEY")
        self.ALGORITHM = os.getenv("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY is not set")

    async def create_token(self, data: dict, expires_delta: timedelta) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)

    async def create_access_token(self, data: dict) -> str:
        return await self.create_token(data, timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES))

    async def create_refresh_token(self, data: dict) -> str:
        return await self.create_token(data, timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS))