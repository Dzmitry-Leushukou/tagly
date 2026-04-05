from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from AuthService import AuthService

app = FastAPI(title="Auth service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
auth_service = AuthService()


class AuthRequest(BaseModel):
    login: str
    password: str


class AuthResponse(BaseModel):
    status: str
    access_token: str | None = None
    refresh_token: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str

@app.get("/")
async def read_root():
    return {"Status": "Auth service alive!"}


@app.post("/auth", response_model=AuthResponse)
async def get_auth(request: AuthRequest):
    result = await auth_service.get_auth(request.login, request.password)
    if result["status"] != "Success":
        raise HTTPException(status_code=401, detail="Wrong login or password")
    return result

@app.post("/register")
async def register(request: AuthRequest):
    result = await auth_service.register(request.login, request.password)
    if result["status"] != "Success":
        raise HTTPException(status_code=401, detail=result["status"])
    return result

@app.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshRequest):
    result = await auth_service.refresh(request.refresh_token)
    if result["status"] != "Success":
        raise HTTPException(status_code=401, detail=result["status"])
    return result


@app.get("/verify")
async def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.split(" ", 1)[1]
    payload = auth_service.jwt_service.verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {"login": payload.get("login")}