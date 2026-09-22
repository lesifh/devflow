import pytest


@pytest.fixture(name="auth_client")
def auth_client_fixture(client):
    """返回一个已登录的 client（注册 + 登录 + 自动带 token）"""
    client.post("/auth/register", json={"username": "alice", "password": "123456"})
    res = client.post("/auth/login", json={"username": "alice", "password": "123456"})
    token = res.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
# 每次测试自动：1.注册 alice 2.登录拿 token 3.把 token 塞进 client 的 headers



def test_create_project(auth_client):
    """测试创建项目"""
    res = auth_client.post("/projects", json={
        "name": "我的项目",
        "description": "测试项目",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "我的项目"
    assert data["description"] == "测试项目"
    assert "id" in data
    assert "owner_id" in data


def test_list_projects(auth_client):
    """测试列出项目"""
    auth_client.post("/projects", json={"name": "项目1"})
    auth_client.post("/projects", json={"name": "项目2"})
    res = auth_client.get("/projects")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2


def test_get_project_detail(auth_client):
    """测试获取项目详情"""
    res = auth_client.post("/projects", json={"name": "详情测试"})
    project_id = res.json()["id"]
    res = auth_client.get(f"/projects/{project_id}")
    assert res.status_code == 200
    assert res.json()["name"] == "详情测试"


def test_update_project(auth_client):
    """测试部分更新：只传 name，description 不变"""
    res = auth_client.post("/projects", json={"name": "旧名字", "description": "旧描述"})
    project_id = res.json()["id"]

    res = auth_client.put(f"/projects/{project_id}", json={"name": "新名字"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "新名字"
    assert data["description"] == "旧描述"   # 关键：没被清空


def test_delete_project(auth_client):
    """测试删除项目"""
    res = auth_client.post("/projects", json={"name": "待删除"})
    project_id = res.json()["id"]
    res = auth_client.delete(f"/projects/{project_id}")
    assert res.status_code == 204
    res = auth_client.get(f"/projects/{project_id}")
    assert res.status_code == 404


def test_project_not_found(auth_client):
    """测试访问不存在的项目"""
    res = auth_client.get("/projects/9999")
    assert res.status_code == 404


def test_unauthorized_access(client):
    """测试未登录访问项目接口"""
    res = client.get("/projects")
    assert res.status_code == 401


def test_cross_user_access(client):
    """测试权限隔离：用户 B 不能访问用户 A 的项目"""
    # 用户 A 创建项目
    client.post("/auth/register", json={"username": "alice", "password": "123456"})
    res = client.post("/auth/login", json={"username": "alice", "password": "123456"})
    token_a = res.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token_a}"})
    res = client.post("/projects", json={"name": "Alice的项目"})
    project_id = res.json()["id"]

    # 用户 B 登录
    client.post("/auth/register", json={"username": "bob", "password": "123456"})
    res = client.post("/auth/login", json={"username": "bob", "password": "123456"})
    token_b = res.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token_b}"})

    # B 访问 A 的项目 → 应该 404（不是 403，防枚举）
    res = client.get(f"/projects/{project_id}")
    assert res.status_code == 404