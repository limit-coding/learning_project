# GitHub + SSH 部署流程

适合当前项目的最小 VPS 部署方式：

- 前端：`frontend/dist` 静态文件，由 Nginx 提供
- 后端：FastAPI + systemd，监听 `127.0.0.1:8000`
- API：Nginx 把 `/api/` 反代到后端
- 数据库：默认可先用 SQLite，验收演示够用；需要多人长期使用再切 PostgreSQL

## 1. 本地提交并推送

```bash
git status
git add .
git commit -m "prepare course guide deployment"
git push origin main
```

## 2. VPS 首次准备

```bash
sudo apt update
sudo apt install -y git nginx python3-venv python3-pip nodejs npm
sudo mkdir -p /srv
sudo chown -R "$USER":"$USER" /srv
cd /srv
git clone https://github.com/limit-coding/learning_project.git zhinan
cd /srv/zhinan
```

如果系统自带 Node 太旧，建议安装 Node 18+。

## 3. 配置后端环境

```bash
cd /srv/zhinan/backend
cp .env.example .env
vim .env
```

验收演示可以先用：

```env
DATABASE_URL=sqlite:///./zhinan.db
DEBUG=False
SECRET_KEY=换成一串随机字符串
```

如果要启用 LLM，再补：

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=你的_key
LLM_MODEL=deepseek-chat
```

## 4. 安装 systemd 服务

```bash
sudo cp /srv/zhinan/deploy/zhinan-backend.service.example /etc/systemd/system/zhinan-backend.service
sudo sed -i "s/YOUR_USER/$USER/g" /etc/systemd/system/zhinan-backend.service
sudo systemctl daemon-reload
sudo systemctl enable zhinan-backend
```

## 5. 配置 Nginx

```bash
sudo cp /srv/zhinan/deploy/nginx.conf.example /etc/nginx/sites-available/zhinan
sudo sed -i "s/YOUR_DOMAIN_OR_IP/你的域名或服务器IP/g" /etc/nginx/sites-available/zhinan
sudo ln -sf /etc/nginx/sites-available/zhinan /etc/nginx/sites-enabled/zhinan
sudo nginx -t
sudo systemctl reload nginx
```

## 6. 一键部署/更新

首次和后续更新都可以在 VPS 上运行：

```bash
cd /srv/zhinan
bash scripts/deploy_vps.sh
```

后续本地更新流程：

```bash
git add .
git commit -m "update courses"
git push origin main
ssh 用户名@服务器IP "cd /srv/zhinan && bash scripts/deploy_vps.sh"
```

## 7. 常用排错

```bash
sudo systemctl status zhinan-backend
sudo journalctl -u zhinan-backend -f
sudo nginx -t
curl http://127.0.0.1:8000/docs
```

浏览器访问：

```text
http://你的域名或服务器IP
```
