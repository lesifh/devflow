from fastapi import FastAPI

from app.database import create_db_and_tables
from app import models  # noqa: F401
from app.routers import users, projects


app = FastAPI(title="DevFlow API")

app.include_router(users.router)
app.include_router(projects.router)



@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return {"message": "Welcome to DevFlow API"}