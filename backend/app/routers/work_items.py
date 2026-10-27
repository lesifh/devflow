from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.deps import get_current_user
from app.models import Project, Sprint, WorkItem, User
from app.schemas import WorkItemCreate, WorkItemUpdate, WorkItemPublic, BoardResponse
from app.routers.sprints import get_owned_project

router = APIRouter(tags=["work-items"])

def get_authorized_item(item_id: int, user: User, session: Session) -> WorkItem:
    item = session.get(WorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="工作项不存在")
    project = session.get(Project, item.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    if project.owner_id != user.id and item.assignee_id != user.id:
        raise HTTPException(status_code=403, detail="没有权限操作此工作项")
    return item

@router.get("/projects/{project_id}/items", response_model=list[WorkItemPublic])
def list_items(
    project_id: int,
    type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sprint_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_project(project_id, current_user, session)
    statement = select(WorkItem).where(WorkItem.project_id == project_id)
    if type: statement = statement.where(WorkItem.type == type)
    if status: statement = statement.where(WorkItem.status == status)
    if sprint_id is not None: statement = statement.where(WorkItem.sprint_id == sprint_id)
    statement = statement.order_by(WorkItem.order, WorkItem.id)
    items = session.exec(statement).all()
    
    user_ids = {item.assignee_id for item in items if item.assignee_id}
    users = {}
    if user_ids:
        users_list = session.exec(select(User).where(User.id.in_(user_ids))).all()
        users = {u.id: u.username for u in users_list}
        
    result = []
    for item in items:
        item_dict = item.model_dump()
        if item.assignee_id: item_dict["assignee_name"] = users.get(item.assignee_id)
        result.append(item_dict)
    return result

@router.post("/projects/{project_id}/items", response_model=WorkItemPublic, status_code=201)
def create_item(
    project_id: int,
    data: WorkItemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_project(project_id, current_user, session)
    if data.sprint_id is not None:
        sprint = session.get(Sprint, data.sprint_id)
        if not sprint or sprint.project_id != project_id:
            raise HTTPException(status_code=400, detail="迭代不属于该项目")

    item = WorkItem(
        project_id=project_id, type=data.type, title=data.title,
        description=data.description, priority=data.priority,
        sprint_id=data.sprint_id, assignee_id=data.assignee_id,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.get("/tasks/assigned", response_model=list[WorkItemPublic])
def get_my_assigned_items(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(WorkItem).where(WorkItem.assignee_id == current_user.id)
    items = session.exec(statement).all()
    result = []
    for item in items:
        item_dict = item.model_dump()
        item_dict["assignee_name"] = current_user.username
        project = session.get(Project, item.project_id)
        if project: item_dict["project_name"] = project.name
        result.append(item_dict)
    return result

# 👈 重点修复：获取单个任务时，带上 assignee_name
@router.get("/items/{item_id}", response_model=WorkItemPublic)
def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    item = get_authorized_item(item_id, current_user, session)
    item_dict = item.model_dump()
    if item.assignee_id:
        user = session.get(User, item.assignee_id)
        if user: item_dict["assignee_name"] = user.username
    project = session.get(Project, item.project_id)
    if project: item_dict["project_name"] = project.name
    return item_dict

@router.put("/items/{item_id}", response_model=WorkItemPublic)
def update_item(
    item_id: int,
    data: WorkItemUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    item = get_authorized_item(item_id, current_user, session)
    update_data = data.model_dump(exclude_unset=True)
    
    if "sprint_id" in update_data and update_data["sprint_id"] is not None:
        sprint = session.get(Sprint, update_data["sprint_id"])
        if not sprint or sprint.project_id != item.project_id:
            raise HTTPException(status_code=400, detail="迭代不属于该项目")

    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    item = get_authorized_item(item_id, current_user, session)
    project = session.get(Project, item.project_id)
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="只有项目所有者可以删除")
    session.delete(item)
    session.commit()
    return None

@router.get("/projects/{project_id}/board", response_model=BoardResponse)
def get_board(
    project_id: int,
    sprint_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_project(project_id, current_user, session)
    statement = select(WorkItem).where(WorkItem.project_id == project_id)
    if sprint_id is not None: statement = statement.where(WorkItem.sprint_id == sprint_id)
    statement = statement.order_by(WorkItem.order, WorkItem.id)
    items = session.exec(statement).all()

    user_ids = {item.assignee_id for item in items if item.assignee_id}
    users = {}
    if user_ids:
        users_list = session.exec(select(User).where(User.id.in_(user_ids))).all()
        users = {u.id: u.username for u in users_list}

    board = {"todo": [], "doing": [], "review": [], "done": []}
    for item in items:
        if item.status in board:
            item_dict = item.model_dump()
            if item.assignee_id: item_dict["assignee_name"] = users.get(item.assignee_id)
            board[item.status].append(item_dict)
    return board