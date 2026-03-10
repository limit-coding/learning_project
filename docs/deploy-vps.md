## 在 Ubuntu VPS 上部署 AI 学习指导系统（单域名方案）

本文档假设：

- 系统：Ubuntu（20.04/22.04 均可）
- 访问方式：单域名（例如 `ai.example.com`），前端和后端共用一个域名
- 数据库：VPS 上用 Docker 跑 PostgreSQL
- 后端：FastAPI（uvicorn）直接跑在宿主机，用 systemd 管理
- 前端：React + Vite 构建静态文件，由 Nginx 提供

> 注意：所有 `ai.example.com`、目录路径、数据库账号等，请按你自己的实际情况替换。

---

## 1. VPS 基础环境准备

```bash
sudo apt update && sudo apt upgrade -y

# 常用工具
sudo apt install -y git curl vim htop ufw

# 开启防火墙（如果还没开）
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

确认云厂商安全组也放行 22、80、443 端口。

---

## 2. 安装 Docker 并运行 PostgreSQL

### 2.1 安装 Docker

官方安装方式（简化版）：

```bash
curl -fsSL https://get.docker.com | sudo bash

# 可选：允许当前用户使用 docker（执行后需要重新登录）
sudo usermod -aG docker "$USER"
```

### 2.2 准备 PostgreSQL 数据目录

```bash
sudo mkdir -p /srv/zhinan/postgres-data
sudo chown -R "$USER":"$USER" /srv/zhinan
```

### 2.3 通过 Docker 运行 PostgreSQL

这里给出一个只包含数据库的 `docker-compose` 示例，放在 `/srv/zhinan/deploy/docker-compose.postgres.yml`：

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:14
    container_name: zhinan-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: zhinan
      POSTGRES_USER: zhinan_user
      POSTGRES_PASSWORD: strong_password_change_me
    ports:
      - "5432:5432"
    volumes:
      - /srv/zhinan/postgres-data:/var/lib/postgresql/data
```

在服务器上执行：

```bash
cd /srv/zhinan/deploy
docker compose -f docker-compose.postgres.yml up -d
```

### 2.4 测试数据库

```bash
docker exec -it zhinan-postgres psql -U zhinan_user -d zhinan -c "\l"
```

如果能看到数据库列表，说明 PostgreSQL 正常运行。

---

## 3. 部署后端（FastAPI）

### 3.1 获取代码

```bash
sudo mkdir -p /srv/zhinan
sudo chown -R "$USER":"$USER" /srv/zhinan

cd /srv/zhinan
git clone <你的仓库地址> .
```

### 3.2 创建 Python 虚拟环境并安装依赖

```bash
sudo apt install -y python3-venv python3-pip

cd /srv/zhinan/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 配置后端环境变量（`.env`）

在 `/srv/zhinan/backend` 下创建 `.env` 文件（可以参考 `README.md`）：

```env
DATABASE_URL=postgresql://zhinan_user:strong_password_change_me@127.0.0.1:5432/zhinan

LLM_PROVIDER=deepseek
LLM_API_KEY=你的_deepseek_api_key
LLM_MODEL=deepseek-chat

DEEPSEEK_API_BASE=https://api.deepseek.com/v1

SECRET_KEY=请换成随机长字符串
DEBUG=False
```

> 提示：`config.py` 使用的是 `.env` 文件里的变量，字段名为小写/下划线时，环境变量可用大写/下划线形式映射；保持命名一致更清晰。

### 3.4 初始化数据库

```bash
cd /srv/zhinan/backend
source venv/bin/activate
python scripts/init_db.py
```

### 3.5 手工启动后端测试

```bash
cd /srv/zhinan/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

本地浏览器访问：`http://服务器IP:8000/docs`，能打开 Swagger 页面即表示后端正常。

---

## 4. 部署前端（React + Vite）

### 4.1 安装 Node.js（建议 nvm）

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# 重新打开终端或执行：
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 18
nvm use 18
```

### 4.2 构建前端

```bash
cd /srv/zhinan/frontend
npm install
npm run build
```

构建完成后，会生成 `/srv/zhinan/frontend/dist` 目录。

> 说明：前端代码中 `src/services/api.ts` 的 `baseURL` 已设置为 `'/api'`，在生产环境下会通过 Nginx 转发到后端 `http://127.0.0.1:8000/api`。

---

## 5. 配置 Nginx（单域名，前端+反向代理后端）

### 5.1 安装 Nginx

```bash
sudo apt install -y nginx
```

### 5.2 新建站点配置

示例文件（请按需修改域名和路径）：`/etc/nginx/sites-available/ai.example.com`：

```nginx
server {
    listen 80;
    server_name ai.example.com;

    root /srv/zhinan/frontend/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点并测试：

```bash
sudo ln -s /etc/nginx/sites-available/ai.example.com /etc/nginx/sites-enabled/ai.example.com
sudo nginx -t
sudo systemctl reload nginx
```

此时浏览器访问 `http://ai.example.com`，如果已经做了域名解析并生效，应能看到前端页面，并且表单提交后能正常调用后端 API。

---

## 6. 配置 HTTPS（Let’s Encrypt）

### 6.1 安装 Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 一键申请证书并自动配置

```bash
sudo certbot --nginx -d ai.example.com
```

根据提示选择「将 HTTP 自动重定向到 HTTPS」。

证书续期（一般已自动配置）：

```bash
sudo certbot renew --dry-run
```

之后访问 `https://ai.example.com`，浏览器应显示安全锁标志。

---

## 7. 使用 systemd 让后端常驻运行

### 7.1 创建 systemd 服务文件

创建文件 `/etc/systemd/system/zhinan-backend.service`：

```ini
[Unit]
Description=AI 学习指导系统后端 (FastAPI)
After=network.target docker.service
Wants=docker.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/zhinan/backend
Environment="PATH=/srv/zhinan/backend/venv/bin"
ExecStart=/srv/zhinan/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

> 提示：如果你希望使用自己的用户运行服务，可以把 `User`、`Group` 改为你的用户名，并保证该用户对 `/srv/zhinan` 拥有读写权限。

### 7.2 启动并设为开机自启

```bash
sudo systemctl daemon-reload
sudo systemctl enable zhinan-backend
sudo systemctl start zhinan-backend

sudo systemctl status zhinan-backend
```

查看日志：

```bash
sudo journalctl -u zhinan-backend -f
```

---

## 8. 备份与后续优化建议

- **数据库备份**：可以通过 `pg_dump` 定期备份，例如：

  ```bash
  docker exec zhinan-postgres pg_dump -U zhinan_user zhinan > /srv/zhinan/backups/zhinan_$(date +%F).sql
  ```

- **日志分析**：可以使用 `goaccess` 等工具分析 Nginx 访问日志。
- **CI/CD**：后续可以在仓库中加简单脚本（如 `deploy.sh`），在 VPS 上 `git pull` 后自动重启后端/重载 Nginx。

按照本文档从上到下执行，你就可以在 VPS 上用自己的域名 + HTTPS 稳定访问这个 AI 学习指导系统。

