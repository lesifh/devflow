from datetime import datetime, date, timezone
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Project(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None
    owner_id: int = Field(foreign_key="user.id", index=True)
    is_archived: bool = Field(default=False) # 👈 新增：是否归档
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Sprint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    name: str
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str = "planning"   # planning / active / closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    sprint_id: int | None = Field(default=None, foreign_key="sprint.id", index=True)

    type: str = "task"           # story / task / bug
    title: str
    description: str | None = None
    status: str = "todo"         # todo / doing / review / done
    priority: str = "medium"     # low / medium / high

    assignee_id: int | None = Field(default=None, foreign_key="user.id")
    order: int = 0

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))