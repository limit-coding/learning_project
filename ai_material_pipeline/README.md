# AI 课程材料结构化流水线

这个目录用于把每门课的真实教材、参考书、目录、课件标题和老师重点整理成系统可用的 JSON。

当前定位是内部协作工具，不面向普通用户开放上传。普通用户只看审核后的课程路线、知识图谱和资料推荐。

## 推荐流程

1. 把材料整理成 Markdown 或 TXT，放到 `raw_materials/`
   - 教材书名、版本、作者
   - 课程目录或课件目录
   - 老师给的重点
   - 参考书、公开课、视频链接
   - 实验要求、作业题型、考试侧重点

2. 运行 AI 解析脚本

```bash
cd ai_material_pipeline
cp .env.example .env
# 编辑 .env，填入 XIAOMI_API_KEY 和 XIAOMI_MODEL
python3 scripts/material_to_json.py \
  --course bupt_communication_principles \
  --input raw_materials/communication_principles.md
```

如果多门课都已经放好了原始材料，也可以批量跑：

```bash
python3 scripts/batch_material_to_json.py
```

原始材料文件名建议直接使用课程 slug，例如：

```text
raw_materials/bupt_communication_principles.md
raw_materials/bupt_computer_organization.md
raw_materials/bupt_deep_learning_pytorch.md
raw_materials/bupt_discrete_math.md
raw_materials/bupt_programming_practice.md
```

3. 检查输出文件

输出会写到：

```text
outputs/bupt_communication_principles.draft.json
```

批量检查所有 AI JSON：

```bash
python3 scripts/validate_course_jsons.py
```

严格检查会提示哪些 AI 草稿字段不完整，但只要可自动汇总就不会阻塞：

```bash
python3 scripts/validate_course_jsons.py --strict
```

如果已经有按章节拆好的 JSON，可以自动汇总成前端可用的整门课 guide。课程材料按年级学期归档，目前大二下材料在 `大二下/`：

```bash
python3 scripts/course_guide_from_chapters.py 大二下/通信原理
python3 scripts/course_guide_from_chapters.py 大二下/离散数学合集
python3 scripts/course_guide_from_chapters.py 大二下/计算机原理
python3 scripts/course_guide_from_chapters.py 大二下/深度学习
```

4. 人工审核

重点看这些问题：

- 是否符合北邮老师实际讲课顺序
- 章节是否有遗漏或多写
- 知识点是不是课内需要掌握
- 考试重点、实验重点是否靠谱
- 推荐资料是否适合本科大二下同学

5. 写回系统

审核后可以把 JSON 内容合并到：

```text
frontend/src/data/buptCourses.ts
```

后续如果要做管理员后台上传，可以复用这里的 JSON schema 和 prompt。

## 小米 API 配置

脚本默认按 OpenAI-compatible Chat Completions 接口调用：

```text
POST {XIAOMI_API_BASE}/chat/completions
```

环境变量：

```bash
XIAOMI_API_KEY=你的 key
XIAOMI_API_BASE=https://token-plan-sgp.xiaomimimo.com/v1
XIAOMI_MODEL=你的模型名
```

不要把真实 key 提交到 Git。

## 文件说明

- `raw_materials/`：同学整理的原始文本材料
- `大二下/`：大二下课程的按章 JSON，目前包括离散数学、计算机原理、通信原理、深度学习
- `大三上/`：大三上课程的整课 guide JSON，目前按“课程名/course_guide.json”归档
- `outputs/`：AI 生成的 JSON 草稿
- `schemas/course_guide.schema.json`：输出格式约束
- `prompts/course_material_to_json.md`：AI 解析提示词
- `scripts/material_to_json.py`：调用模型并生成 JSON
- `scripts/batch_material_to_json.py`：批量调用模型，把多门课原始材料生成整课 JSON
- `scripts/validate_course_jsons.py`：递归校验整课 JSON、章节 JSON 和章节索引
- `scripts/course_guide_from_chapters.py`：把已生成的单章 JSON 自动汇总成整门课 guide

## 支持的课程 slug

- `bupt_discrete_math`
- `bupt_programming_practice`
- `bupt_computer_organization`
- `bupt_communication_principles`
- `bupt_deep_learning_pytorch`
