## 部署记录：AI 学习指导系统上线到 `learnpath.tech`

> 这是一次完整的、真实发生的部署过程记录，用于复盘和以后复用。  
> 环境：Ubuntu（腾讯云 VPS），IP `85.121.122.124`，域名 `learnpath.tech`。

---

## 1. 初始状态与目标

- **项目状态**
  - 本地已开发完成，目录在 `/home/lvchenghao/ai-guide-system/learning_project`。
  - 后端：FastAPI + PostgreSQL，默认 `DATABASE_URL=postgresql://user:password@localhost:5432/zhinan`。
  - 前端：React + Vite，`axios` 的 `baseURL` 为 `'/api'`。
- **VPS 状态**
  - Ubuntu，已经安装了 Docker、Nginx（默认站点显示 Welcome 页面）。
  - 目标：将本项目部署到这台 VPS 上，通过域名 `learnpath.tech` + HTTPS 访问。

---

## 2. 数据库部分：复用已有 PostgreSQL 容器

### 2.1 发现已有容器

在 VPS 上查看 Docker 容器：

```bash
docker ps -a
```

结果中已经有：

- 容器名：`zhinan-postgres`
- 镜像：`postgres:14`
- 端口：`0.0.0.0:5432->5432/tcp`

说明 PostgreSQL 已经通过 Docker 跑起来，无需重复创建。

### 2.2 确认数据库账号密码

通过 `docker inspect` 查看环境变量：

```bash
docker inspect zhinan-postgres --format '{{ range .Config.Env }}{{ println . }}{{ end }}' | grep POSTGRES_
```

得到：

```text
POSTGRES_DB=zhinan
POSTGRES_USER=zhinan
POSTGRES_PASSWORD=zhinan_password
```

### 2.3 配置后端 `.env` 中的 `DATABASE_URL`

项目真正部署路径为：

```text
/home/lvchenghao/ai-guide-system/learning_project
```

在 `backend` 目录下创建/修改 `.env`：

```bash
cd /home/lvchenghao/ai-guide-system/learning_project/backend
cat > .env <<'EOF'
DATABASE_URL=postgresql://zhinan:zhinan_password@127.0.0.1:5432/zhinan

LLM_PROVIDER=deepseek
LLM_API_KEY=请在这里填入你的_deepseek_api_key
LLM_MODEL=deepseek-chat

DEEPSEEK_API_BASE=https://api.deepseek.com/v1

SECRET_KEY=请换成随机长字符串
DEBUG=False
EOF
```

> 注意：这里的用户名/密码必须与 PostgreSQL 容器的 `POSTGRES_USER` / `POSTGRES_PASSWORD` 完全一致，否则会出现 “password authentication failed for user …” 的错误。

---

## 3. 后端部署：虚拟环境、依赖与 systemd

### 3.1 创建 Python 虚拟环境并安装依赖

```bash
cd /home/lvchenghao/ai-guide-system/learning_project/backend
python3 -m venv venv

# VPS 默认 shell 是 fish，这里用 bash 运行更简单：
bash
cd /home/lvchenghao/ai-guide-system/learning_project/backend
source venv/bin/activate

pip install --upgrade pip
pip install setuptools wheel
```

#### 3.1.1 处理 `numpy` 与 Python 3.12 的兼容问题

原始 `requirements.txt` 中：

```text
numpy==1.24.3
```

在 Python 3.12 环境下构建失败，于是手动改为：

```text
numpy==1.26.4
```

然后重新安装依赖：

```bash
pip install -r requirements.txt
```

### 3.2 安装 PostgreSQL 驱动

运行初始化脚本时出现 `ModuleNotFoundError: No module named 'psycopg2'`，因此在虚拟环境中手动安装：

```bash
cd /home/lvchenghao/ai-guide-system/learning_project/backend
./venv/bin/python -m pip install psycopg2-binary
```

### 3.3 初始化数据库

```bash
cd /home/lvchenghao/ai-guide-system/learning_project/backend
./venv/bin/python scripts/init_db.py
```

输出（后一次）：

```text
开始初始化数据库...
数据库中已有 20 门课程，跳过初始化
数据库初始化完成！
```

说明表结构与课程种子数据已经就绪。

### 3.4 使用 systemd 守护 FastAPI

创建 systemd 单元文件：

