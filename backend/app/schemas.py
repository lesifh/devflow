from pydantic import BaseModel

# UserRegister / UserLogin：请求体格式

# UserPublic：响应里返回的用户信息，绝不包含密码

# TokenResponse：登录成功返回的格式

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