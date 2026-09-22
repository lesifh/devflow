def test_register_success(client):
    """测试注册成功"""
    res = client.post("/auth/register", json={
        "username": "alice",
        "password": "123456",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "alice"
    assert "id" in data
    assert "password" not in data          # 绝不返回密码
    assert "hashed_password" not in data   # 也不返回哈希


def test_register_duplicate(client):
    """测试重复注册返回 400"""
    client.post("/auth/register", json={"username": "bob", "password": "123456"})
    res = client.post("/auth/register", json={"username": "bob", "password": "123456"})
    assert res.status_code == 400
    assert "已存在" in res.json()["detail"]


def test_login_success(client):
    """测试登录成功返回 token"""
    client.post("/auth/register", json={"username": "alice", "password": "123456"})
    res = client.post("/auth/login", json={"username": "alice", "password": "123456"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "alice"


def test_login_wrong_password(client):
    """测试密码错误返回 401"""
    client.post("/auth/register", json={"username": "alice", "password": "123456"})
    res = client.post("/auth/login", json={"username": "alice", "password": "wrong"})
    assert res.status_code == 401


def test_login_nonexistent_user(client):
    """测试用户不存在返回 401"""
    res = client.post("/auth/login", json={"username": "ghost", "password": "123456"})
    assert res.status_code == 401