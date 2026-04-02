from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from DeepseekService import send_completion_request


app = FastAPI(title="Post service")



@app.get("/")
async def read_root():
    return {"Status": "Post service alive!"}

@app.get("/test")
async def test():
    return send_completion_request("Привет","Отвечай максимально кратко")