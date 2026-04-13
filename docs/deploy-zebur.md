## Zebur 部署检查清单

这个项目是一个前后端分离的 monorepo：

- 前端目录：`frontend`
- 后端目录：`backend`

如果直接把仓库根目录当成一个服务来部署，最容易出现构建失败或访问根路径 `404`。

### 推荐部署方式

在 Zebur 中拆成两个服务：

1. 一个前端静态站点
2. 一个后端 Python 服务

现在仓库里已经补好了更适合 Zeabur 的 Docker 部署文件：

- 前端：`frontend/Dockerfile`
- 前端路由：`frontend/Caddyfile`
- 后端：`backend/Dockerfile`

这样做的好处是，Zeabur 不需要再猜你的构建输出目录，直接按 Dockerfile 构建就行。

### 最省事的导入方式

在 Zeabur 从 GitHub 导入这个仓库后，分别创建两个服务：

1. 前端服务
2. 后端服务

然后这样设置：

- 前端服务 Root Directory：`frontend`
- 前端服务构建方式：优先使用仓库里的 `Dockerfile`
- 后端服务 Root Directory：`backend`
- 后端服务构建方式：优先使用仓库里的 `Dockerfile`

这样通常不需要再手动填写 `Install Command / Build Command / Output Directory`。

### 前端服务建议配置

- Root Directory：`frontend`
- 如果走 Dockerfile：无需额外填写构建命令
- 如果走普通静态构建：`npm install` + `npm run build`，输出目录 `dist`

前端 Dockerfile 会自动：

- 安装依赖
- 执行 `npm run build`
- 把 `dist` 拷贝到 Caddy 的 `/usr/share/caddy`

前端 Caddyfile 会自动做 SPA fallback：

- 找不到静态文件时回退到 `/index.html`

### 后端服务建议配置

- Root Directory：`backend`
- 如果走 Dockerfile：无需额外填写启动命令
- 如果手动填写：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`

还需要在环境变量里补齐：

- `DATABASE_URL`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL`
- `DEEPSEEK_API_BASE`
- `SECRET_KEY`
- `DEBUG=False`

### 前后端联通

开发环境里前端默认通过 Vite 代理把 `/api` 转发到本地 `8000` 端口，但部署到 Zebur 后通常不会自动继承这个代理规则。

因此前端现在支持通过环境变量指定后端地址：

- `VITE_API_BASE_URL=/api`

如果 Zebur 能把同域名下的 `/api` 转发到后端，可以继续用上面的默认值。

如果前端和后端是两个不同域名，请把它改成后端公网地址，例如：

- `VITE_API_BASE_URL=https://your-backend.zebur.app/api`

### 常见 404 原因

1. 仓库根目录选错了，平台没有进入 `frontend` 或 `backend`。
2. 前端没有跑构建，结果把源码目录直接丢给了 Caddy。
3. 实际部署的是后端服务地址，但拿它当网页首页访问。
4. 只部署了前端，没有配置 `/api` 代理，也没有设置 `VITE_API_BASE_URL`。
5. 后端没读到正确的 `PORT` 或数据库环境变量，服务没有正常启动。

### 额外提醒

后端当前 `cors_origins` 只包含本地开发地址。如果前后端分域部署，页面能打开后，请记得把 Zebur 前端域名加入后端 CORS 白名单，否则下一步会遇到跨域问题，而不是 404。
