# 章节 JSON 收件箱

把同学用网页版 AI 解析好的“单章节 JSON”放到这里。

这个目录只放已经人工看过一眼的 JSON 草稿，不放 PDF、截图、教材原文或 API key。

## 命名规则

推荐格式：

```text
课程slug__chapter-章节号__材料来源.json
```

示例：

```text
bupt_communication_principles__chapter-01__textbook.json
bupt_communication_principles__chapter-02__ppt.json
bupt_computer_organization__chapter-03__textbook.json
bupt_deep_learning_pytorch__chapter-01__pytorch-book.json
```

课程 slug：

- `bupt_discrete_math`
- `bupt_programming_practice`
- `bupt_computer_organization`
- `bupt_communication_principles`
- `bupt_deep_learning_pytorch`

材料来源建议：

- `textbook`：教材章节
- `ppt`：课程 PPT
- `reference`：参考书
- `teacher-notes`：老师重点或复习资料
- `lab`：实验文档

## 放入前检查

每个 JSON 至少应包含：

- `course`
- `chapter`
- `mindMap`
- `keyPoints`
- `chapterChecklist`
- `reviewNotes`
- `uncertainItems`

如果网页版 AI 输出了 Markdown 代码块，请先去掉外层 ```json 和 ```。

## 后续处理

我会从这里读取 JSON，做这些事：

1. 检查 JSON 是否能解析。
2. 按课程 slug 分组。
3. 合并同一门课的章节结构。
4. 提取课程级 route、chapters、mindMap。
5. 标出冲突、重复和需要人工确认的地方。
6. 写回 `frontend/src/data/buptCourses.ts`。

