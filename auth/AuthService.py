from passlib.context import CryptContext
from auth.JWTService import JWTService
from tagly-utils as utils


class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.jwt_service = JWTService()

    async def get_auth(self, login:str, plain_password:str):
        user = await utils.call_DBService("get_user", login)
        if not data :
            return {"status": "Wrong login or password"}
        
        status = await self.check_password(plain_password, data["hashed_password"])

        if status == "Success":
            return {
                    "status": "Success",
                    "token": await self.jwt_service.create_access_token(data)
                }
        else:
            return {"status": "Wrong login or password"}


    async def check_password(self, plain_password:str, hashed_password:str):
        if self.pwd_context.verify(plain_password, hashed_password):
            return "Success"
        else:
            return "Failed"
        
    
