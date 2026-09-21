from datetime import datetime, date
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

# Sprint指Scrum团队完成一定数量工作所需的短暂、固定的周期。Sprint是Scrum和敏捷的核心
# 相当于一个迭代周期 比如一周
class Sprint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # 外键，属于哪个项目（加索引）
    project_id: int = Field(foreign_key="project.id", index=True)
    name: str # 	迭代名，比如 "Sprint 1"
    goal: str | None = None # 迭代目标（可选）
    start_date: date | None = None # 起止日期（可选）
    end_date: date | None = None 
    status: str = "planning"  # 三种状态：planning 计划中 / active 进行中 / closed 已关闭
    created_at: datetime = Field(default_factory=datetime.utcnow) # 创建时间

# 每一次迭代包含的具体的工作项（需求/任务/缺陷）
class WorkItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    sprint_id: int | None = Field(default=None, foreign_key="sprint.id", index=True)

    type: str = "task"           # story / task / bug
    title: str
    description: str | None = None
    status: str = "todo"         # todo / doing / review / done
    priority: str = "medium"     # low / medium / high

    assignee_id: int | None = Field(default=None, foreign_key="user.id") # 负责人（可为空）
    order: int = 0 # 同列内排序，默认 0

    created_at: datetime = Field(default_factory=datetime.utcnow) # 创建时间
    updated_at: datetime = Field(default_factory=datetime.utcnow) # 更新时间