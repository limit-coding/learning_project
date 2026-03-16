# 贡献与开发命令速查

> 用于团队日常开发协作。建议所有人统一从 `main` 拉取，再在各自分支开发。

## 1) 我的开发流程

### 拉取主分支

```bash
git pull origin main
```

### 创建并推送个人分支

```bash
git checkout -b master/core-logic
git add .
git commit -m "feat: 搭建了后端 API 核心框架"
git push origin master/core-logic
```

### 合并回主分支

```bash
git checkout main
git merge master/core-logic
git push origin main
```

### 环境异常时重置

```bash
git reset --hard HEAD
git checkout main
git fetch origin
git reset --hard origin/main
```

### 查验远端分支代码

```bash
git fetch origin
git checkout dev/ui-login
```

### 切回我的分支

```bash
git checkout master/core-logic
```

## 2) 队友开发流程

### 拉取主分支

```bash
git pull origin main
```

### 创建并推送队友分支

```bash
git checkout -b dev/ui-login
git add .
git commit -m "feat: 搭建了后端 API 核心框架"
git push origin dev/ui-login
```

---

## 命令提示

- `git checkout`：切换分支
- `git checkout -b <branch>`：创建并切换到新分支
- `git fetch origin`：拉取远端最新信息（不自动合并）





