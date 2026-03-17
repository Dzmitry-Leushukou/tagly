from fastapi import FastAPI
from AuthService import AuthService


app = FastAPI(title="Auth service")
auth_serivce=AuthService()

@app.get("/")
async def read_root():
    return {"Status": "Auth serivce alive!"}

@app.get("/auth")
async def get_auth(login:str, plain_password:str):
    status = await auth_serivce.try_auth(login, plain_password)
    if status=="Success":
        jwt_token=generate_jwt_token()
        return {
            "status": status,
            "jwt_token": jwt_token
            }
    return {
            "status": status
            }

@app.get("/refresh")
async def get_refresh():
    jwt_token=generate_jwt_token()
    return {"auth": "auth"}

@app.get("/logout")
async def get_logout():
    return {"auth": "auth"}

