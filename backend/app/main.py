from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import create_db_and_tables
from app import models  # noqa: F401
# noqa = no quality assurance，意思是"别检查这一行"。
# 它是给 flake8、ruff 这类 Python 代码检查工具看的。工具看到这行有 # noqa，就跳过对它的检
from app.routers import users, projects, sprints, work_items

# 跨域
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时
    create_db_and_tables()
    yield
    # 关闭时（这里不需要做什么）

app = FastAPI(title="DevFlow API", lifespan=lifespan)

# CORS 配置（开发环境）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(projects.router)
app.include_router(sprints.router)
app.include_router(work_items.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to DevFlow API"}