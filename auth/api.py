from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from AuthService import AuthService

app = FastAPI(title="Auth service")
auth_service = AuthService()


class AuthRequest(BaseModel):
    login: str
    password: str


class AuthResponse(BaseModel):
    status: str
    access_token: str | None = None
    refresh_token: str | None = None


@app.get("/")
async def read_root():
    return {"Status": "Auth service alive!"}


@app.post("/auth", response_model=AuthResponse)
async def get_auth(request: AuthRequest):
    result = await auth_service.get_auth(request.login, request.password)
    if result["status"] != "Success":
        raise HTTPException(status_code=401, detail="Wrong login or password")
    return result

