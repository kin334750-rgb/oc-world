# OC World | OC 世界

[English](#english) | [中文](#中文)

---

## English

### Introduction

OC World (Original Character World) is a web application for creating, sharing, and interacting with original characters. Users can create their own characters (OCs), build worlds, and connect with other creators.

### Tech Stack

- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT, bcryptjs
- **API**: RESTful

### Features

- User registration and login
- Create and manage original characters (OCs)
- Create and explore worlds
- Comments and interactions
- Favorites and follows
- Direct messages
- Notifications system

### Installation

```bash
# Clone the repository
git clone https://github.com/kin334750-rgb/oc-world.git

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the server
npm start
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/users/:id | Get user info |
| GET | /api/ocs | Get all OCs |
| POST | /api/ocs | Create new OC |
| GET | /api/worlds | Get all worlds |
| POST | /api/worlds | Create new world |
| GET | /api/comments/:ocId | Get comments for OC |
| POST | /api/comments | Add comment |

### License

MIT License

---

## 中文

### 介绍

OC World（原创角色世界）是一个用于创建、分享和互动原创角色的 Web 应用程序。用户可以创建自己的角色（OC）、构建世界观，并与其他创作者互动。

### 技术栈

- **后端**: Node.js, Express
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT, bcryptjs
- **API**: RESTful 接口

### 功能特点

- 用户注册和登录
- 创建和管理原创角色（OC）
- 创建和探索世界观
- 评论和互动
- 收藏和关注
- 私信功能
- 通知系统

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/kin334750-rgb/oc-world.git

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 Supabase 凭证

# 启动服务器
npm start
```

### 环境变量

创建 `.env` 文件：

```env
PORT=3000
SUPABASE_URL=你的_supabase_网址
SUPABASE_KEY=你的_supabase_密钥
JWT_SECRET=你的_jwt_密钥
ALLOWED_ORIGINS=http://localhost:3000,https://你的域名.com
```

### API 接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | /api/auth/register | 注册新用户 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/users/:id | 获取用户信息 |
| GET | /api/ocs | 获取所有 OC |
| POST | /api/ocs | 创建新 OC |
| GET | /api/worlds | 获取所有世界观 |
| POST | /api/worlds | 创建新世界观 |
| GET | /api/comments/:ocId | 获取 OC 的评论 |
| POST | /api/comments | 添加评论 |

### 许可证

MIT 许可证

---

<p align="center">Made with ❤️ by OC World Community</p>
