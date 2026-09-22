import pytest


@pytest.fixture(name="project")
def project_fixture(auth_client):
    """创建一个测试项目，返回 project_id"""
    res = auth_client.post("/projects", json={"name": "测试项目"})
    return res.json()["id"]


@pytest.fixture(name="auth_client")
def auth_client_fixture(client):
    """已登录的 client"""
    client.post("/auth/register", json={"username": "alice", "password": "123456"})
    res = client.post("/auth/login", json={"username": "alice", "password": "123456"})
    token = res.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


def test_create_work_item(auth_client, project):
    """测试创建工作项，验证默认值"""
    res = auth_client.post(f"/projects/{project}/items", json={
        "title": "实现登录功能",
        "type": "story",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "实现登录功能"
    assert data["type"] == "story"
    assert data["status"] == "todo"       # 默认值
    assert data["priority"] == "medium"   # 默认值
    assert data["sprint_id"] is None
    assert data["order"] == 0


def test_list_items_filter_by_type(auth_client, project):
    """测试按类型筛选"""
    auth_client.post(f"/projects/{project}/items", json={"title": "需求", "type": "story"})
    auth_client.post(f"/projects/{project}/items", json={"title": "任务", "type": "task"})
    auth_client.post(f"/projects/{project}/items", json={"title": "缺陷", "type": "bug"})

    res = auth_client.get(f"/projects/{project}/items?type=bug")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["type"] == "bug"


def test_list_items_filter_by_status(auth_client, project):
    """测试按状态筛选"""
    res = auth_client.post(f"/projects/{project}/items", json={"title": "A"})
    item_id = res.json()["id"]
    auth_client.put(f"/items/{item_id}", json={"status": "doing"})

    auth_client.post(f"/projects/{project}/items", json={"title": "B"})

    res = auth_client.get(f"/projects/{project}/items?status=doing")
    data = res.json()
    assert len(data) == 1
    assert data[0]["status"] == "doing"


def test_partial_update(auth_client, project):
    """测试部分更新：只传 status，其他字段不变"""
    res = auth_client.post(f"/projects/{project}/items", json={
        "title": "原标题",
        "type": "task",
        "priority": "high",
    })
    item_id = res.json()["id"]

    res = auth_client.put(f"/items/{item_id}", json={"status": "done"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "done"
    assert data["title"] == "原标题"        # 不变
    assert data["type"] == "task"           # 不变
    assert data["priority"] == "high"       # 不变


def test_sprint_cross_project_validation(auth_client, project):
    """测试跨项目校验：不能把工作项分到别的项目的迭代"""
    # 建第二个项目 + 它的迭代
    res = auth_client.post("/projects", json={"name": "另一个项目"})
    project2 = res.json()["id"]
    res = auth_client.post(f"/projects/{project2}/sprints", json={"name": "Sprint X"})
    sprint2 = res.json()["id"]

    # 在 project1 建工作项
    res = auth_client.post(f"/projects/{project}/items", json={"title": "测试"})
    item_id = res.json()["id"]

    # 尝试分到 project2 的迭代 → 应该 400
    res = auth_client.put(f"/items/{item_id}", json={"sprint_id": sprint2})
    assert res.status_code == 400
    assert "不属于该项目" in res.json()["detail"]


def test_board_grouping(auth_client, project):
    """测试看板按状态分组"""
    # 创建 4 个工作项，分布到 4 个状态
    statuses = ["todo", "doing", "review", "done"]
    for i, st in enumerate(statuses):
        res = auth_client.post(f"/projects/{project}/items", json={"title": f"任务{i}"})
        item_id = res.json()["id"]
        if st != "todo":   # todo 是默认，不用改
            auth_client.put(f"/items/{item_id}", json={"status": st})

    res = auth_client.get(f"/projects/{project}/board")
    assert res.status_code == 200
    board = res.json()
    assert len(board["todo"]) == 1
    assert len(board["doing"]) == 1
    assert len(board["review"]) == 1
    assert len(board["done"]) == 1


def test_board_empty_status(auth_client, project):
    """测试看板空状态的列返回空数组"""
    auth_client.post(f"/projects/{project}/items", json={"title": "唯一任务"})
    res = auth_client.get(f"/projects/{project}/board")
    board = res.json()
    assert len(board["todo"]) == 1
    assert board["doing"] == []
    assert board["review"] == []
    assert board["done"] == []


def test_delete_work_item(auth_client, project):
    """测试删除工作项"""
    res = auth_client.post(f"/projects/{project}/items", json={"title": "待删除"})
    item_id = res.json()["id"]

    res = auth_client.delete(f"/items/{item_id}")
    assert res.status_code == 204

    res = auth_client.get(f"/items/{item_id}")
    assert res.status_code == 404