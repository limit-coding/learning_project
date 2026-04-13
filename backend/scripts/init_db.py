"""初始化数据库：创建表 + 导入种子数据"""
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.models import Course, CourseNode, CourseEdge

# 确保所有表都创建
Base.metadata.create_all(bind=engine)

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def load_courses():
    """加载旧版课程种子数据（推荐系统用）"""
    db = SessionLocal()
    try:
        existing = db.query(Course).count()
        if existing > 0:
            print(f"  courses 表已有 {existing} 条，跳过")
            return

        seed_file = DATA_DIR / "courses_seed.json"
        if not seed_file.exists():
            print("  未找到 courses_seed.json，跳过")
            return

        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item in data:
            db.add(Course(**item))
        db.commit()
        print(f"  导入 {len(data)} 门课程")
    except Exception as e:
        print(f"  失败: {e}")
        db.rollback()
    finally:
        db.close()


def load_course_graph():
    """加载课程图谱节点和边"""
    db = SessionLocal()
    try:
        # 节点
        existing_nodes = db.query(CourseNode).count()
        if existing_nodes == 0:
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
        else:
            print(f"  course_nodes 表已有 {existing_nodes} 条，跳过")

        # 边（需要节点先导入）
        existing_edges = db.query(CourseEdge).count()
        if existing_edges == 0:
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
        else:
            print(f"  course_edges 表已有 {existing_edges} 条，跳过")

    except Exception as e:
        print(f"  失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("开始初始化数据库...")
    print("1. 创建表结构")
    print("2. 导入旧版课程数据")
    load_courses()
    print("3. 导入课程图谱数据")
    load_course_graph()
    print("数据库初始化完成！")
