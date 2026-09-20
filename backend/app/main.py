from fastapi import FastAPI

from app.database import create_db_and_tables
from app import models
app = FastAPI(title="DevFlow API")

@app.on_event("startup")
# 服务启动时执行 create_db_and_tables()
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Welcome to DevFlow API"}