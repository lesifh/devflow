from datetime import datetime
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    #  table=True：告诉 SQLModel 这是一张数据库表
    id: int | None = Field(default=None, primary_key=True)
    # id：主键，None 表示交给数据库自增
    username: str = Field(index=True, unique=True)
    # username：加了索引，唯一
    hashed_password: str
    # hashed_password：永远存哈希，不存明文
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # created_at：默认当前时间


class Project(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None
    # 指向users的外键
    owner_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)