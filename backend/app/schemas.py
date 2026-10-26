from datetime import datetime, date
from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_archived: bool | None = None # 👈 新增


class ProjectPublic(BaseModel):
    id: int
    name: str
    description: str | None
    owner_id: int
    is_archived: bool # 👈 新增
    created_at: datetime


class SprintCreate(BaseModel):
    name: str
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class SprintUpdate(BaseModel):
    name: str | None = None
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class SprintPublic(BaseModel):
    id: int
    project_id: int
    name: str
    goal: str | None
    start_date: date | None
    end_date: date | None
    status: str
    created_at: datetime


class WorkItemCreate(BaseModel):
    type: str = "task"
    title: str
    description: str | None = None
    priority: str = "medium"
    sprint_id: int | None = None
    assignee_id: int | None = None


class WorkItemUpdate(BaseModel):
    type: str | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    sprint_id: int | None = None
    assignee_id: int | None = None
    order: int | None = None


class WorkItemPublic(BaseModel):
    id: int
    project_id: int
    sprint_id: int | None
    type: str
    title: str
    description: str | None
    status: str
    priority: str
    assignee_id: int | None
    assignee_name: str | None = None
    project_name: str | None = None
    order: int
    created_at: datetime
    updated_at: datetime


class BoardResponse(BaseModel):
    todo: list[WorkItemPublic]
    doing: list[WorkItemPublic]
    review: list[WorkItemPublic]
    done: list[WorkItemPublic]