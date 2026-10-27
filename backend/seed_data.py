import random
from sqlmodel import Session, select
from app.database import engine
from app.models import User, Project, Sprint, WorkItem
from app.security import hash_password

def seed_more():
    with Session(engine) as session:
        # 获取现有的所有用户（如果空库就重新建）
        users = session.exec(select(User)).all()
        if not users:
            print("❌ 没有用户，请先注册或手动创建。")
            return
        
        alice = session.exec(select(User).where(User.username == "alice")).first()
        bob = session.exec(select(User).where(User.username == "bob")).first()
        
        project_names = ["企业级数据中台建设", "微信小程序电商版", "内部 HR 管理系统", "AI 客服助手研发"]
        
        priorities = ["low", "medium", "high"]
        statuses = ["todo", "doing", "review", "done"]
        
        mock_titles = {
            "story": ["用户单点登录 (SSO)", "数据导出为 Excel", "支持暗黑模式", "消息中心与红点提醒", "商品详情页轮播图", "对接企业微信通知", "支持多语言国际化"],
            "task": ["搭建 CI/CD 流水线", "设计数据库分库分表方案", "编写 API 接口文档", "重构旧版路由逻辑", "接入 Prometheus 监控", "优化首页加载速度", "编写部署脚本"],
            "bug": ["修复内存泄漏导致 OOM", "解决高并发下的超卖问题", "日期格式显示异常", "上传大文件超时断开", "权限拦截器逻辑遗漏", "移动端键盘遮挡输入框", "并发请求时 Token 失效"]
        }

        for p_name in project_names:
            owner = random.choice([alice, bob])
            p = Project(name=p_name, description=f"关于 {p_name} 的业务研发，旨在提升团队效率和业务指标。", owner_id=owner.id)
            session.add(p)
            session.commit()
            session.refresh(p)

            # 每个项目建 2 个迭代
            for i in range(1, 3):
                s = Sprint(
                    project_id=p.id, 
                    name=f"Sprint {i} - 核心功能", 
                    goal=f"完成第 {i} 阶段的核心功能开发", 
                    status=random.choice(["active", "closed"])
                )
                session.add(s)
                session.commit()
                session.refresh(s)

                # 每个迭代生成 15 个任务
                for _ in range(15):
                    w_type = random.choice(["story", "task", "bug"])
                    title = random.choice(mock_titles[w_type])
                    
                    item = WorkItem(
                        project_id=p.id,
                        sprint_id=s.id,
                        type=w_type,
                        title=title,
                        description="详细需求描述待补充。",
                        status=random.choice(statuses),
                        priority=random.choice(priorities),
                        # 👈 核心：强制一半的任务指派给 bob，这样 bob 的工作台就有活干了
                        assignee_id=random.choice([alice.id, bob.id]) if random.random() > 0.3 else bob.id
                    )
                    session.add(item)

        session.commit()
        print("🔥 爆量假数据生成成功！包含大量分配给 bob 的任务！")

if __name__ == "__main__":
    seed_more()