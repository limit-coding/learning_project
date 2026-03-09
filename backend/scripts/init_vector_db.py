import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from app.services.vector_service import VectorService


def main():
    """初始化向量数据库"""
    print("🚀 开始初始化向量数据库...")

    # 加载课程数据
    with open('../data/courses_seed.json', 'r', encoding='utf-8') as f:
        courses = json.load(f)

    print(f"📚 加载了 {len(courses)} 门课程")

    # 初始化向量服务
    vector_service = VectorService()

    # 索引课程
    print("🔍 正在生成向量嵌入...")
    vector_service.index_courses(courses)

    print("✅ 向量数据库初始化完成！")
    print(f"📊 已索引 {len(courses)} 门课程到 ChromaDB")

    # 测试搜索
    print("\n🧪 测试语义搜索...")
    results = vector_service.search_similar_courses("我想学计算机视觉", top_k=3)
    print("搜索结果:")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['metadata']['title']}")


if __name__ == "__main__":
    main()
