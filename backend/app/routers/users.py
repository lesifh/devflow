from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.deps import get_current_user
from app.schemas import UserRegister, UserLogin, UserPublic, TokenResponse
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

# 注册
@router.post("/register", response_model=UserPublic, status_code=201)
def register(data: UserRegister, session: Session = Depends(get_session)):
    # 检查用户名是否已存在
    existing = session.exec(select(User).where(User.username == data.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")

    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

# 登录
@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == data.username)).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
         )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserPublic(id=user.id, username=user.username))

    # 行业标准做法是合并提示，原因：
    # 如果登录时提示"用户名不存在"，攻击者就能枚举出哪些用户名已被注册
    # 攻击者不需要密码，就能知道你系统里有哪些账号，然后针对性地爆破密码。这叫 用户名枚举攻击（Username Enumeration）。
    # 所以安全最佳实践是：不管用户不存在还是密码错，都返回同一个模糊提示——"用户名或密码错误"。
    # OWASP（全球权威安全组织）明确推荐这样做。

# 个人信息
@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user