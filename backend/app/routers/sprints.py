from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import Project, Sprint, User
from app.schemas import SprintCreate, SprintUpdate, SprintPublic

router = APIRouter(tags=["sprints"])

# 确定这个项目是不是属于你的
def get_owned_project(project_id: int, user: User, session: Session) -> Project:
    """公共函数：确认项目存在且属于当前用户"""
    project = session.get(Project, project_id)
    if not project or project.owner_id != user.id:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project

# 为什么获取列表用嵌套路径，而单个操作用 /sprints/{id}？
# 列表天然属于项目 → 嵌套更自然
# 单个迭代已经能通过 id 唯一定位 → 不需要再带 project_id
# 这是 REST 里常见的设计，前端用起来也方便
# 路径有两种形式（/projects/... 和 /sprints/...），不能用统一前缀。用 tags 分组就够了

#  某项目下的所有迭代（RESTful 嵌套资源）
@router.get("/projects/{project_id}/sprints", response_model=list[SprintPublic])
def list_sprints(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_project(project_id, current_user, session)
    sprints = session.exec(
        select(Sprint).where(Sprint.project_id == project_id)
    ).all()
    return sprints

# 在某项目下建迭代
@router.post("/projects/{project_id}/sprints", response_model=SprintPublic, status_code=201)
def create_sprint(
    project_id: int,
    data: SprintCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_project(project_id, current_user, session)
    sprint = Sprint(
        project_id=project_id,
        name=data.name,
        goal=data.goal,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    session.add(sprint)
    session.commit()
    session.refresh(sprint)
    return sprint

# 对单个迭代操作
@router.get("/sprints/{sprint_id}", response_model=SprintPublic)
def get_sprint(
    sprint_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sprint = session.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="迭代不存在")
    get_owned_project(sprint.project_id, current_user, session)
    return sprint


@router.put("/sprints/{sprint_id}", response_model=SprintPublic)
def update_sprint(
    sprint_id: int,
    data: SprintUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sprint = session.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="迭代不存在")
    get_owned_project(sprint.project_id, current_user, session)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sprint, key, value)

    session.add(sprint)
    session.commit()
    session.refresh(sprint)
    return sprint


@router.delete("/sprints/{sprint_id}", status_code=204)
def delete_sprint(
    sprint_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sprint = session.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="迭代不存在")
    get_owned_project(sprint.project_id, current_user, session)

    session.delete(sprint)
    session.commit()
    return None