```bash
cat >/etc/systemd/system/zhinan-backend.service <<'EOF'
[Unit]
Description=AI 学习指导系统后端 (FastAPI)
After=network.target docker.service
Wants=docker.service

[Service]
User=root
Group=root
WorkingDirectory=/home/lvchenghao/ai-guide-system/learning_project/backend
Environment="PATH=/home/lvchenghao/ai-guide-system/learning_project/backend/venv/bin"
ExecStart=/home/lvchenghao/ai-guide-system/learning_project/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

启动并设为开机自启：

```bash
systemctl daemon-reload
systemctl enable zhinan-backend
systemctl restart zhinan-backend
systemctl status zhinan-backend --no-pager -l
```

看到 `Active: active (running)` 即表示后端正常运行在 `:8000` 端口。

---

## 4. 前端部署：构建静态资源

### 4.1 安装 Node.js（nvm）

```bash
cd ~
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 18
nvm use 18
```

### 4.2 构建前端

```bash
cd /home/lvchenghao/ai-guide-system/learning_project/frontend
npm install
npm run build
```

构建完成后，静态文件在：

```text
/home/lvchenghao/ai-guide-system/learning_project/frontend/dist
```

> 前端使用 `axios.create({ baseURL: '/api' })`，生产环境下由 Nginx 反向代理到后端 API。

---

## 5. Nginx 配置：绑定 `learnpath.tech`

### 5.1 配置站点

创建 `/etc/nginx/sites-available/learnpath.tech`：

```nginx
server {
    listen 80;
    server_name learnpath.tech www.learnpath.tech;

    root /home/lvchenghao/ai-guide-system/learning_project/frontend/dist;
    index index.html;

    # 前端静态
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

关闭默认站点并启用新站点：

```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/learnpath.tech /etc/nginx/sites-enabled/learnpath.tech

nginx -t
systemctl reload nginx
```

在 VPS 内部测试：

```bash
curl -I http://learnpath.tech
```

返回 `HTTP/1.1 200 OK` 且 `Content-Length: 470`，说明已经是我们项目的前端页面（而不是 Nginx 欢迎页）。

---

## 6. 域名解析：腾讯云 DNS

在腾讯云控制台为 `learnpath.tech` 添加解析记录：

- **A 记录 1**
  - 主机记录：`@`
  - 类型：`A`
  - 记录值：`85.121.122.124`
- **A 记录 2（可选）**
  - 主机记录：`www`
  - 类型：`A`
  - 记录值：`85.121.122.124`

等待生效后，在本地电脑上验证：

```bash
ping learnpath.tech
nslookup learnpath.tech
curl -I http://learnpath.tech
```

当 `curl -I` 结果中 `Content-Length` 与 VPS 内部一致（约 470 字节），说明本地访问已经命中新的站点。

> 过程中曾出现“浏览器仍显示 Nginx 欢迎页”的情况，经验证是浏览器缓存问题；无痕模式访问即显示新页面。

---

## 7. HTTPS 配置：Let’s Encrypt + Certbot

在 VPS 上执行：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d learnpath.tech -d www.learnpath.tech
```

交互过程中：

1. 输入邮箱，用于证书到期提醒。
2. 同意服务条款。
3. 选择自动重定向 HTTP → HTTPS（推荐）。

成功后，本地访问：

```bash
curl -I https://learnpath.tech
```

浏览器访问 `https://learnpath.tech` 显示安全锁标志，整站启用 HTTPS。

---

## 8. 常用运维命令速查

### 8.1 后端服务相关

```bash
# 查看状态
systemctl status zhinan-backend

# 启动 / 停止 / 重启
systemctl start zhinan-backend
systemctl stop zhinan-backend
systemctl restart zhinan-backend

# 查看实时日志
journalctl -u zhinan-backend -f
```

### 8.2 PostgreSQL 容器相关

```bash
docker ps | grep zhinan-postgres

# 进入 psql
docker exec -it zhinan-postgres psql -U zhinan -d zhinan
```

### 8.3 简单备份

```bash
mkdir -p /srv/zhinan/backups
docker exec zhinan-postgres pg_dump -U zhinan zhinan > /srv/zhinan/backups/zhinan_$(date +%F).sql
```

---

## 9. 总结

最终效果：

- 后端：`uvicorn` 通过 systemd 以服务形式运行在 `:8000`。
- 数据库：PostgreSQL 通过 Docker 容器 `zhinan-postgres` 持久化到 `/srv/zhinan/postgres-data`。
- 前端：Vite 构建后的静态文件由 Nginx 提供。
- 域名：`learnpath.tech`（以及 `www.learnpath.tech`）解析到 `85.121.122.124`。
- HTTPS：通过 Let’s Encrypt 自动签发和续期。

访问入口：

- `https://learnpath.tech`

这份文档既可以作为你这次部署的复盘，也可以作为以后给其他项目“照抄改名”的模板。 

