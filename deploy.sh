#!/bin/bash

# 部署脚本 - 将应用部署到阿里云服务器
# 使用方法: ./deploy.sh [服务器IP] [SSH端口] [用户名]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -lt 1 ]; then
    print_error "用法: $0 <服务器IP> [SSH端口] [用户名]"
    echo "示例: $0 123.45.67.89 22 root"
    exit 1
fi

SERVER_IP=$1
SSH_PORT=${2:-22}
SSH_USER=${3:-root}
REMOTE_DIR="/opt/baogao_code"

print_info "===================================="
print_info "开始部署到阿里云服务器"
print_info "服务器: $SSH_USER@$SERVER_IP:$SSH_PORT"
print_info "远程目录: $REMOTE_DIR"
print_info "===================================="

# 测试 SSH 连接
print_info "测试 SSH 连接..."
if ! ssh -p $SSH_PORT -o ConnectTimeout=10 $SSH_USER@$SERVER_IP "echo '连接成功'"; then
    print_error "无法连接到服务器，请检查 IP、端口和 SSH 密钥配置"
    exit 1
fi

# 检查服务器是否已安装 Docker
print_info "检查 Docker 安装状态..."
if ! ssh -p $SSH_PORT $SSH_USER@$SERVER_IP "command -v docker > /dev/null 2>&1"; then
    print_warn "服务器未安装 Docker，开始安装..."
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << 'EOF'
        # 更新包索引
        apt-get update

        # 安装依赖
        apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

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

        echo "Docker 安装完成"
EOF
    print_info "Docker 安装完成"
else
    print_info "Docker 已安装"
fi

# 创建远程目录
print_info "创建远程目录..."
ssh -p $SSH_PORT $SSH_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# 同步代码到服务器（排除不必要的文件）
print_info "同步代码到服务器..."
rsync -avz --progress \
    -e "ssh -p $SSH_PORT" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude 'tmp_reports/*' \
    --exclude 'uploads/*' \
    --exclude '*.db' \
    --exclude 'png' \
    --exclude '*.副本.*' \
    --exclude 'test_*.docx' \
    --exclude 'test_*.pdf' \
    --exclude 'fix_*.py' \
    --exclude 'check_*.py' \
    --exclude 'debug_*.py' \
    --exclude 'update_*.py' \
    ./ $SSH_USER@$SERVER_IP:$REMOTE_DIR/

# 在服务器上构建并启动容器
print_info "在服务器上构建并启动 Docker 容器..."
ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << EOF
    cd $REMOTE_DIR

    # 停止并删除旧容器
    docker compose down 2>/dev/null || true

    # 构建镜像
    docker compose build

    # 启动容器
    docker compose up -d

    # 显示容器状态
    docker compose ps
EOF

# 获取服务器 IP 和端口
print_info "===================================="
print_info "部署完成！"
print_info "访问地址: http://$SERVER_IP"
print_info "后端 API: http://$SERVER_IP:8000"
print_info "===================================="
print_info "常用命令:"
print_info "  查看容器状态: ssh -p $SSH_PORT $SSH_USER@$SERVER_IP 'cd $REMOTE_DIR && docker compose ps'"
print_info "  查看日志: ssh -p $SSH_PORT $SSH_USER@$SERVER_IP 'cd $REMOTE_DIR && docker compose logs -f'"
print_info "  重启服务: ssh -p $SSH_PORT $SSH_USER@$SERVER_IP 'cd $REMOTE_DIR && docker compose restart'"
print_info "  停止服务: ssh -p $SSH_PORT $SSH_USER@$SERVER_IP 'cd $REMOTE_DIR && docker compose down'"
print_info "===================================="
