-- OC关联功能所需的数据库表

-- 1. OC关联申请表
CREATE TABLE IF NOT EXISTS oc_connections (
    id TEXT PRIMARY KEY,
    oc_id TEXT NOT NULL,
    target_oc_id TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 禁言池
CREATE TABLE IF NOT EXISTS ban_pool (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    reason TEXT,
    ban_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 论坛版块
CREATE TABLE IF NOT EXISTS forum_boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 论坛帖子
CREATE TABLE IF NOT EXISTS forum_posts (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT,
    title TEXT NOT NULL,
    content TEXT,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 论坛回帖
CREATE TABLE IF NOT EXISTS forum_replies (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 申诉表
CREATE TABLE IF NOT EXISTS appeals (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认论坛版块
INSERT INTO forum_boards (id, name, description) VALUES 
('board1', '综合讨论', '综合讨论区'),
('board2', 'OC展示', '分享你的原创角色'),
('board3', '世界观', '讨论世界观设定'),
('board4', '创作交流', '创作技巧和经验分享')
ON CONFLICT (id) DO NOTHING;
