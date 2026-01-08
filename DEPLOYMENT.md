# 阿里云服务器部署指南

本指南将帮助您将报告生成系统部署到阿里云 Ubuntu 服务器上。

## 部署架构

- **前端**: React + TypeScript + Vite + Ant Design（Nginx 静态托管）
- **后端**: FastAPI + SQLModel + SQLite（Python 服务）
- **容器化**: Docker + Docker Compose
- **文档处理**: LibreOffice（PDF 转换）

## 前置要求

### 本地环境
- 安装了 SSH 客户端
- 安装了 rsync（用于文件同步）
- 有服务器的 SSH 访问权限

### 服务器要求
- **操作系统**: Ubuntu 20.04/22.04
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间
- **端口**: 开放 80 和 8000 端口

## 快速部署（推荐）

### 1. 配置 SSH 密钥登录

如果您还没有配置 SSH 密钥登录，请先配置（推荐，更安全）：

```bash
# 在本地生成 SSH 密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 将公钥复制到服务器
ssh-copy-id -p 22 root@您的服务器IP
```

### 2. 修改前端 API 地址

在部署前，需要将前端 API 地址改为服务器 IP。

编辑 `frontend/src/ProjectDetail.tsx`，找到所有 API 请求，将：
```typescript
const response = await fetch('http://localhost:8000/api/...')
```
改为：
```typescript
const response = await fetch('http://您的服务器IP:8000/api/...')
```

或者更好的方式是使用环境变量：

创建 `frontend/.env.production` 文件：
```env
VITE_API_URL=http://您的服务器IP:8000
```

然后修改代码使用环境变量：
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const response = await fetch(`${API_URL}/api/...`)
```

### 3. 运行部署脚本

```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 执行部署（替换为您的实际信息）
./deploy.sh 您的服务器IP 22 root
```

脚本会自动：
1. 测试 SSH 连接
2. 检查并安装 Docker（如果需要）
3. 同步代码到服务器
4. 构建 Docker 镜像
5. 启动服务

### 4. 访问应用

部署完成后，通过浏览器访问：
- **前端**: http://您的服务器IP
- **后端 API**: http://您的服务器IP:8000

## 手动部署（进阶）

如果自动部署脚本无法使用，可以手动部署：

### 1. 登录服务器

```bash
ssh -p 22 root@您的服务器IP
```

### 2. 安装 Docker 和 Docker Compose

```bash
# 更新包索引
apt-get update

# 安装依赖
apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 3. 上传代码到服务器

在本地执行：

```bash
# 使用 rsync 同步代码
rsync -avz --progress \
    -e "ssh -p 22" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude 'tmp_reports/*' \
    --exclude 'uploads/*' \
    --exclude '*.db' \
    ./ root@您的服务器IP:/opt/baogao_code/
```

或使用 git：

```bash
# 在服务器上
cd /opt
git clone https://github.com/changrongjin2303/Report-generation.git baogao_code
cd baogao_code
```

### 4. 构建并启动服务

在服务器上执行：

```bash
cd /opt/baogao_code

# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f
```

## 常用管理命令

### 查看服务状态
```bash
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose ps'
```

### 查看日志
```bash
# 查看所有服务日志
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose logs -f'

# 只看后端日志
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose logs -f backend'

# 只看前端日志
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose logs -f frontend'
```

### 重启服务
```bash
# 重启所有服务
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose restart'

# 重启后端
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose restart backend'
```

### 停止服务
```bash
ssh root@您的服务器IP 'cd /opt/baogao_code && docker compose down'
```

### 更新代码
```bash
# 1. 同步最新代码
rsync -avz --progress \
    -e "ssh -p 22" \
    --exclude 'node_modules' \
    --exclude '.git' \
    ./ root@您的服务器IP:/opt/baogao_code/

# 2. 重新构建并重启
ssh root@您的服务器IP << 'EOF'
cd /opt/baogao_code
docker compose down
docker compose build
docker compose up -d
EOF
```

## 配置安全组规则

在阿里云控制台配置安全组，开放以下端口：

- **80**: HTTP 前端访问
- **8000**: 后端 API 访问
- **22**: SSH 管理（建议限制来源 IP）

## 数据持久化

以下数据会持久化保存在服务器上：

- **数据库**: `/opt/baogao_code/database.db`
- **上传文件**: `/opt/baogao_code/uploads/`
- **临时报告**: `/opt/baogao_code/tmp_reports/`

### 备份数据

```bash
# 在服务器上执行
cd /opt/baogao_code
tar -czf backup-$(date +%Y%m%d).tar.gz database.db uploads/

# 下载备份到本地
scp root@您的服务器IP:/opt/baogao_code/backup-*.tar.gz ./
```

### 恢复数据

```bash
# 上传备份文件到服务器
scp backup-20260108.tar.gz root@您的服务器IP:/opt/baogao_code/

# 在服务器上解压
ssh root@您的服务器IP << 'EOF'
cd /opt/baogao_code
docker compose down
tar -xzf backup-20260108.tar.gz
docker compose up -d
EOF
```

## 性能优化建议

1. **启用 Gzip 压缩**: Nginx 配置中已启用
2. **静态资源缓存**: Nginx 配置中已设置 1 年缓存
3. **数据库优化**: 如果数据量大，考虑迁移到 PostgreSQL
4. **日志轮转**: 配置 Docker 日志轮转防止磁盘占满

```bash
# 配置 Docker 日志轮转
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

## 故障排查

### 容器无法启动

```bash
# 查看详细错误信息
docker compose logs backend
docker compose logs frontend
```

### 端口被占用

```bash
# 检查端口占用
netstat -tuln | grep ':80\|:8000'

# 停止占用端口的进程
lsof -i :80
kill -9 <PID>
```

### 前端无法访问后端 API

1. 检查后端服务是否正常运行
2. 检查安全组是否开放 8000 端口
3. 检查前端代码中的 API 地址是否正确

### PDF 生成失败

LibreOffice 可能需要更多时间启动，可以增加超时时间：

编辑 `server.py` 第 417 行：
```python
process = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=60)  # 从 30 改为 60
```

## 升级到 HTTPS（可选）

如果您有域名，可以配置 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书（需要先将域名解析到服务器 IP）
certbot --nginx -d yourdomain.com

# 自动续期
certbot renew --dry-run
```

## 监控和日志

### 使用 Portainer 管理容器（可选）

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 \
  --name=portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

访问 http://您的服务器IP:9000 管理 Docker 容器。

## 联系支持

如果遇到问题，请检查：
1. 服务器日志: `docker compose logs`
2. 安全组配置
3. Docker 版本兼容性

---

部署完成后，建议定期备份数据并监控服务器资源使用情况。
