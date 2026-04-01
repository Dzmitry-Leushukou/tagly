from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from AuthService import AuthService

app = FastAPI(title="Post service")



@app.get("/")
async def read_root():
    return {"Status": "Post service alive!"}
