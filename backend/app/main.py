from fastapi import FastAPI

from app.database import create_db_and_tables
from app import models  # noqa: F401
# noqa = no quality assurance，意思是"别检查这一行"。
# 它是给 flake8、ruff 这类 Python 代码检查工具看的。工具看到这行有 # noqa，就跳过对它的检
from app.routers import users, projects, sprints


app = FastAPI(title="DevFlow API")

app.include_router(users.router)
app.include_router(projects.router)
app.include_router(sprints.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return {"message": "Welcome to DevFlow API"}