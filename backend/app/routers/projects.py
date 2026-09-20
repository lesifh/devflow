from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import Project, User
from app.schemas import ProjectCreate, ProjectPublic

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectPublic])
def list_projects(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """获取当前用户的所有项目"""
    projects = session.exec(
        select(Project).where(Project.owner_id == current_user.id)
    ).all()
    return projects


@router.post("", response_model=ProjectPublic, status_code=201)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """创建项目"""
    project = Project(
        name=data.name,
        description=data.description,
        owner_id=current_user.id,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project