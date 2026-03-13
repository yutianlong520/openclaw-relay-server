# OpenClaw Relay Server 🦞

> 中转服务器 - 让手机控制本地 OpenClaw

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellowgreen)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join-blue)](https://discord.gg/openclaw)

## ⭐ 特性

- ⚡ **高性能 WebSocket** - 支持万级并发连接
- 🔐 **安全的认证** - API Key + JWT 双重认证
- 📱 **跨平台支持** - 支持 App 和本地 Claw 插件连接
- 🔄 **断线重连** - 自动重连，消息不丢失
- 📊 **实时状态** - 设备在线状态实时监控
- 🗄️ **数据持久化** - PostgreSQL + Redis 存储
- 🐳 **Docker 支持** - 快速部署

## 📖 文档

- [后端接口文档](./文档/后端接口文档.md) - API 接口说明
- [后端部署指南](./文档/后端部署指南.md) - 部署步骤详解
- [前端使用手册](./文档/前端使用手册.md) - App 使用说明
- [用户手册](./文档/用户手册.md) - 完整使用指南

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yutianlong520/openclaw-relay-server.git
cd openclaw-relay-server

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
psql -U postgres -d openclaw -f src/database/migrations/001_init.sql

# 5. 启动服务
npm run dev
```

服务启动后，访问 http://localhost:8080/health 检查健康状态。

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d
```

## 📡 WebSocket 连接

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'auth_request',
    payload: {
      key: 'oc_your_api_key',
      deviceId: 'device-001',
      clientType: 'app',
      deviceInfo: {
        name: 'My Device',
        platform: 'iOS',
        version: '1.0.0'
      }
    },
    timestamp: Date.now()
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Received:', msg.type);
});
```

## 📁 项目结构

```
openclaw-relay-server/
├── src/
│   ├── index.ts              # 入口文件
│   ├── config/
│   │   └── index.ts          # 配置管理
│   ├── core/
│   │   ├── WebSocketServer.ts # WebSocket 服务器
│   │   ├── ConnectionManager.ts # 连接管理器
│   │   └── MessageRouter.ts   # 消息路由器
│   ├── services/
│   │   ├── AuthService.ts     # 认证服务
│   │   ├── UserService.ts     # 用户服务
│   │   ├── MessageService.ts  # 消息服务
│   │   └── DeviceService.ts   # 设备服务
│   ├── database/
│   │   ├── index.ts           # 数据库连接
│   │   ├── redis.ts           # Redis 连接
│   │   └── migrations/        # 迁移脚本
│   └── utils/
│       ├── logger.ts          # 日志工具
│       ├── crypto.ts          # 加密工具
│       └── validator.ts       # 验证工具
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── README.md
```

## 🔧 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.3
- **WebSocket**: ws
- **数据库**: PostgreSQL 14+
- **缓存**: Redis 6+
- **日志**: Winston

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系

- GitHub: [https://github.com/yutianlong520/openclaw-relay-server](https://github.com/yutianlong520/openclaw-relay-server)
- 问题反馈: [https://github.com/yutianlong520/openclaw-relay-server/issues](https://github.com/yutianlong520/openclaw-relay-server/issues)

---

Made with ❤️ by 牛三 (后端开发)
