from fastapi import FastAPI
from auth.AuthService import AuthService


app = FastAPI(title="Auth service")
auth_service = AuthService()

@app.get("/")
async def read_root():
    return {"Status": "Auth service alive!"}

@app.get("/auth")
async def get_auth(login:str, plain_password:str):
    return await auth_service.get_auth(login, plain_password)

@app.get("/refresh")
async def get_refresh():
    jwt_token=generate_jwt_token()
    return {"auth": "auth"}

@app.get("/logout")
async def get_logout():
    return {"auth": "auth"}
