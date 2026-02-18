# OC World | OC 世界

[English](#english) | [中文](#中文)

---

## 网站地址

**在线访问**: https://kin334750-rgb.github.io/oc-world/

---

## English

### Introduction

OC World (Original Character World) is a web application for creating, sharing, and interacting with original characters. Users can create their own characters (OCs), build worlds, and connect with other creators.

### Architecture

```
┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Supabase   │
│  (GitHub     │◀────│  (Database   │
│   Pages)     │     │  + API)      │
└──────────────┘     └──────────────┘
```

- **Frontend**: Static files (HTML/CSS/JS) hosted on GitHub Pages
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST API (PostgREST)

### Features

- User registration and login
- Create and manage original characters (OCs)
- Create and explore worlds
- Comments and interactions
- Favorites and follows
- Direct messages
- Notifications system
- Real-time chat for authors

### Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST API (PostgREST)

### Local Development

```bash
# Clone the repository
git clone https://github.com/kin334750-rgb/oc-world.git

# Open index.html in your browser
# Or use a simple HTTP server:
npx serve .
```

Then open http://localhost:3000

### Deployment to GitHub Pages

1. Go to https://github.com/kin334750-rgb/oc-world
2. Go to **Settings** → **Pages**
3. Select **main** branch as Source
4. Click Save

Your site will be available at https://kin334750-rgb.github.io/oc-world/

---

## 中文

### 介绍

OC World（原创角色世界）是一个用于创建、分享和互动原创角色的 Web 应用程序。用户可以创建自己的角色（OC）、构建世界观，并与其他创作者互动。

### 架构

```
┌──────────────┐     ┌──────────────┐
│    浏览器     │────▶│   Supabase   │
│  (GitHub     │◀────│   (数据库    │
│   Pages)     │     │   + API)     │
└──────────────┘     └──────────────┘
```

- **前端**: 静态文件 (HTML/CSS/JS)，托管在 GitHub Pages
- **数据库**: Supabase (PostgreSQL)
- **API**: Supabase REST API (PostgREST)

### 功能特点

- 用户注册和登录
- 创建和管理原创角色（OC）
- 创建和探索世界观
- 评论和互动
- 收藏和关注
- 私信功能
- 通知系统
- 作者实时聊天室

### 技术栈

- **前端**: HTML, CSS, JavaScript
- **数据库**: Supabase (PostgreSQL)
- **API**: Supabase REST API (PostgREST)

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/kin334750-rgb/oc-world.git

# 在浏览器中打开 index.html
# 或使用简单的 HTTP 服务器：
npx serve .
```

然后打开 http://localhost:3000

### 部署到 GitHub Pages

1. 访问 https://github.com/kin334750-rgb/oc-world
2. 进入 **Settings** → **Pages**
3. 选择 **main** 分支作为 Source
4. 点击 Save

你的网站将在 https://kin334750-rgb.github.io/oc-world/ 可访问

### 许可证

MIT License

---

<p align="center">Made with ❤️ by OC World Community</p>
