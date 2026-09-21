from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import Project, Sprint, WorkItem, User
from app.schemas import WorkItemCreate, WorkItemUpdate, WorkItemPublic
from app.routers.sprints import get_owned_project

from app.schemas import (
    WorkItemCreate,
    WorkItemUpdate,
    WorkItemPublic,
    BoardResponse,
)

router = APIRouter(tags=["work-items"])


@router.get("/projects/{project_id}/items", response_model=list[WorkItemPublic])
def list_items(
    project_id: int,
    type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sprint_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """列出项目下的工作项，支持按类型/状态/迭代筛选"""
    get_owned_project(project_id, current_user, session)

    statement = select(WorkItem).where(WorkItem.project_id == project_id)
    if type:
        statement = statement.where(WorkItem.type == type)
    if status:
        statement = statement.where(WorkItem.status == status)
    if sprint_id is not None:
        statement = statement.where(WorkItem.sprint_id == sprint_id)

    statement = statement.order_by(WorkItem.order, WorkItem.id)
    return session.exec(statement).all()


@router.post("/projects/{project_id}/items", response_model=WorkItemPublic, status_code=201)
def create_item(
    project_id: int,
    data: WorkItemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_project(project_id, current_user, session)

    # 如果指定了 sprint_id，校验它属于本项目
    if data.sprint_id is not None:
        sprint = session.get(Sprint, data.sprint_id)
        if not sprint or sprint.project_id != project_id:
            raise HTTPException(status_code=400, detail="迭代不属于该项目")

    item = WorkItem(
        project_id=project_id,
        type=data.type,
        title=data.title,
        description=data.description,
        priority=data.priority,
        sprint_id=data.sprint_id,
        assignee_id=data.assignee_id,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.get("/items/{item_id}", response_model=WorkItemPublic)
def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    item = session.get(WorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="工作项不存在")
    get_owned_project(item.project_id, current_user, session)
    return item


@router.put("/items/{item_id}", response_model=WorkItemPublic)
def update_item(
    item_id: int,
    data: WorkItemUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    item = session.get(WorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="工作项不存在")
    get_owned_project(item.project_id, current_user, session)

    update_data = data.model_dump(exclude_unset=True)

    # 如果修改 sprint_id，校验新迭代属于同项目
    # 如果客户端改了 sprint_id，而且改成了一个具体的迭代（不是 None） 那么验证这个迭代是否存在、是否属于同一个项目。不合法就报 400。
    if "sprint_id" in update_data and update_data["sprint_id"] is not None:
        sprint = session.get(Sprint, update_data["sprint_id"])
        if not sprint or sprint.project_id != item.project_id:
            raise HTTPException(status_code=400, detail="迭代不属于该项目")

    for key, value in update_data.items():
        setattr(item, key, value)

    from datetime import datetime
    item.updated_at = datetime.utcnow()

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
    item = session.get(WorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="工作项不存在")
    get_owned_project(item.project_id, current_user, session)

    session.delete(item)
    session.commit()
    return None

# 看板接口
@router.get("/projects/{project_id}/board", response_model=BoardResponse)
def get_board(
    project_id: int,
    sprint_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """看板视图：按状态分组返回工作项"""
    # 校验项目归属，失败就抛异常
    get_owned_project(project_id, current_user, session)

    statement = select(WorkItem).where(WorkItem.project_id == project_id)
    if sprint_id is not None:
        statement = statement.where(WorkItem.sprint_id == sprint_id)
    statement = statement.order_by(WorkItem.order, WorkItem.id)

    items = session.exec(statement).all()

    # 按状态分组
    board = {"todo": [], "doing": [], "review": [], "done": []}
    for item in items:
        if item.status in board:
            board[item.status].append(item)

    return board