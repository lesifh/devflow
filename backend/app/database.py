from sqlmodel import SQLModel, create_engine, Session

# SQLite 数据库文件，会生成在 backend/ 目录下
sqlite_file_name = "devflow.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# 数据库连接引擎 check_same_thread=False 是 SQLite 在多线程下的必要设置
engine = create_engine(
    sqlite_url,
    echo=True,           # 打印 SQL 语句，方便学习，生产环境可关
    connect_args={"check_same_thread": False},
)

def create_db_and_tables():
    """启动时建表：根据已定义的模型创建所有表"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """FastAPI 依赖：每个请求一个数据库会话
    每个 HTTP 请求分配一个会话，用完自动关闭（后面用 Depends(get_session) 注入）
    """
    with Session(engine) as session:
        yield session