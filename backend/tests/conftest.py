import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.database import get_session

# conftest.py中定义的 fixture 会被所有测试自动共享

@pytest.fixture(name="session")
def session_fixture():
    """每个测试用独立的内存数据库，测试结束就会销毁"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """覆盖 get_session 依赖，让测试用内存数据库"""
    # 测试不能污染 devflow.db 保证每个测试独立、干净、快。
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()