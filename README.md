<table align="center">
  <tr>
    <td><img src="assets/logo.svg" alt="DevFlow Logo" width="60" /></td>
    <td style="font-size: 32px; font-weight: bold; padding-left: 12px;">DevFlow</td>
  </tr>
</table>
<p align="center">一个面向软件团队的敏捷项目管理系统</p>


支持项目管理、迭代规划（Sprint）、工作项跟踪（需求/任务/缺陷）和看板视图。

## 技术栈

- **后端**：FastAPI + SQLModel + SQLite + JWT
- **前端**：React + TypeScript + Vite（开发中）
- **测试**：pytest（开发中）

## 核心概念

- **项目（Project）**：一个软件项目
- **迭代（Sprint）**：项目下的开发周期
- **工作项（WorkItem）**：需求 / 任务 / 缺陷
- **看板（Board）**：按状态展示工作项

## 功能进度

### 后端 ✅ 已完成

- [x] 用户注册 / 登录（JWT 认证）
- [x] 权限依赖（get_current_user）
- [x] 项目 CRUD + 权限隔离
- [x] 迭代（Sprint）CRUD
- [x] 工作项（WorkItem）CRUD + 筛选
- [x] 看板接口（按状态分组）
- [ ] 后端单元测试（pytest）

### 前端 🚧 开发中

- [ ] 项目环境搭建
- [ ] 登录 / 注册页面
- [ ] 项目列表与详情
- [ ] 迭代管理页面
- [ ] 看板视图 + 拖动

### 部署 ⏳ 待开始

- [ ] 服务器部署
- [ ] 域名配置

## 本地运行

### 后端

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

打开 http://127.0.0.1:8000/docs 查看 API 文档。

## API 概览

| 模块 | 接口 |
|------|------|
| 认证 | POST /auth/register, POST /auth/login, GET /auth/me |
| 项目 | GET/POST /projects, GET/PUT/DELETE /projects/{id} |
| 迭代 | GET/POST /projects/{id}/sprints, GET/PUT/DELETE /sprints/{id} |
| 工作项 | GET/POST /projects/{id}/items, GET/PUT/DELETE /items/{id} |
| 看板 | GET /projects/{id}/board |

## 开发记录

- **2026-09-19**：项目启动，搭建 FastAPI 骨架
- **2026-09-20**：完成用户认证与项目 CRUD
- **2026-09-21**：完成后端全部核心模块（迭代、工作项、看板）

## License

课程项目，仅供学习使用。