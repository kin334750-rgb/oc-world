// OC世界 - Supabase 实时数据库版本
(function() {
    'use strict';
    
    const CONFIG = {
        PAGE_SIZE: 12,
        TAGS: ['魔法', '热血', '治愈', '腹黑', '温柔', '高冷', '傲娇', '软萌', '御姐', '正太', 'LOLI', '兽耳', '机械', '异世界', '校园', '奇幻', '科幻', '古风'],
        SUPABASE_URL: 'https://aygduhidyfkantqjzfec.supabase.co',
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2R1aGlkeWZrYW50cWp6ZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDgzMzcsImV4cCI6MjA4Njc4NDMzN30.nMEWXv6lnorwU2swGgkKMAAnljjQpiGW6BnGZ6tOBq8',
        CURRENT_USER_KEY: 'oc_current_user'
    };
    
    let currentUser = null, currentOC = null, currentPage = 1, totalPages = 1, currentMode = 'all';
    let dbData = { users: [], worlds: [], ocs: [], comments: [], favorites: [], follows: { following: [], followers: [] }, notifications: [] };
    
    function $(id) { return document.getElementById(id); }
    function $$(sel) { return document.querySelectorAll(sel); }
    function getItem(key) { try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; } }
    function setItem(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
    
    // Supabase API 调用
    async function supabaseFetch(table, query = '') {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}${query}`;
        const res = await fetch(url, {
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });
        return res.json();
    }
    
    async function supabaseInsert(table, data) {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        return res.json();
    }
    
    async function supabaseUpdate(table, data, eq) {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${eq}`, {
            method: 'PATCH',
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        return res.json();
    }
    
    async function supabaseDelete(table, eq) {
        await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${eq}`, {
            method: 'DELETE',
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY
            }
        });
    }
    
    // 加载所有数据
    async function loadAllData() {
        try {
            const [users, worlds, ocs, comments, favorites, follows, notifications] = await Promise.all([
                supabaseFetch('users'),
                supabaseFetch('worlds'),
                supabaseFetch('ocs', '?order=created_at.desc'),
                supabaseFetch('comments', '?order=created_at.desc'),
                supabaseFetch('favorites'),
                supabaseFetch('follows'),
                supabaseFetch('notifications', '?order=created_at.desc')
            ]);
            dbData = {
                users: users || [],
                worlds: worlds || [],
                ocs: ocs || [],
                comments: comments || [],
                favorites: favorites || [],
                follows: { following: (follows || []).map(f => f.follow_user_id), followers: (follows || []).map(f => f.user_id) },
                notifications: notifications || []
            };
            console.log('✓ Supabase 数据加载成功');
        } catch (e) {
            console.error('加载数据失败:', e);
            // 降级到本地存储
            initLocalData();
        }
    }
    
    function initLocalData() {
        console.log('使用本地存储模式');
        dbData.users = getItem('oc_users') || [];
        dbData.worlds = getItem('oc_worlds') || [];
        dbData.ocs = getItem('oc_ocs') || [];
        dbData.comments = getItem('oc_comments') || [];
        dbData.favorites = getItem('oc_favorites') || [];
        dbData.follows = getItem('oc_follows') || { following: [], followers: [] };
        dbData.notifications = getItem('oc_notifications') || [];
        
        if (!dbData.users.length) {
            dbData.users = [{id: 'u_demo', nickname: 'Demo', email: 'demo@ocworld.com', password: 'demo123', role: 'author', bio: '欢迎体验OC世界', avatar: '', created_at: new Date().toISOString()}];
            dbData.worlds = [{id: 'w1', name: '星辰帝国', description: '充满魔法的奇幻世界', cover: '', owner_id: 'u_demo', oc_count: 2, created_at: new Date().toISOString()}];
            dbData.ocs = [
                {id: 'oc1', name: '星灵', image: '', description: '来自星空的精灵族少女，性格温柔开朗，擅长星光魔法。', tags: '精灵,魔法,温柔', author_id: 'u_demo', author_name: 'Demo', world_id: 'w1', views: 156, likes: 23, created_at: new Date().toISOString()},
                {id: 'oc2', name: '暗影刺客', image: '', description: '神秘的暗影刺客，行踪诡秘。', tags: '刺客,暗影,腹黑', author_id: 'u_demo', author_name: 'Demo', world_id: 'w1', views: 89, likes: 15, created_at: new Date().toISOString()},
                {id: 'oc3', name: '炎之勇者', image: '', description: '使用火焰的勇者，性格热血冲动。', tags: '勇者,火焰,热血', author_id: 'u_demo', author_name: 'Demo', world_id: null, views: 234, likes: 45, created_at: new Date().toISOString()}
            ];
        }
    }
    
    function formatTime(dateStr) {
        if (!dateStr) return '';
        const diff = new Date() - new Date(dateStr);
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
        return Math.floor(diff/86400000) + '天前';
    }
    
    function escapeHtml(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = message;
        $('toast-container').appendChild(toast);
        setTimeout(() => { toast.style.animation = 'slideOut 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
    }
    
    function showConfirm(title, message, callback) {
        $('confirm-title').textContent = title;
        $('confirm-message').textContent = message;
        $('confirm-modal').classList.add('active');
        $('confirm-ok').onclick = () => { $('confirm-modal').classList.remove('active'); callback(true); };
        $('confirm-cancel').onclick = () => { $('confirm-modal').classList.remove('active'); callback(false); };
    }
    
    function showView(viewName) {
        $$('.view').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
        const view = $(viewName + '-view');
        if (view) { view.classList.add('active'); view.style.display = 'block'; }
        window.scrollTo(0, 0);
    }
    
    function applyTheme() {
        const settings = getItem('oc_settings') || { theme: 'light' };
        document.body.setAttribute('data-theme', settings.theme);
        if ($('theme-toggle')) $('theme-toggle').textContent = settings.theme === 'light' ? '🌙' : '☀️';
    }
    
    function getCurrentUser() { return getItem(CONFIG.CURRENT_USER_KEY); }
    
    async function doLogin() {
        const email = $('login-email').value.trim();
        const password = $('login-password').value;
        if (!email || !password) { showToast('请输入邮箱和密码', 'error'); return; }
        
        // 尝试 Supabase 登录
        const users = dbData.users;
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) { showToast('邮箱或密码错误', 'error'); return; }
        
        if ($('remember-me').checked) localStorage.setItem('remember_email', email);
        setItem(CONFIG.CURRENT_USER_KEY, user);
        currentUser = user;
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('欢迎回来，' + (user.nickname || user.email), 'success');
    }
    
    async function doRegister() {
        const nickname = $('reg-nickname').value.trim();
        const email = $('reg-email').value.trim();
        const password = $('reg-password').value;
        const password2 = $('reg-password2').value;
        const role = $$('input[name="reg-role"]:checked')?.value || 'visitor';
        
        if (!nickname || !email || !password) { showToast('请填写所有必填项', 'error'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('请输入有效邮箱', 'error'); return; }
        if (password.length < 6) { showToast('密码至少6位', 'error'); return; }
        if (password !== password2) { showToast('两次密码不一致', 'error'); return; }
        
        const users = dbData.users;
        if (users.find(u => u.email === email)) { showToast('该邮箱已被注册', 'error'); return; }
        
        const newUser = { 
            id: genId('u'), nickname, email, password, role, bio: '', avatar: '', 
            created_at: new Date().toISOString() 
        };
        
        try {
            await supabaseInsert('users', newUser);
        } catch(e) {}
        
        dbData.users.push(newUser);
        setItem(CONFIG.CURRENT_USER_KEY, newUser);
        currentUser = newUser;
        
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('注册成功！', 'success');
    }
    
    function doLogout() {
        localStorage.removeItem(CONFIG.CURRENT_USER_KEY);
        currentUser = null;
        showView('auth');
    }
    
    function updateUserInfo() {
        if (!currentUser) return;
        const roleText = currentUser.role === 'author' ? '作者' : '游客';
        const displayName = currentUser.nickname || currentUser.email.split('@')[0];
        $$('.user-avatar').forEach(el => { el.textContent = currentUser.avatar || '👤'; });
        if ($('dropdown-nickname')) $('dropdown-nickname').textContent = displayName;
        if ($('dropdown-role')) $('dropdown-role').textContent = roleText;
        if ($('create-oc-btn')) $('create-oc-btn').style.display = currentUser.role === 'author' ? 'block' : 'none';
        updateNotificationBadge();
    }
    
    async function addNotification(userId, text, type) {
        const notif = { id: genId('notif'), user_id: userId, text, type, read_status: 0, created_at: new Date().toISOString() };
        try {
            await supabaseInsert('notifications', notif);
        } catch(e) {}
        dbData.notifications.unshift(notif);
    }
    
    function getNotifications() { 
        return currentUser ? dbData.notifications.filter(n => n.user_id === currentUser.id) : []; 
    }
    
    function updateNotificationBadge() {
        const unread = getNotifications().filter(n => !n.read_status).length;
        if ($('notif-badge')) { $('notif-badge').textContent = unread; $('notif-badge').style.display = unread > 0 ? 'block' : 'none'; }
    }
    
    function renderNotifications() {
        const notifs = getNotifications();
        const container = $('notifications-list');
        container.innerHTML = notifs.length ? notifs.map(n => 
            `<div class="notification-item"><div class="notification-icon">${n.type==='评论'?'💬':n.type==='关注'?'👤':'📋'}</div><div class="notification-content"><div class="notification-text">${escapeHtml(n.text)}</div><div class="notification-time">${formatTime(n.created_at)}</div></div></div>`
        ).join('') : '<div class="empty-state"><span>🔔</span><p>暂无通知</p></div>';
        
        notifs.forEach(n => n.read_status = 1);
        updateNotificationBadge();
    }
    
    function addRecentlyViewed(ocId) {
        let recent = getItem('oc_recently_viewed') || [];
        recent = recent.filter(id => id !== ocId);
        recent.unshift(ocId);
        setItem('oc_recently_viewed', recent.slice(0, 20));
    }
    
    function renderPagination() {
        const container = $('pagination');
        if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
        let html = `<button class="pagination-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span>...</span>`;
            }
        }
        html += `<button class="pagination-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;
        container.innerHTML = html;
    }
    
    window.goPage = function(page) { if (page < 1 || page > totalPages) return; currentPage = page; renderOClist(); window.scrollTo(0, 0); };
    
    function renderOClist(filter) {
        let ocs = [...dbData.ocs];
        
        if (currentMode === 'trending') { ocs.sort((a, b) => (b.likes||0) - (a.likes||0)); }
        else if (currentMode === 'recent') { const recent = getItem('oc_recently_viewed') || []; ocs = recent.map(id => ocs.find(o => o.id === id)).filter(o => o); }
        else if (filter?.myOnly && currentUser) { ocs = ocs.filter(o => o.author_id === currentUser.id); }
        
        if (filter?.search) {
            const s = filter.search.toLowerCase();
            const type = $('search-type')?.value || 'all';
            ocs = ocs.filter(o => {
                const tags = o.tags ? o.tags.split(',') : [];
                if (type === 'name') return o.name.toLowerCase().includes(s);
                if (type === 'author') return o.author_name.toLowerCase().includes(s);
                if (type === 'tag') return tags.some(t => t.toLowerCase().includes(s));
                return o.name.toLowerCase().includes(s) || o.author_name.toLowerCase().includes(s) || tags.some(t => t.toLowerCase().includes(s));
            });
        }
        
        if (currentMode !== 'trending' && currentMode !== 'recent') {
            const sort = $('sort-by')?.value || 'latest';
            if (sort === 'latest') ocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            else if (sort === 'popular') ocs.sort((a, b) => (b.likes||0) - (a.likes||0));
            else if (sort === 'name') ocs.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        }
        
        totalPages = Math.ceil(ocs.length / CONFIG.PAGE_SIZE);
        if (currentPage > totalPages) currentPage = 1;
        const start = (currentPage - 1) * CONFIG.PAGE_SIZE;
        ocs = ocs.slice(start, start + CONFIG.PAGE_SIZE);
        
        const grid = $('oc-grid');
        const tagsList = o => o.tags ? o.tags.split(',').slice(0,3) : [];
        grid.innerHTML = ocs.length ? ocs.map(oc => 
            `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image ? '<img src="'+escapeHtml(oc.image)+'">' : '🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.author_name)}</p><div class="oc-card-tags">${tagsList(oc).map(t => '<span class="tag">'+t+'</span>').join('')}</div></div></div>`
        ).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>📦</span><p>暂无OC</p></div>';
        renderPagination();
    }
    
    function renderQuickTags() {
        const container = $('quick-tags');
        if (!container) return;
        container.innerHTML = CONFIG.TAGS.slice(0, 10).map(tag => `<span class="filter-tag" data-tag="${tag}">${tag}</span>`).join('');
    }
    
    async function showOCDetail(ocId) {
        currentOC = dbData.ocs.find(o => o.id === ocId);
        if (!currentOC) { showToast('未找到该OC', 'error'); return; }
        
        addRecentlyViewed(ocId);
        
        // 增加浏览量
        currentOC.views = (currentOC.views || 0) + 1;
        try {
            await supabaseUpdate('ocs', { views: currentOC.views }, `id=eq.${ocId}`);
        } catch(e) {}
        
        $('oc-image').innerHTML = currentOC.image ? '<img src="'+escapeHtml(currentOC.image)+'">' : '🎭';
        $('oc-name').textContent = currentOC.name;
        $('oc-author').textContent = currentOC.author_name;
        $('oc-description').textContent = currentOC.description || '暂无背景设定';
        $('oc-views').textContent = currentOC.views || 0;
        $('oc-likes').textContent = currentOC.likes || 0;
        
        const ocComments = dbData.comments.filter(c => c.oc_id === ocId);
        $('oc-comments').textContent = ocComments.length;
        $('comment-count').textContent = '(' + ocComments.length + ')';
        
        const tagsList = currentOC.tags ? currentOC.tags.split(',') : [];
        $('oc-tags').innerHTML = tagsList.map(t => '<span class="tag">'+t+'</span>').join('');
        
        const world = dbData.worlds.find(w => w.id === currentOC.world_id);
        $('oc-world-list').innerHTML = world ? '<span class="world-tag" onclick="showWorldDetail(\''+world.id+'\')">'+world.name+'</span>' : '<span style="color:#999">未加入世界观</span>';
        
        renderRelatedOCs();
        renderComments();
        
        $('author-name').textContent = currentOC.author_name;
        const authorOCs = dbData.ocs.filter(o => o.author_id === currentOC.author_id);
        $('author-oc-count').textContent = 'OC: ' + authorOCs.length;
        
        const author = dbData.users.find(u => u.id === currentOC.author_id);
        $('author-avatar').textContent = author?.avatar || '👤';
        
        if ($('add-related-btn')) $('add-related-btn').style.display = (currentUser && currentUser.role === 'author') ? 'inline-block' : 'none';
        if ($('edit-oc-btn')) $('edit-oc-btn').style.display = (currentUser && currentUser.id === currentOC.author_id) ? 'inline-block' : 'none';
        if ($('delete-oc-btn')) $('delete-oc-btn').style.display = (currentUser && currentUser.id === currentOC.author_id) ? 'inline-block' : 'none';
        
        updateFavoriteBtn();
        updateFollowBtn();
        
        showView('detail');
    }
    
    function renderRelatedOCs() {
        // 简化版本，暂不实现关联功能
        const container = $('related-ocs');
        container.innerHTML = '<p style="color:#999">暂无关联</p>';
    }
    
    function renderComments() {
        const container = $('comments-list');
        const ocComments = dbData.comments.filter(c => c.oc_id === currentOC.id);
        container.innerHTML = ocComments.length ? ocComments.map(c => 
            `<div class="comment-item"><div class="comment-header"><span class="comment-author">${escapeHtml(c.author_name)}</span><span class="comment-time">${formatTime(c.created_at)}</span></div><div class="comment-content">${escapeHtml(c.content)}</div></div>`
        ).join('') : '<p style="text-align:center;color:#999">暂无评论</p>';
    }
    
    async function toggleFavorite() {
        if (!currentUser || !currentOC) return;
        
        const idx = dbData.favorites.findIndex(f => f.user_id === currentUser.id && f.oc_id === currentOC.id);
        
        if (idx >= 0) {
            const fav = dbData.favorites[idx];
            try { await supabaseDelete('favorites', `id=eq.${fav.id}`); } catch(e) {}
            dbData.favorites.splice(idx, 1);
            showToast('已取消', 'info');
        } else {
            const newFav = { id: genId('fav'), user_id: currentUser.id, oc_id: currentOC.id, created_at: new Date().toISOString() };
            try { await supabaseInsert('favorites', newFav); } catch(e) {}
            dbData.favorites.push(newFav);
            showToast('已收藏', 'success');
        }
        updateFavoriteBtn();
    }
    
    function updateFavoriteBtn() {
        if (!currentUser || !currentOC || !$('favorite-btn')) return;
        const isFav = dbData.favorites.some(f => f.user_id === currentUser.id && f.oc_id === currentOC.id);
        $('favorite-btn').textContent = isFav ? '💔' : '❤️';
    }
    
    function renderFavorites() {
        const myFavs = dbData.favorites.filter(f => f.user_id === currentUser.id).map(f => dbData.ocs.find(o => o.id === f.oc_id)).filter(o => o);
        const grid = $('favorites-grid');
        const tagsList = o => o.tags ? o.tags.split(',').slice(0,3) : [];
        grid.innerHTML = myFavs.length ? myFavs.map(oc => 
            `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.author_name)}</p><div class="oc-card-tags">${tagsList(oc).map(t=>'<span class="tag">'+t+'</span>').join('')}</div></div></div>`
        ).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>❤️</span><p>暂无收藏</p></div>';
    }
    
    async function toggleFollow() {
        if (!currentUser || !currentOC) return;
        if (currentUser.id === currentOC.author_id) { showToast('不能关注自己', 'warning'); return; }
        
        const follows = dbData.follows;
        const idx = follows.following.indexOf(currentOC.author_id);
        
        if (idx >= 0) {
            follows.following.splice(idx, 1);
            follows.followers = follows.followers.filter(f => f !== currentUser.id);
            try { await supabaseDelete('follows', `user_id=eq.${currentUser.id}&follow_user_id=eq.${currentOC.author_id}`); } catch(e) {}
            showToast('已取消', 'info');
        } else {
            follows.following.push(currentOC.author_id);
            follows.followers.push(currentUser.id);
            const newFollow = { id: genId('flw'), user_id: currentUser.id, follow_user_id: currentOC.author_id, created_at: new Date().toISOString() };
            try { await supabaseInsert('follows', newFollow); } catch(e) {}
            showToast('已关注', 'success');
            addNotification(currentOC.author_id, currentUser.nickname + ' 关注了你', '关注');
        }
        updateFollowBtn();
    }
    
    function updateFollowBtn() {
        if (!currentUser || !currentOC || !$('follow-author')) return;
        const isFollowing = dbData.follows.following.includes(currentOC.author_id);
        $('follow-author').textContent = isFollowing ? '✓ 已关注' : '+ 关注';
    }
    
    async function deleteOC() {
        if (!currentUser || !currentOC || currentUser.id !== currentOC.author_id) return;
        
        showConfirm('删除OC', '确定删除？', async confirmed => {
            if (confirmed) {
                try { await supabaseDelete('ocs', `id=eq.${currentOC.id}`); } catch(e) {}
                dbData.ocs = dbData.ocs.filter(o => o.id !== currentOC.id);
                dbData.comments = dbData.comments.filter(c => c.oc_id !== currentOC.id);
                showToast('已删除', 'success');
                renderOClist();
                showView('hall');
            }
        });
    }
    
    async function submitComment() {
        const content = $('comment-input').value.trim();
        if (!content) { showToast('请输入内容', 'error'); return; }
        if (!currentUser) { showToast('请先登录', 'error'); return; }
        
        const newComment = { 
            id: genId('c'), oc_id: currentOC.id, author_id: currentUser.id, 
            author_name: currentUser.nickname || currentUser.email.split('@')[0], 
            content, created_at: new Date().toISOString() 
        };
        
        try {
            await supabaseInsert('comments', newComment);
        } catch(e) {}
        
        dbData.comments.push(newComment);
        $('comment-input').value = '';
        renderComments();
        showOCDetail(currentOC.id);
        
        if (currentUser.id !== currentOC.author_id) {
            addNotification(currentOC.author_id, currentUser.nickname + ' 评论了你的OC', '评论');
        }
        showToast('评论成功', 'success');
    }
    
    function openCreateOC() {
        if (!currentUser || currentUser.role !== 'author') { showToast('只有作者才能创建', 'error'); return; }
        
        $('oc-world-select').innerHTML = '<option value="">无</option>' + 
            dbData.worlds.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
        
        $('modal-title').textContent = '创建OC';
        $('oc-form').reset();
        $('oc-modal').classList.add('active');
    }
    
    async function saveOC(e) {
        e.preventDefault();
        const name = $('oc-name-input').value.trim();
        const image = $('oc-image-input').value.trim();
        const desc = $('oc-desc-input').value.trim();
        const tagsStr = $('oc-tags-input').value.trim();
        const worldId = $('oc-world-select').value;
        
        if (!name) { showToast('请输入名称', 'error'); return; }
        
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t).join(',') : '';
        
        const newOC = { 
            id: genId('oc'), name, image, description: desc, tags, 
            author_id: currentUser.id, author_name: currentUser.nickname || currentUser.email.split('@')[0], 
            world_id: worldId || null, views: 0, likes: 0, created_at: new Date().toISOString() 
        };
        
        try {
            await supabaseInsert('ocs', newOC);
        } catch(e) {}
        
        dbData.ocs.push(newOC);
        
        if (worldId) {
            const world = dbData.worlds.find(w => w.id === worldId);
            if (world) {
                world.oc_count = (world.oc_count || 0) + 1;
                try { await supabaseUpdate('worlds', { oc_count: world.oc_count }, `id=eq.${worldId}`); } catch(e) {}
            }
        }
        
        closeOCModal();
        renderOClist();
        showView('hall');
        showToast('创建成功！', 'success');
    }
    
    function closeOCModal() { $('oc-modal').classList.remove('active'); }
    
    function renderWorlds() {
        const worlds = dbData.worlds;
        const grid = $('world-grid');
        grid.innerHTML = worlds.length ? worlds.map(w => 
            `<div class="world-card" data-id="${w.id}"><div class="world-card-cover">${w.cover?'<img src="'+escapeHtml(w.cover)+'">':'🌍'}</div><div class="world-card-body"><h3 class="world-card-name">${escapeHtml(w.name)}</h3><p class="world-card-desc">${escapeHtml(w.description||'')}</p></div></div>`
        ).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>🌍</span><p>暂无世界观</p></div>';
    }
    
    window.showWorldDetail = function(worldId) {
        const worldOCs = dbData.ocs.filter(o => o.world_id === worldId);
        const grid = $('oc-grid');
        const tagsList = o => o.tags ? o.tags.split(',').slice(0,3) : [];
        grid.innerHTML = worldOCs.length ? worldOCs.map(oc => 
            `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.author_name)}</p></div></div>`
        ).join('') : '<div class="empty-state"><span>📦</span><p>暂无OC</p></div>';
        showView('hall');
    };
    
    function openWorldModal() { $('world-form').reset(); $('world-modal').classList.add('active'); }
    function closeWorldModal() { $('world-modal').classList.remove('active'); }
    
    async function saveWorld(e) {
        e.preventDefault();
        const name = $('world-name-input').value.trim();
        const desc = $('world-desc-input').value.trim();
        
        if (!name) { showToast('请输入名称', 'error'); return; }
        
        const newWorld = { 
            id: genId('w'), name, description: desc, owner_id: currentUser.id, 
            oc_count: 0, created_at: new Date().toISOString() 
        };
        
        try {
            await supabaseInsert('worlds', newWorld);
        } catch(e) {}
        
        dbData.worlds.push(newWorld);
        closeWorldModal();
        renderWorlds();
        showToast('创建成功！', 'success');
    }
    
    function openRelatedModal() { $('related-modal').classList.add('active'); }
    function closeRelatedModal() { $('related-modal').classList.remove('active'); }
    function submitRelatedRequest() {
        showToast('关联功能开发中', 'info');
        closeRelatedModal();
    }
    
    function openRequestsModal() { showToast('申请功能开发中', 'info'); }
    function closeRequestsModal() { $('requests-modal').classList.remove('active'); }
    function renderRequests(tab) {}
    
    function showProfile() {
        if (!currentUser) return;
        $('profile-nickname').textContent = currentUser.nickname || currentUser.email.split('@')[0];
        $('profile-email').textContent = currentUser.email;
        $('profile-role').textContent = currentUser.role === 'author' ? '作者' : '游客';
        $('profile-avatar').textContent = currentUser.avatar || '👤';
        $('profile-oc-count').textContent = dbData.ocs.filter(o => o.author_id === currentUser.id).length;
        $('profile-fans').textContent = dbData.follows.followers.filter(f => f === currentUser.id).length;
        $('edit-nickname').value = currentUser.nickname || '';
        $('edit-bio').value = currentUser.bio || '';
        showView('profile');
    }
    
    async function saveProfile() {
        const nickname = $('edit-nickname').value.trim();
        const bio = $('edit-bio').value.trim();
        
        const idx = dbData.users.findIndex(u => u.id === currentUser.id);
        if (idx >= 0) {
            dbData.users[idx] = {...dbData.users[idx], nickname, bio};
            currentUser = dbData.users[idx];
            
            try {
                await supabaseUpdate('users', { nickname, bio }, `id=eq.${currentUser.id}`);
            } catch(e) {}
            
            setItem(CONFIG.CURRENT_USER_KEY, currentUser);
            updateUserInfo();
            showToast('保存成功', 'success');
        }
    }
    
    function openShareModal() { $('share-link').value = window.location.href.split('?')[0] + '?oc=' + currentOC.id; $('share-modal').classList.add('active'); }
    function copyShareLink() { $('share-link').select(); document.execCommand('copy'); showToast('已复制', 'success'); }
    
    function changeTheme(theme) { 
        const settings = getItem('oc_settings') || {}; 
        settings.theme = theme; 
        setItem('oc_settings', settings); 
        applyTheme(); 
    }
    
    function clearAllData() { 
        showConfirm('清空数据', '确定清空？不可恢复！', confirmed => { 
            if (confirmed) { 
                ['oc_users','oc_ocs','oc_comments','oc_worlds','oc_favorites','oc_follows','oc_notifications'].forEach(k => localStorage.removeItem(k)); 
                location.reload(); 
            } 
        }); 
    }
    
    function bindEvents() {
        $('theme-toggle')?.addEventListener('click', () => { 
            const s = getItem('oc_settings') || {theme:'light'}; 
            changeTheme(s.theme === 'light' ? 'dark' : 'light'); 
        });
        $('login-btn').addEventListener('click', doLogin);
        $('register-btn').addEventListener('click', doRegister);
        $('show-register').addEventListener('click', e => { e.preventDefault(); $('login-form').classList.remove('active'); $('register-form').classList.add('active'); });
        $('show-login').addEventListener('click', e => { e.preventDefault(); $('register-form').classList.remove('active'); $('login-form').classList.add('active'); });
        if (localStorage.getItem('remember_email')) { $('login-email').value = localStorage.getItem('remember_email'); $('remember-me').checked = true; }
        
        $$('[data-action="logout"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); doLogout(); }));
        
        $$('.nav-item').forEach(el => { 
            el.addEventListener('click', e => { 
                e.preventDefault(); 
                $$('.nav-item').forEach(i => i.classList.remove('active')); 
                el.classList.add('active'); 
                currentPage = 1; 
                const page = el.dataset.page; 
                if (page === 'hall') { currentMode = 'all'; renderOClist(); showView('hall'); } 
                else if (page === 'trending') { currentMode = 'trending'; renderOClist(); showView('hall'); } 
                else if (page === 'world') { renderWorlds(); showView('world'); } 
            }); 
        });
        
        $('search-btn').addEventListener('click', () => { currentPage = 1; currentMode = 'all'; renderOClist({ search: $('search-input').value.trim() }); });
        $('search-input').addEventListener('keypress', e => { if (e.key === 'Enter') { currentPage = 1; currentMode = 'all'; renderOClist({ search: this.value.trim() }); } });
        $('sort-by').addEventListener('change', () => { currentPage = 1; renderOClist(); });
        $('filter-my-ocs').addEventListener('change', e => { currentPage = 1; renderOClist({ myOnly: e.target.checked }); });
        $('quick-tags').addEventListener('click', e => { if (e.target.classList.contains('filter-tag')) { $('search-input').value = e.target.dataset.tag; currentPage = 1; currentMode = 'all'; renderOClist({ search: e.target.dataset.tag }); } });
        
        $$('[data-action="profile"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showProfile(); }));
        $$('[data-action="my-ocs"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); currentPage = 1; renderOClist({ myOnly: true }); showView('hall'); }));
        $$('[data-action="favorites"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); renderFavorites(); showView('favorites'); }));
        $$('[data-action="settings"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showView('settings'); }));
        
        $('notification-bell').addEventListener('click', () => { renderNotifications(); showView('notifications'); });
        $('create-oc-btn').addEventListener('click', openCreateOC);
        $('cancel-oc-btn').addEventListener('click', closeOCModal);
        $('oc-form').addEventListener('submit', saveOC);
        
        $('create-world-btn').addEventListener('click', openWorldModal);
        $('create-world-modal-btn')?.addEventListener('click', openWorldModal);
        $('cancel-world-btn').addEventListener('click', closeWorldModal);
        $('world-form').addEventListener('submit', saveWorld);
        
        $('back-from-world').addEventListener('click', () => { currentMode = 'all'; renderOClist(); showView('hall'); });
        $('back-to-hall').addEventListener('click', () => { currentMode = 'all'; renderOClist(); showView('hall'); });
        $('back-from-profile').addEventListener('click', () => showView('hall'));
        $('back-from-notifs').addEventListener('click', () => showView('hall'));
        $('back-from-favorites').addEventListener('click', () => showView('hall'));
        $('back-from-settings').addEventListener('click', () => showView('hall'));
        
        $('submit-comment').addEventListener('click', submitComment);
        $('favorite-btn').addEventListener('click', toggleFavorite);
        $('share-btn').addEventListener('click', openShareModal);
        $('copy-link-btn').addEventListener('click', copyShareLink);
        $('delete-oc-btn')?.addEventListener('click', deleteOC);
        $('follow-author').addEventListener('click', toggleFollow);
        
        $('add-related-btn').addEventListener('click', openRelatedModal);
        $('cancel-related-btn').addEventListener('click', closeRelatedModal);
        $('submit-related-btn').addEventListener('click', submitRelatedRequest);
        $('my-requests-btn').addEventListener('click', openRequestsModal);
        
        $('save-profile-btn').addEventListener('click', saveProfile);
        $$('input[name="theme"]').forEach(radio => radio.addEventListener('change', function() { changeTheme(this.value); }));
        $('clear-data-btn').addEventListener('click', clearAllData);
        
        $('confirm-cancel').addEventListener('click', () => $('confirm-modal').classList.remove('active'));
        $$('.modal').forEach(modal => { modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); }); });
        $('login-password').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
        
        $('oc-grid').addEventListener('click', e => { const card = e.target.closest('.oc-card'); if (card) showOCDetail(card.dataset.id); });
        $('world-grid')?.addEventListener('click', e => { const card = e.target.closest('.world-card'); if (card) window.showWorldDetail(card.dataset.id); });
        document.addEventListener('click', e => { if (e.target.classList.contains('related-oc')) showOCDetail(e.target.dataset.id); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.active').forEach(m => m.classList.remove('active')); });
    }
    
    async function init() {
        await loadAllData();
        currentUser = getCurrentUser();
        const urlParams = new URLSearchParams(window.location.search);
        const ocId = urlParams.get('oc');
        if (ocId) { if (currentUser) showOCDetail(ocId); else showView('auth'); }
        else if (currentUser) { applyTheme(); updateUserInfo(); renderOClist(); renderQuickTags(); showView('hall'); }
        else { showView('auth'); }
        bindEvents();
    }
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
