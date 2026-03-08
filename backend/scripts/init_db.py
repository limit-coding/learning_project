import json
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.models import Course

# 创建所有表
Base.metadata.create_all(bind=engine)


def load_courses():
    """加载课程种子数据"""
    db = SessionLocal()
    try:
        # 检查是否已有数据
        existing_count = db.query(Course).count()
        if existing_count > 0:
            print(f"数据库中已有 {existing_count} 门课程，跳过初始化")
            return

        # 读取种子数据
        seed_file = Path(__file__).parent.parent.parent / "data" / "courses_seed.json"
        with open(seed_file, "r", encoding="utf-8") as f:
            courses_data = json.load(f)

        # 插入数据
        for course_data in courses_data:
            course = Course(**course_data)
            db.add(course)

        db.commit()
        print(f"成功导入 {len(courses_data)} 门课程")

    except Exception as e:
        print(f"导入失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("开始初始化数据库...")
    load_courses()
    print("数据库初始化完成！")
