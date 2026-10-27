from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import Project, Sprint, User
from app.schemas import SprintCreate, SprintUpdate, SprintPublic

router = APIRouter(tags=["sprints"])


def get_owned_project(project_id: int, user: User, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.owner_id != user.id:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


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
        status="active",  # 👈 默认直接进入进行中
    )
    session.add(sprint)
    session.commit()
    session.refresh(sprint)
    return sprint


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