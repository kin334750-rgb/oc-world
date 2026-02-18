# OC World | OC 世界

[English](#english) | [中文](#中文)

---

## 网站地址

**在线访问**: https://oc-world.onrender.com

---

## English

### Introduction

OC World (Original Character World) is a web application for creating, sharing, and interacting with original characters. Users can create their own characters (OCs), build worlds, and connect with other creators.

### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│    Render    │────▶│   Supabase   │
│  (Frontend)  │◀────│   (Node.js)  │◀────│  (Database)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **Frontend**: Static files (HTML/CSS/JS) served by Render
- **Backend**: Node.js + Express API server
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT, bcryptjs

### Features

- User registration and login
- Create and manage original characters (OCs)
- Create and explore worlds
- Comments and interactions
- Favorites and follows
- Direct messages
- Notifications system
- Real-time chat for authors

### Deployment

This project is deployed on **Render**. To deploy your own version:

1. **Create a Supabase project** at https://supabase.com
2. **Create tables** in Supabase (users, worlds, ocs, comments, favorites, follows, notifications, messages, dm_messages, friends, reports, user_settings)
3. **Deploy to Render**:
   - Connect your GitHub repository to Render
   - Set build command: `npm install`
   - Set start command: `node server.js`
   - Add environment variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_KEY`: Your Supabase service role key
     - `JWT_SECRET`: Your JWT secret
     - `ALLOWED_ORIGINS`: Your Render domain

### Local Development

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

Then open http://localhost:3000

### Environment Variables

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.onrender.com
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| POST | /api/auth/guest | Guest login |
| GET | /api/auth/me | Get current user |
| GET | /api/users | Get all users |
| GET | /api/ocs | Get all OCs |
| POST | /api/ocs | Create new OC |
| PATCH | /api/ocs | Update OC |
| DELETE | /api/ocs | Delete OC |
| GET | /api/worlds | Get all worlds |
| POST | /api/worlds | Create new world |
| GET | /api/comments | Get comments |
| POST | /api/comments | Add comment |
| POST | /api/favorites | Add to favorites |
| POST | /api/follows | Follow user |
| POST | /api/notifications | Create notification |
| POST | /api/messages | Send chat message |
| POST | /api/dm_messages | Send direct message |

---

## 中文

### 介绍

OC World（原创角色世界）是一个用于创建、分享和互动原创角色的 Web 应用程序。用户可以创建自己的角色（OC）、构建世界观，并与其他创作者互动。

### 架构

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    浏览器     │────▶│    Render    │────▶│   Supabase   │
│   (前端)      │◀────│  (Node.js)   │◀────│   (数据库)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

- **前端**: 静态文件 (HTML/CSS/JS)，由 Render 提供
- **后端**: Node.js + Express API 服务器
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT, bcryptjs

### 功能特点

- 用户注册和登录
- 创建和管理原创角色（OC）
- 创建和探索世界观
- 评论和互动
- 收藏和关注
- 私信功能
- 通知系统
- 作者实时聊天室

### 部署

本项目部署在 **Render** 上。如需部署自己的版本：

1. 在 https://supabase.com 创建 Supabase 项目
2. 在 Supabase 中创建数据表（users, worlds, ocs, comments, favorites, follows, notifications, messages, dm_messages, friends, reports, user_settings）
3. **部署到 Render**:
   - 将 GitHub 仓库连接到 Render
   - Build command: `npm install`
   - Start command: `node server.js`
   - 添加环境变量:
     - `SUPABASE_URL`: 你的 Supabase 项目 URL
     - `SUPABASE_KEY`: 你的 Supabase service role key
     - `JWT_SECRET`: 你的 JWT 密钥
     - `ALLOWED_ORIGINS`: 你的 Render 域名

### 本地开发

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

然后打开 http://localhost:3000

### 环境变量

```env
PORT=3000
SUPABASE_URL=你的_supabase_网址
SUPABASE_KEY=你的_supabase_service_key
JWT_SECRET=你的_jwt_密钥
ALLOWED_ORIGINS=http://localhost:3000,https://你的域名.onrender.com
```

### API 接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | /api/auth/register | 注册新用户 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/guest | 游客登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/users | 获取所有用户 |
| GET | /api/ocs | 获取所有 OC |
| POST | /api/ocs | 创建新 OC |
| PATCH | /api/ocs | 更新 OC |
| DELETE | /api/ocs | 删除 OC |
| GET | /api/worlds | 获取所有世界观 |
| POST | /api/worlds | 创建新世界观 |
| GET | /api/comments | 获取评论 |
| POST | /api/comments | 添加评论 |
| POST | /api/favorites | 添加收藏 |
| POST | /api/follows | 关注用户 |
| POST | /api/notifications | 创建通知 |
| POST | /api/messages | 发送聊天消息 |
| POST | /api/dm_messages | 发送私信 |

### 许可证

MIT License

---

<p align="center">Made with ❤️ by OC World Community</p>
