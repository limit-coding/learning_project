"""初始化数据库：创建表 + 导入种子数据"""
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text

from app.database import SessionLocal, engine, Base
from app.models.models import (
    CourseNode,
    CourseEdge,
    Resource,
    ResourceCourseMapping,
    Roadmap,
)

# 确保所有表都创建
Base.metadata.create_all(bind=engine)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def drop_legacy_tables():
    """删除旧个性化推荐版本遗留的数据表。"""
    db = SessionLocal()
    try:
        for table_name in ["embeddings", "document_chunks", "recommendations", "user_profiles", "courses"]:
            db.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
        db.commit()
        print("  已删除旧推荐系统遗留表")
    except Exception as e:
        print(f"  失败: {e}")
        db.rollback()
    finally:
        db.close()


def reset_seed_tables():
    """重置演示种子表，确保结项版本只保留北邮大二下五门课。"""
    db = SessionLocal()
    try:
        for model in [
            ResourceCourseMapping,
            Resource,
            CourseEdge,
            Roadmap,
            CourseNode,
        ]:
            db.query(model).delete()
        db.commit()
        print("  已清理旧路线图、资源和课程图谱数据")
    except Exception as e:
        print(f"  失败: {e}")
        db.rollback()
    finally:
        db.close()


def load_course_graph():
    """加载北邮大二下课程图谱节点和边"""
    db = SessionLocal()
    try:
        nodes_file = DATA_DIR / "course_graph_seed.json"
        if nodes_file.exists():
            with open(nodes_file, "r", encoding="utf-8") as f:
                nodes_data = json.load(f)
            for item in nodes_data:
                db.add(CourseNode(**item))
            db.commit()
            print(f"  导入 {len(nodes_data)} 个课程节点")
        else:
            print("  未找到 course_graph_seed.json，跳过节点导入")

        edges_file = DATA_DIR / "course_edges_seed.json"
        if edges_file.exists():
            slug_to_id = {n.slug: n.id for n in db.query(CourseNode).all()}
            with open(edges_file, "r", encoding="utf-8") as f:
                edges_data = json.load(f)

            count = 0
            for item in edges_data:
                source_id = slug_to_id.get(item["source"])
                target_id = slug_to_id.get(item["target"])
                if source_id and target_id:
                    db.add(CourseEdge(
                        source_node_id=source_id,
                        target_node_id=target_id,
                        relation_type=item.get("relation_type", "prerequisite"),
                    ))
                    count += 1
            db.commit()
            print(f"  导入 {count} 条课程边关系")
        else:
            print("  未找到 course_edges_seed.json，跳过边导入")

    except Exception as e:
        print(f"  失败: {e}")
        db.rollback()
    finally:
        db.close()


def load_resources():
    """加载人工整理/AI 辅助整理的资源卡片。"""
    db = SessionLocal()
    try:
        seed_file = DATA_DIR / "resources_seed.json"
        if not seed_file.exists():
            print("  未找到 resources_seed.json，跳过")
            return

        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        slug_to_node = {n.slug: n for n in db.query(CourseNode).all()}
        count = 0
        for group in data:
            node = slug_to_node.get(group["slug"])
            if not node:
                continue
            for item in group.get("resources", []):
                resource = Resource(
                    title=item["title"],
                    url=item.get("url"),
                    resource_type=item.get("resource_type"),
                    source=item.get("source"),
                    summary=item.get("summary"),
                    difficulty=item.get("difficulty"),
                    status="approved",
                    submitted_by="seed",
                    reviewed_by="teacher",
                )
                db.add(resource)
                db.flush()
                db.add(ResourceCourseMapping(resource_id=resource.id, course_node_id=node.id))
                count += 1
        db.commit()
        print(f"  导入 {count} 条资源")
    except Exception as e:
        print(f"  失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("开始初始化数据库...")
    print("1. 创建表结构")
    print("2. 删除旧推荐系统遗留表")
    drop_legacy_tables()
    print("3. 清理旧演示数据")
    reset_seed_tables()
    print("4. 导入课程图谱数据")
    load_course_graph()
    print("5. 导入人工整理资源数据")
    load_resources()
    print("数据库初始化完成！")
