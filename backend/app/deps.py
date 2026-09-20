# 做一个 get_current_user 依赖，
# 以后任何需要登录才能访问的接口，加一行 Depends(get_current_user) 就行。
# 检查登录状态的depend

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session

from app.database import get_session
from app.models import User
from app.security import decode_access_token

bearer_scheme = HTTPBearer()
# 以后任何接口，只要加上它，就会自动：


def get_current_user(
    # 从请求头里拿 token
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    token = credentials.credentials
    user_id = decode_access_token(token)
    if user_id is None:
        # 验证 token 是否有效
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效或过期的 token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = session.get(User, user_id)
    # 查出这个 token 对应的用户
    # 把用户对象交给接口函数用
    if user is None:
    # 任何一步失败，自动返回 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    return user