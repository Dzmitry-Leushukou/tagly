from passlib.context import CryptContext
from JWTService import JWTService
import os
import aiohttp


class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.jwt_service = JWTService()
        self.db_service_url = os.getenv("DB_SERVICE_URL")

    async def get_auth(self, login: str, plain_password: str) -> dict:
        async with aiohttp.ClientSession() as session:
            response = await session.get(f"{self.db_service_url}/user/{login}")
            if response.status != 200:
                return {"status": "Wrong login or password"}
            user = await response.json()
            
            if not self.pwd_context.verify(plain_password, user["hashed_password"]):
                return {"status": "Wrong login or password"}
            
            access_token = self.jwt_service.create_access_token(user)
            refresh_token = self.jwt_service.create_refresh_token(user)
            
            return {
                "status": "Success",
                "access_token": access_token,
                "refresh_token": refresh_token
            }
   
        
    
