from passlib.context import CryptContext
from JWTService import JWTService

class AuthService:
    async def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.JWTService = JWTService

    async def get_auth(self, login:str, plain_password:str):
        # data = await self.DBService.get_auth_data(login)
        data = None
        if not data :
            return "Wrtong login or password"
        
        status = await self.check_password(plain_password, data["hashed_password"])

        if status == "Success":
            return {
                    "status": "Success",
                    "token": await self.JWTService.create_token(data)
                }
        else:
            return "Wrong login or password"


    async def check_password(self, plain_password:str, hashed_password:str):
        if self.pwd_context.verify(plain_password, hashed_password):
            return "Success"
        else:
            return "Failed"
