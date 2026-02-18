// OC世界 v3.0 - Supabase 直连版
(function() {
    'use strict';
    
    // Supabase 配置
    const SUPABASE_URL = 'https://aygduhidyfkantqjzfec.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Z2R1aGlkeWZrYW50cWp6ZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDgzMzcsImV4cCI6MjA4Njc4NDMzN30.nMEWXv6lnorwU2swGgkKMAAnljjQpiGW6BnGZ6tOBq8';
    
    const CONFIG = {
        PAGE_SIZE: 12,
        TAGS: ['魔法', '热血', '治愈', '腹黑', '温柔', '高冷', '傲娇', '软萌', '御姐', '正太', 'LOLI', '兽耳', '机械', '异世界', '校园', '奇幻', '科幻', '古风'],
        EMOJIS: ['😀','😎','😍','🤔','😢','😡','😭','🥰','🤯','😇','👻','👽','🤖','💀','🎭','🔥','✨','💫','🌟','⭐️','❤️','💔','👍','👎','🙏','💪','🎉','🎊','🏆','🎯','💡'],
        SECURITY_QUESTIONS: ['我最好的朋友是谁？', '我最喜欢的颜色是什么？', '我的第一只宠物叫什么？', '我出生在哪个城市？', '我最喜欢的食物是什么？', '我最喜欢的动漫角色是谁？'],
        CURRENT_USER_KEY: 'oc_current_user',
        TOKEN_KEY: 'oc_auth_token'
    };
    
    let currentUser = null, currentOC = null, currentChatFriend = null, currentViewingUser = null, currentPage = 1, totalPages = 1, currentMode = 'all';
    let dbData = { users: [], worlds: [], ocs: [], comments: [], favorites: [], follows: { following: [], followers: [] }, notifications: [], messages: [], dmMessages: [], friends: [], reports: [], user_settings: {} };
    
    function $(id) { return document.getElementById(id); }
    function $$(sel) { return document.querySelectorAll(sel); }
    function getItem(key) { try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; } }
    function setItem(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
    
    // Supabase REST API 调用
    async function supabaseFetch(table, query = '') {
        const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
        const res = await fetch(url, { 
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}` 
            } 
        });
        return res.json();
    }
    
    async function supabaseInsert(table, data) {
        const url = `${SUPABASE_URL}/rest/v1/${table}`;
        const res = await fetch(url, { 
            method: 'POST', 
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }, 
            body: JSON.stringify(data) 
        });
        return res.json();
    }
    
    async function supabaseUpdate(table, data, eq) {
        const url = `${SUPABASE_URL}/rest/v1/${table}?${eq}`;
        const res = await fetch(url, { 
            method: 'PATCH', 
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(data) 
        });
        return res.json();
    }
    
    async function supabaseDelete(table, eq) {
        const url = `${SUPABASE_URL}/rest/v1/${table}?${eq}`;
        const res = await fetch(url, { 
            method: 'DELETE', 
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}` 
            } 
        });
        return res.json();
    }
    
    async function loadAllData() {
        try {
            const [users, worlds, ocs, comments] = await Promise.all([
                supabaseFetch('users'), supabaseFetch('worlds'), supabaseFetch('ocs', '?order=created_at.desc'), supabaseFetch('comments', '?order=created_at.desc')
            ]);
            
            let favorites = [], follows = [], notifications = [], messages = [], dmMessages = [], friends = [], reports = [], settings = [];
            
            if (currentUser && currentUser.role !== 'guest') {
                try {
                    [favorites, follows, notifications, messages, dmMessages, friends, reports, settings] = await Promise.all([
                        supabaseFetch('favorites'), supabaseFetch('follows'), supabaseFetch('notifications', '?order=created_at.desc'),                         supabaseFetch('messages', '?order=created_at.asc&limit=100'), supabaseFetch('dm_messages', '?order=created_at.asc&limit=100'), supabaseFetch('friends'), supabaseFetch('reports'), supabaseFetch('user_settings')
                    ]);
                } catch (e) { console.log('需要登录获取更多数据'); }
            }
            
            const settingsMap = {}; (settings || []).forEach(s => settingsMap[s.user_id] = s);
            dbData = { users: users || [], worlds: worlds || [], ocs: ocs || [], comments: comments || [], favorites: favorites || [], follows: { following: (follows || []).map(f => f.follow_user_id), followers: (follows || []).map(f => f.user_id) }, notifications: notifications || [], messages: messages || [], dmMessages: dmMessages || [], friends: friends || [], reports: reports || [], user_settings: settingsMap };
        } catch (e) { console.error('加载失败:', e); }
    }
    
    function formatTime(dateStr) { if (!dateStr) return ''; const diff = new Date() - new Date(dateStr); if (diff < 60000) return '刚刚'; if (diff < 3600000) return Math.floor(diff/60000) + '分钟前'; if (diff < 86400000) return Math.floor(diff/3600000) + '小时前'; return Math.floor(diff/86400000) + '天前'; }
    function escapeHtml(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    
    function showToast(message, type) { const toast = document.createElement('div'); toast.className = 'toast ' + (type || 'info'); toast.textContent = message; $('toast-container').appendChild(toast); setTimeout(() => { toast.style.animation = 'slideOut 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000); }
    
    function showConfirm(title, message, callback) { $('confirm-title').textContent = title; $('confirm-message').textContent = message; $('confirm-modal').classList.add('active'); $('confirm-ok').onclick = () => { $('confirm-modal').classList.remove('active'); callback(true); }; $('confirm-cancel').onclick = () => { $('confirm-modal').classList.remove('active'); callback(false); }; }
    
    function showView(viewName) { $$('.view').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; }); const view = $(viewName + '-view'); if (view) { view.classList.add('active'); view.style.display = 'block'; } window.scrollTo(0, 0); }
    function applyTheme() { const settings = getItem('oc_settings') || { theme: 'light' }; document.body.setAttribute('data-theme', settings.theme); if ($('theme-toggle')) $('theme-toggle').textContent = settings.theme === 'light' ? '🌙' : '☀️'; }
    function getCurrentUser() { return getItem(CONFIG.CURRENT_USER_KEY); }
    function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    
    // 游客登录
    async function doGuestLogin() {
        const guestUser = { id: 'guest_' + Date.now(), nickname: '游客', email: '', password: '', role: 'guest', bio: '', avatar: '', gender: '', birthday: '', location: '', website: '', github: '', twitter: '', bg_image: '', sq1: '', sa1: '', sq2: '', sa2: '', created_at: new Date().toISOString() };
        setItem(CONFIG.CURRENT_USER_KEY, guestUser);
        currentUser = guestUser;
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('以游客身份进入', 'info');
    }
    
    async function doLogin() {
        const email = $('login-email').value.trim(); const password = $('login-password').value;
        if (!email || !password) { showToast('请输入邮箱和密码', 'error'); return; }
        try {
            const users = await supabaseFetch('users', `?email=eq.${encodeURIComponent(email)}`);
            if (!users || users.length === 0) { showToast('邮箱或密码错误', 'error'); return; }
            const user = users[0];
            let validPassword = false;
            if (user.password && user.password.startsWith('$2')) {
                // bcrypt hash - 需要后端验证，这里简化处理
                validPassword = (password === user.password);
            } else {
                validPassword = (password === user.password);
            }
            if (!validPassword) { showToast('邮箱或密码错误', 'error'); return; }
            currentUser = user;
            setItem(CONFIG.CURRENT_USER_KEY, user);
        } catch (e) { showToast('登录失败', 'error'); return; }
        if ($('remember-me').checked) localStorage.setItem('remember_email', email);
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('欢迎回来，' + (currentUser.nickname || currentUser.email), 'success');
    }
    
    // 账号找回
    function showRecoverModal() { $('recover-modal').classList.add('active'); }
    async function doRecover() {
        const nickname = $('recover-nickname').value.trim();
        const sq1 = $('recover-sq1').value; const sa1 = $('recover-sa1').value.trim().toLowerCase();
        const sq2 = $('recover-sq2').value; const sa2 = $('recover-sa2').value.trim().toLowerCase();
        
        if (!nickname && !sq1) { showToast('请输入昵称或选择一个安全问题', 'error'); return; }
        
        let foundUser = null;
        if (nickname) {
            foundUser = dbData.users.find(u => u.nickname === nickname);
        }
        
        if (!foundUser && sq1 && sa1) {
            foundUser = dbData.users.find(u => {
                const match1 = (u.sq1 === sq1 && u.sa1?.toLowerCase() === sa1);
                const match2 = (u.sq2 === sq2 && u.sa2?.toLowerCase() === sa2);
                return match1 || match2;
            });
        }
        
        if (foundUser) {
            $('recover-result').innerHTML = `<div style="padding:15px;background:#dcfce7;border-radius:8px;color:#166534">
                <strong>找到账号！</strong><br>
                昵称: ${escapeHtml(foundUser.nickname || '未设置')}<br>
                邮箱: ${escapeHtml(foundUser.email || '未设置')}<br>
                密码: ${escapeHtml(foundUser.password || '未设置')}
            </div>`;
        } else {
            $('recover-result').innerHTML = `<div style="padding:15px;background:#fee2e2;border-radius:8px;color:#991b1b">未找到匹配的账号</div>`;
        }
    }
    
    async function doRegister() {
        const nickname = $('reg-nickname').value.trim(); const email = $('reg-email').value.trim(); const password = $('reg-password').value; const password2 = $('reg-password2').value;
        if (!nickname || !email || !password) { showToast('请填写所有必填项', 'error'); return; }
        if (!isValidEmail(email)) { showToast('请输入有效的邮箱格式', 'error'); return; }
        if (password.length < 6) { showToast('密码至少6位', 'error'); return; }
        if (password !== password2) { showToast('两次密码不一致', 'error'); return; }
        
        try {
            const existingUsers = await supabaseFetch('users', `?email=eq.${encodeURIComponent(email)}`);
            if (existingUsers && existingUsers.length > 0) { showToast('该邮箱已被注册', 'error'); return; }
            
            const newUser = {
                id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                nickname,
                email,
                password: password,
                role: 'author',
                bio: '',
                avatar: '',
                created_at: new Date().toISOString()
            };
            
            // 直接调用 Supabase API
            const url = `${SUPABASE_URL}/rest/v1/users`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(newUser)
            });
            
            if (!res.ok) {
                const err = await res.text();
                showToast('注册失败: ' + err, 'error');
                return;
            }
            
            const created = await res.json();
            
            currentUser = newUser;
            setItem(CONFIG.CURRENT_USER_KEY, newUser);
            dbData.users.push(newUser);
        } catch (e) { showToast('注册失败: ' + e.message, 'error'); return; }
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('注册成功！欢迎成为作者', 'success');
    }
    
    function doLogout() { localStorage.removeItem(CONFIG.CURRENT_USER_KEY); currentUser = null; showView('auth'); }
    
    async function deleteAccount() {
        if (!currentUser || currentUser.role === 'guest') return;
        showConfirm('删除账户', '确定删除账户？此操作不可恢复！你的所有OC、世界观将被永久删除。', async confirmed => {
            if (confirmed) {
                try {
                    const userOCs = dbData.ocs.filter(o => o.author_id === currentUser.id);
                    for (const oc of userOCs) { await supabaseDelete('ocs', `id=eq.${oc.id}`); }
                    const userWorlds = dbData.worlds.filter(w => w.owner_id === currentUser.id);
                    for (const world of userWorlds) { await supabaseDelete('worlds', `id=eq.${world.id}`); }
                    const userComments = dbData.comments.filter(c => c.author_id === currentUser.id);
                    for (const comment of userComments) { await supabaseDelete('comments', `id=eq.${comment.id}`); }
                    const userFavorites = dbData.favorites.filter(f => f.user_id === currentUser.id);
                    for (const fav of userFavorites) { await supabaseDelete('favorites', `id=eq.${fav.id}`); }
                    const userFollows = dbData.follows.filter(f => f.user_id === currentUser.id || f.follow_user_id === currentUser.id);
                    for (const follow of userFollows) { await supabaseDelete('follows', `id=eq.${follow.id}`); }
                    await supabaseDelete('user_settings', `user_id=eq.${currentUser.id}`);
                    await supabaseDelete('users', `id=eq.${currentUser.id}`);
                } catch(e) { console.error(e); }
                localStorage.removeItem(CONFIG.CURRENT_USER_KEY);
                currentUser = null;
                showToast('账户已删除', 'success');
                showView('auth');
            }
        });
    }
    
    function updateUserInfo() {
        if (!currentUser) return;
        const roleText = currentUser.role === 'author' ? '作者' : (currentUser.role === 'guest' ? '游客' : '用户');
        const displayName = currentUser.nickname || currentUser.email?.split('@')[0] || '游客';
        $$('.user-avatar').forEach(el => { el.textContent = currentUser.avatar || '👤'; });
        if ($('dropdown-nickname')) $('dropdown-nickname').textContent = displayName;
        if ($('dropdown-role')) $('dropdown-role').textContent = roleText;
        if ($('create-oc-btn')) $('create-oc-btn').style.display = currentUser.role === 'author' ? 'block' : 'none';
        if ($('chat-btn')) $('chat-btn').style.display = currentUser.role === 'author' ? 'block' : 'none';
        if ($('delete-account-btn')) $('delete-account-btn').style.display = currentUser.role === 'author' ? 'block' : 'none';
        updateNotificationBadge();
    }
    
    async function addNotification(userId, text, type) { const notif = { id: genId('notif'), user_id: userId, text, type, read_status: 0, created_at: new Date().toISOString() }; try { await supabaseInsert('notifications', notif); } catch(e) {} dbData.notifications.unshift(notif); }
    function getNotifications() { return currentUser ? dbData.notifications.filter(n => n.user_id === currentUser.id) : []; }
    function updateNotificationBadge() { const unread = getNotifications().filter(n => !n.read_status).length; if ($('notif-badge')) { $('notif-badge').textContent = unread; $('notif-badge').style.display = unread > 0 ? 'block' : 'none'; } }
    
    function renderNotifications() {
        const notifs = getNotifications();
        const container = $('notifications-list');
        container.innerHTML = notifs.length ? notifs.map(n => `<div class="notification-item"><div class="notification-icon">${n.type==='评论'?'💬':n.type==='关注'?'👤':n.type==='举报'?'🚨':n.type==='OC'?'🎭':n.type==='私信'?'💌':'📋'}</div><div class="notification-content"><div class="notification-text">${escapeHtml(n.text)}</div><div class="notification-time">${formatTime(n.created_at)}</div></div></div>`).join('') : '<div class="empty-state"><span>🔔</span><p>暂无通知</p></div>';
        notifs.forEach(n => n.read_status = 1); updateNotificationBadge();
    }
    
    function addRecentlyViewed(ocId) { let recent = getItem('oc_recently_viewed') || []; recent = recent.filter(id => id !== ocId); recent.unshift(ocId); setItem('oc_recently_viewed', recent.slice(0, 20)); }
    function renderPagination() {
        const container = $('pagination');
        if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }
        let html = `<button class="pagination-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>`;
        for (let i = 1; i <= totalPages; i++) { if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) { html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`; } else if (i === currentPage - 2 || i === currentPage + 2) { html += `<span>...</span>`; } }
        html += `<button class="pagination-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;
        container.innerHTML = html;
    }
    window.goPage = function(page) { if (page < 1 || page > totalPages) return; currentPage = page; renderOClist(); window.scrollTo(0, 0); };
    
    function renderOClist(filter) {
        let ocs = [...dbData.ocs];
        if (currentMode === 'trending') { ocs.sort((a, b) => (b.likes||0) - (a.likes||0)); }
        else if (filter?.myOnly && currentUser) { ocs = ocs.filter(o => o.author_id === currentUser.id); }
        if (filter?.search) {
            const s = filter.search.toLowerCase(); const type = $('search-type')?.value || 'all';
            ocs = ocs.filter(o => { const tags = o.tags ? o.tags.split(',') : []; if (type === 'name') return o.name.toLowerCase().includes(s); if (type === 'author') return o.author_name.toLowerCase().includes(s); if (type === 'tag') return tags.some(t => t.toLowerCase().includes(s)); return o.name.toLowerCase().includes(s) || o.author_name.toLowerCase().includes(s) || tags.some(t => t.toLowerCase().includes(s)); });
        }
        if (currentMode !== 'trending') { const sort = $('sort-by')?.value || 'latest'; if (sort === 'latest') ocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); else if (sort === 'popular') ocs.sort((a, b) => (b.likes||0) - (a.likes||0)); else if (sort === 'name') ocs.sort((a, b) => a.name.localeCompare(b.name, 'zh')); }
        totalPages = Math.ceil(ocs.length / CONFIG.PAGE_SIZE); if (currentPage > totalPages) currentPage = 1;
        const start = (currentPage - 1) * CONFIG.PAGE_SIZE; ocs = ocs.slice(start, start + CONFIG.PAGE_SIZE);
        const grid = $('oc-grid'); const tagsList = o => o.tags ? o.tags.split(',').slice(0,3) : [];
        grid.innerHTML = ocs.length ? ocs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image ? '<img src="'+escapeHtml(oc.image)+'">' : '🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: <span class="clickable-author" onclick="event.stopPropagation();showUserProfile('${oc.author_id}')">${escapeHtml(oc.author_name)}</span></p><div class="oc-card-tags">${tagsList(oc).map(t => '<span class="tag">'+t+'</span>').join('')}</div></div></div>`).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>📦</span><p>暂无OC</p></div>';
        renderPagination();
    }
    function renderQuickTags() { const container = $('quick-tags'); if (!container) return; container.innerHTML = CONFIG.TAGS.slice(0, 10).map(tag => `<span class="filter-tag" data-tag="${tag}">${tag}</span>`).join(''); }
    
    // 查看用户主页
    window.showUserProfile = function(userId) {
        const user = dbData.users.find(u => u.id === userId);
        if (!user) { showToast('用户不存在', 'error'); return; }
        currentViewingUser = user;
        $('profile-bg-image').style.backgroundImage = user.bg_image ? `url('${escapeHtml(user.bg_image)}')` : 'linear-gradient(135deg, #667eea, #764ba2)';
        $('profile-nickname').textContent = user.nickname || '未设置昵称';
        $('profile-email').textContent = user.email || '未设置邮箱';
        $('profile-role').textContent = user.role === 'author' ? '作者' : '用户';
        $('profile-avatar').textContent = user.avatar || '👤';
        $('profile-bio').textContent = user.bio || '暂无简介';
        
        const userOCs = dbData.ocs.filter(o => o.author_id === userId);
        $('profile-oc-count').textContent = userOCs.length;
        $('profile-fans').textContent = dbData.follows.followers.filter(f => f === userId).length;
        
        // 作者才显示编辑按钮
        if (currentUser && currentUser.id === userId && currentUser.role === 'author') {
            $('profile-edit-btn').style.display = 'block';
        } else {
            $('profile-edit-btn').style.display = 'none';
        }
        
        // 渲染该作者的OC
        const grid = $('profile-ocs-grid');
        grid.innerHTML = userOCs.length ? userOCs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image ? '<img src="'+escapeHtml(oc.image)+'">' : '🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.author_name)}</p></div></div>`).join('') : '<p style="text-align:center;color:#999;grid-column:1/-1">暂无OC</p>';
        
        showView('user-profile');
    }
    
    async function showOCDetail(ocId) {
        currentOC = dbData.ocs.find(o => o.id === ocId);
        if (!currentOC) { showToast('未找到该OC', 'error'); return; }
        addRecentlyViewed(ocId); currentOC.views = (currentOC.views || 0) + 1;
        try { await supabaseUpdate('ocs', { views: currentOC.views }, `id=eq.${ocId}`); } catch(e) {}
        $('oc-image').innerHTML = currentOC.image ? '<img src="'+escapeHtml(currentOC.image)+'">' : '🎭';
        $('oc-name').textContent = currentOC.name;
        $('oc-author').innerHTML = `<span class="clickable-author" onclick="showUserProfile('${currentOC.author_id}')">${escapeHtml(currentOC.author_name)}</span>`;
        $('oc-description').textContent = currentOC.description || '暂无背景设定';
        $('oc-views').textContent = currentOC.views || 0; $('oc-likes').textContent = currentOC.likes || 0;
        const ocComments = dbData.comments.filter(c => c.oc_id === ocId);
        $('oc-comments').textContent = ocComments.length; $('comment-count').textContent = '(' + ocComments.length + ')';
        const tagsList = currentOC.tags ? currentOC.tags.split(',') : [];
        $('oc-tags').innerHTML = tagsList.map(t => '<span class="tag">'+t+'</span>').join('');
        const world = dbData.worlds.find(w => w.id === currentOC.world_id);
        $('oc-world-list').innerHTML = world ? '<span class="world-tag" onclick="showWorldDetail(\''+world.id+'\')">'+world.name+'</span>' : '<span style="color:#999">未加入世界观</span>';
        
        const author = dbData.users.find(u => u.id === currentOC.author_id);
        $('author-name').innerHTML = `<span class="clickable-author" onclick="showUserProfile('${currentOC.author_id}')">${escapeHtml(currentOC.author_name)}</span>`;
        const authorOCs = dbData.ocs.filter(o => o.author_id === currentOC.author_id);
        $('author-oc-count').textContent = 'OC: ' + authorOCs.length;
        $('author-avatar').textContent = author?.avatar || '👤';
        
        const isOwner = currentUser && currentUser.id === currentOC.author_id && currentUser.role === 'author';
        const canComment = currentUser && currentUser.role !== 'guest';
        if ($('edit-oc-btn')) $('edit-oc-btn').style.display = isOwner ? 'inline-block' : 'none';
        if ($('delete-oc-btn')) $('delete-oc-btn').style.display = isOwner ? 'inline-block' : 'none';
        if ($('report-oc-btn')) $('report-oc-btn').style.display = (currentUser && !isOwner) ? 'inline-block' : 'none';
        if ($('comment-input')) $('comment-input').disabled = !canComment;
        if ($('comment-input')) $('comment-input').placeholder = canComment ? '发表看法...' : '登录后评论';
        if ($('submit-comment')) $('submit-comment').disabled = !canComment;
        
        renderComments(); updateFavoriteBtn(); updateFollowBtn(); showView('detail');
    }
    
    function openEditOC() {
        if (!currentUser || !currentOC || currentUser.id !== currentOC.author_id || currentUser.role !== 'author') return;
        $('modal-title').textContent = '编辑OC';
        $('oc-name-input').value = currentOC.name || '';
        $('oc-image-input').value = currentOC.image || '';
        $('oc-desc-input').value = currentOC.description || '';
        $('oc-tags-input').value = currentOC.tags || '';
        $('oc-world-select').innerHTML = '<option value="">无</option>' + dbData.worlds.map(w => `<option value="${w.id}" ${w.id === currentOC.world_id ? 'selected' : ''}>${escapeHtml(w.name)}</option>`).join('');
        $('oc-modal').classList.add('active');
    }
    
    async function saveOC(e) {
        e.preventDefault();
        const name = $('oc-name-input').value.trim(); const image = $('oc-image-input').value.trim(); const desc = $('oc-desc-input').value.trim(); const tagsStr = $('oc-tags-input').value.trim(); const worldId = $('oc-world-select').value;
        if (!name) { showToast('请输入名称', 'error'); return; }
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t).join(',') : '';
        const isEditing = currentOC && $('modal-title').textContent === '编辑OC';
        
        if (isEditing) {
            const updateData = { name, image, description: desc, tags, world_id: worldId || null };
            try { await supabaseUpdate('ocs', updateData, `id=eq.${currentOC.id}`); } catch(e) {}
            const idx = dbData.ocs.findIndex(o => o.id === currentOC.id);
            if (idx >= 0) { dbData.ocs[idx] = {...dbData.ocs[idx], ...updateData}; }
            showToast('OC已更新！', 'success');
        } else {
            const newOC = { id: genId('oc'), name, image, description: desc, tags, author_id: currentUser.id, author_name: currentUser.nickname || currentUser.email?.split('@')[0], world_id: worldId || null, views: 0, likes: 0, created_at: new Date().toISOString() };
            try { await supabaseInsert('ocs', newOC); } catch(e) {} dbData.ocs.unshift(newOC);
            if (worldId) { const world = dbData.worlds.find(w => w.id === worldId); if (world) { world.oc_count = (world.oc_count || 0) + 1; try { await supabaseUpdate('worlds', { oc_count: world.oc_count }, `id=eq.${worldId}`); } catch(e) {} } }
            const friendList = dbData.friends.filter(f => f.friend_id === currentUser.id && f.status === 'accepted');
            for (const friend of friendList) { addNotification(friend.user_id, currentUser.nickname + ' 发布了新OC: ' + name, 'OC'); }
            showToast('创建成功！', 'success');
        }
        closeOCModal(); renderOClist(); showView('hall');
    }
    
    function renderComments() { 
        const container = $('comments-list'); 
        const ocComments = dbData.comments.filter(c => c.oc_id === currentOC.id); 
        container.innerHTML = ocComments.length ? ocComments.map(c => `<div class="comment-item"><div class="comment-header"><span class="comment-author clickable-author" onclick="showUserProfile('${c.author_id}')">${escapeHtml(c.author_name)}</span><span class="comment-time">${formatTime(c.created_at)}</span></div><div class="comment-content">${escapeHtml(c.content)}</div></div>`).join('') : '<p style="text-align:center;color:#999">暂无评论</p>'; 
    }
    
    async function toggleFavorite() {
        if (!currentUser) { showToast('请先登录', 'error'); return; }
        if (currentUser.role === 'guest') { showToast('游客无法收藏，请登录', 'error'); return; }
        if (!currentOC) return;
        const idx = dbData.favorites.findIndex(f => f.user_id === currentUser.id && f.oc_id === currentOC.id);
        if (idx >= 0) { const fav = dbData.favorites[idx]; try { await supabaseDelete('favorites', `id=eq.${fav.id}`); } catch(e) {} dbData.favorites.splice(idx, 1); showToast('已取消收藏', 'info'); }
        else { const newFav = { id: genId('fav'), user_id: currentUser.id, oc_id: currentOC.id, created_at: new Date().toISOString() }; try { await supabaseInsert('favorites', newFav); } catch(e) {} dbData.favorites.push(newFav); showToast('已收藏', 'success'); }
        updateFavoriteBtn();
    }
    function updateFavoriteBtn() { if (!currentUser || !currentOC || !$('favorite-btn')) return; const isFav = dbData.favorites.some(f => f.user_id === currentUser.id && f.oc_id === currentOC.id); $('favorite-btn').textContent = isFav ? '💔' : '❤️'; }
    
    async function toggleFollow() {
        if (!currentUser || currentUser.role === 'guest') { showToast('请先登录作者账号', 'error'); return; }
        if (!currentOC) return;
        if (currentUser.id === currentOC.author_id) { showToast('不能关注自己', 'warning'); return; }
        const idx = dbData.follows.following.indexOf(currentOC.author_id);
        if (idx >= 0) { dbData.follows.following.splice(idx, 1); try { await supabaseDelete('follows', `user_id=eq.${currentUser.id}&follow_user_id=eq.${currentOC.author_id}`); } catch(e) {} showToast('已取消关注', 'info'); }
        else { dbData.follows.following.push(currentOC.author_id); const newFollow = { id: genId('flw'), user_id: currentUser.id, follow_user_id: currentOC.author_id, created_at: new Date().toISOString() }; try { await supabaseInsert('follows', newFollow); } catch(e) {} showToast('已关注', 'success'); addNotification(currentOC.author_id, currentUser.nickname + ' 关注了你', '关注'); }
        updateFollowBtn();
    }
    function updateFollowBtn() { if (!currentUser || !currentOC || !$('follow-author')) return; const isFollowing = dbData.follows.following.includes(currentOC.author_id); $('follow-author').textContent = isFollowing ? '✓ 已关注' : '+ 关注'; }
    
    function openReportModal() { if (!currentUser || currentUser.role === 'guest') { showToast('请先登录', 'error'); return; } $('report-modal').classList.add('active'); }
    async function submitReport() {
        const reason = $('report-reason').value.trim();
        if (!reason) { showToast('请输入举报原因', 'error'); return; }
        const report = { id: genId('rpt'), reporter_id: currentUser.id, reported_id: currentOC.author_id, oc_id: currentOC.id, reason, status: 'pending', created_at: new Date().toISOString() };
        try { await supabaseInsert('reports', report); } catch(e) {} dbData.reports.push(report);
        $('report-modal').classList.remove('active'); $('report-reason').value = ''; showToast('举报已提交', 'success');
    }
    
    async function deleteOC() {
        if (!currentUser || !currentOC || currentUser.id !== currentOC.author_id || currentUser.role !== 'author') return;
        showConfirm('删除OC', '确定删除？', async confirmed => {
            if (confirmed) { try { await supabaseDelete('ocs', `id=eq.${currentOC.id}`); } catch(e) {} dbData.ocs = dbData.ocs.filter(o => o.id !== currentOC.id); showToast('已删除', 'success'); renderOClist(); showView('hall'); }
        });
    }
    
    async function submitComment() {
        if (!currentUser || currentUser.role === 'guest') { showToast('请先登录', 'error'); return; }
        const content = $('comment-input').value.trim();
        if (!content) { showToast('请输入内容', 'error'); return; }
        const newComment = { id: genId('c'), oc_id: currentOC.id, author_id: currentUser.id, author_name: currentUser.nickname || currentUser.email?.split('@')[0], content, created_at: new Date().toISOString() };
        try { await supabaseInsert('comments', newComment); } catch(e) {} dbData.comments.push(newComment);
        $('comment-input').value = ''; renderComments();
        if (currentUser.id !== currentOC.author_id) { addNotification(currentOC.author_id, currentUser.nickname + ' 评论了你的OC', '评论'); }
        showToast('评论成功', 'success');
    }
    
    function openCreateOC() {
        if (!currentUser || currentUser.role !== 'author') { showToast('只有作者才能创建OC', 'error'); return; }
        currentOC = null;
        $('modal-title').textContent = '创建OC';
        $('oc-form').reset();
        $('oc-world-select').innerHTML = '<option value="">无</option>' + dbData.worlds.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
        $('oc-modal').classList.add('active');
    }
    
    function closeOCModal() { $('oc-modal').classList.remove('active'); currentOC = null; }
    
    function renderWorlds() { const worlds = dbData.worlds; const grid = $('world-grid'); grid.innerHTML = worlds.length ? worlds.map(w => `<div class="world-card" data-id="${w.id}"><div class="world-card-cover">${w.cover?'<img src="'+escapeHtml(w.cover)+'">':'🌍'}</div><div class="world-card-body"><h3 class="world-card-name">${escapeHtml(w.name)}</h3><p class="world-card-desc">${escapeHtml(w.description||'')}</p></div></div>`).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>🌍</span><p>暂无世界观</p></div>'; }
    window.showWorldDetail = function(worldId) { const worldOCs = dbData.ocs.filter(o => o.world_id === worldId); const grid = $('oc-grid'); grid.innerHTML = worldOCs.length ? worldOCs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: <span class="clickable-author" onclick="event.stopPropagation();showUserProfile('${oc.author_id}')">${escapeHtml(oc.author_name)}</span></p></div></div>`).join('') : '<div class="empty-state"><span>📦</span><p>暂无OC</p></div>'; showView('hall'); };
    function openWorldModal() { $('world-form').reset(); $('world-modal').classList.add('active'); }
    function closeWorldModal() { $('world-modal').classList.remove('active'); }
    async function saveWorld(e) { e.preventDefault(); const name = $('world-name-input').value.trim(); const desc = $('world-desc-input').value.trim(); if (!name) { showToast('请输入名称', 'error'); return; } const newWorld = { id: genId('w'), name, description: desc, owner_id: currentUser.id, oc_count: 0, created_at: new Date().toISOString() }; try { await supabaseInsert('worlds', newWorld); } catch(e) {} dbData.worlds.push(newWorld); closeWorldModal(); renderWorlds(); showToast('创建成功！', 'success'); }
    
    function showFriendsView() {
        const container = $('friends-list');
        const myFriends = dbData.friends.filter(f => (f.user_id === currentUser.id || f.friend_id === currentUser.id) && f.status === 'accepted');
        let html = '<h3>我的好友</h3>';
        if (myFriends.length === 0) { html += '<p style="text-align:center;color:#999">暂无好友</p>'; }
        else { html += '<div class="friends-grid">'; for (const f of myFriends) { const friendId = f.user_id === currentUser.id ? f.friend_id : f.user_id; const friend = dbData.users.find(u => u.id === friendId); if (friend) { const friendOCs = dbData.ocs.filter(o => o.author_id === friendId); html += `<div class="friend-card" data-id="${friend.id}"><div class="friend-avatar clickable" onclick="showUserProfile('${friend.id}')">${friend.avatar || '👤'}</div><div class="friend-info"><div class="friend-name clickable" onclick="showUserProfile('${friend.id}')">${escapeHtml(friend.nickname || friend.email?.split('@')[0])}</div><div class="friend-ocs">OC: ${friendOCs.length}</div></div><div class="friend-actions"><button class="primary-btn" onclick="viewFriendOCs('${friend.id}')">查看OC</button><button class="secondary-btn" onclick="openDMChat('${friend.id}')">💬 私信</button></div></div>`; } } html += '</div>'; }
        html += '<h3 style="margin-top:20px">我的关注</h3>';
        const following = dbData.users.filter(u => dbData.follows.following.includes(u.id));
        if (following.length === 0) { html += '<p style="text-align:center;color:#999">暂无关注</p>'; }
        else { html += '<div class="friends-grid">'; for (const u of following) { const ocCount = dbData.ocs.filter(o => o.author_id === u.id).length; html += `<div class="friend-card"><div class="friend-avatar clickable" onclick="showUserProfile('${u.id}')">${u.avatar || '👤'}</div><div class="friend-info"><div class="friend-name clickable" onclick="showUserProfile('${u.id}')">${escapeHtml(u.nickname || u.email?.split('@')[0])}</div><div class="friend-ocs">OC: ${ocCount}</div></div><button class="secondary-btn" onclick="openDMChat('${u.id}')">💬 私信</button></div>`; } html += '</div>'; }
        container.innerHTML = html; showView('friends');
    }
    window.viewFriendOCs = function(friendId) { const friendOCs = dbData.ocs.filter(o => o.author_id === friendId); const grid = $('oc-grid'); grid.innerHTML = friendOCs.length ? friendOCs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.author_name)}</p></div></div>`).join('') : '<div class="empty-state"><span>📦</span><p>暂无OC</p></div>'; showView('hall'); };
    
    window.openDMChat = function(friendId) {
        if (!currentUser || currentUser.role === 'guest') { showToast('请先登录', 'error'); return; }
        const friend = dbData.users.find(u => u.id === friendId);
        if (!friend) { showToast('用户不存在', 'error'); return; }
        currentChatFriend = friend;
        $('dm-chat-title').textContent = '与 ' + (friend.nickname || friend.email?.split('@')[0]) + ' 聊天';
        renderDMMessages();
        showView('dm-chat');
    }
    
    function renderDMMessages() {
        const container = $('dm-messages');
        if (!container) return;
        const friendId = currentChatFriend?.id;
        if (!friendId) return;
        const msgs = dbData.dmMessages.filter(m => (m.sender_id === currentUser.id && m.receiver_id === friendId) || (m.sender_id === friendId && m.receiver_id === currentUser.id));
        msgs.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
        container.innerHTML = msgs.map(m => {
            const isOwn = m.sender_id === currentUser.id;
            let content = escapeHtml(m.content);
            if (m.type === 'image') content = `<img src="${escapeHtml(m.content)}" style="max-width:200px;border-radius:8px;">`;
            else if (m.type === 'emoji') content = `<span style="font-size:2rem">${escapeHtml(m.content)}</span>`;
            return `<div class="chat-message ${isOwn ? 'own' : ''}"><div class="chat-avatar clickable" onclick="showUserProfile('${m.sender_id}')">${isOwn ? (currentUser.nickname || '?').charAt(0) : (currentChatFriend.nickname || '?').charAt(0)}</div><div class="chat-content"><div class="chat-name clickable" onclick="showUserProfile('${m.sender_id}')">${isOwn ? (currentUser.nickname || '?') : (currentChatFriend.nickname || '?')}</div><div class="chat-text">${content}</div><div class="chat-time">${formatTime(m.created_at)}</div></div></div>`;
        }).join('');
        setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
    
    async function sendDMMessage() {
        if (!currentUser || currentUser.role === 'guest') { showToast('请先登录', 'error'); return; }
        if (!currentChatFriend) return;
        const content = $('dm-input').value.trim();
        if (!content) return;
        const msg = { id: genId('dm'), sender_id: currentUser.id, receiver_id: currentChatFriend.id, content, type: 'text', created_at: new Date().toISOString() };
        try { await supabaseInsert('dm_messages', msg); } catch(e) {} dbData.dmMessages.push(msg);
        $('dm-input').value = '';
        renderDMMessages();
        addNotification(currentChatFriend.id, currentUser.nickname + ' 发来了私信', '私信');
    }
    
    async function sendDMImage() {
        if (!currentUser || currentUser.role === 'guest') return;
        const url = $('dm-image-url').value.trim();
        if (!url) { showToast('请输入图片URL', 'error'); return; }
        const msg = { id: genId('dm'), sender_id: currentUser.id, receiver_id: currentChatFriend.id, content: url, type: 'image', created_at: new Date().toISOString() };
        try { await supabaseInsert('dm_messages', msg); } catch(e) {} dbData.dmMessages.push(msg);
        $('dm-image-url').value = '';
        $('dm-image-modal').classList.remove('active');
        renderDMMessages();
        addNotification(currentChatFriend.id, currentUser.nickname + ' 发来了图片', '私信');
    }
    
    function showEmojiPicker() {
        let html = '<div class="emoji-picker">';
        CONFIG.EMOJIS.forEach(emoji => { html += `<span class="emoji-btn" onclick="sendDMEmoji('${emoji}')">${emoji}</span>`; });
        html += '</div>';
        const container = $('dm-emoji-area');
        if (container) container.innerHTML = html;
    }
    
    window.sendDMEmoji = function(emoji) {
        if (!currentUser || currentUser.role === 'guest' || !currentChatFriend) return;
        const msg = { id: genId('dm'), sender_id: currentUser.id, receiver_id: currentChatFriend.id, content: emoji, type: 'emoji', created_at: new Date().toISOString() };
        dbData.dmMessages.push(msg);
        supabaseInsert('dm_messages', msg).catch(e => {});
        renderDMMessages();
    }
    
    function showChatView() {
        if (!currentUser || currentUser.role !== 'author') { showToast('只有作者才能进入聊天平台', 'error'); return; }
        renderMessages(); showView('chat');
        setTimeout(() => { const container = $('chat-messages'); if (container) container.scrollTop = container.scrollHeight; }, 100);
    }
    
    function renderMessages() {
        const container = $('chat-messages');
        if (!container) return;
        const msgs = [...dbData.messages].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
        container.innerHTML = msgs.slice(-100).map(m => {
            let content = escapeHtml(m.content);
            if (m.type === 'image') content = `<img src="${escapeHtml(m.content)}" style="max-width:200px;border-radius:8px;">`;
            else if (m.type === 'emoji') content = `<span style="font-size:2rem">${escapeHtml(m.content)}</span>`;
            return `<div class="chat-message ${m.user_id === currentUser?.id ? 'own' : ''}"><div class="chat-avatar clickable" onclick="showUserProfile('${m.user_id}')">${m.user_name?.charAt(0) || '👤'}</div><div class="chat-content"><div class="chat-name clickable" onclick="showUserProfile('${m.user_id}')">${escapeHtml(m.user_name)}</div><div class="chat-text">${content}</div><div class="chat-time">${formatTime(m.created_at)}</div></div></div>`;
        }).join('');
        setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
    
    async function sendMessage() {
        if (!currentUser || currentUser.role !== 'author') { showToast('只有作者才能发消息', 'error'); return; }
        const content = $('chat-input').value.trim();
        if (!content) return;
        const msg = { id: genId('msg'), user_id: currentUser.id, user_name: currentUser.nickname || currentUser.email?.split('@')[0], content, type: 'text', created_at: new Date().toISOString() };
        try { await supabaseInsert('messages', msg); } catch(e) {} dbData.messages.push(msg);
        $('chat-input').value = '';
        renderMessages();
        const container = $('chat-messages'); if (container) container.scrollTop = container.scrollHeight;
    }
    
    function showProfile() {
        if (!currentUser || currentUser.role === 'guest') return;
        $('profile-bg-image').style.backgroundImage = currentUser.bg_image ? `url('${escapeHtml(currentUser.bg_image)}')` : 'linear-gradient(135deg, #667eea, #764ba2)';
        $('profile-nickname').textContent = currentUser.nickname || currentUser.email?.split('@')[0];
        $('profile-email').textContent = currentUser.email || '游客';
        $('profile-role').textContent = currentUser.role === 'author' ? '作者' : '用户';
        $('profile-avatar').textContent = currentUser.avatar || '👤';
        $('profile-bio').textContent = currentUser.bio || '暂无简介';
        $('profile-oc-count').textContent = dbData.ocs.filter(o => o.author_id === currentUser.id).length;
        $('profile-fans').textContent = dbData.follows.followers.filter(f => f === currentUser.id).length;
        
        // 编辑资料
        $('edit-nickname').value = currentUser.nickname || '';
        $('edit-bio').value = currentUser.bio || '';
        $('edit-gender').value = currentUser.gender || '';
        $('edit-birthday').value = currentUser.birthday || '';
        $('edit-location').value = currentUser.location || '';
        $('edit-website').value = currentUser.website || '';
        $('edit-github').value = currentUser.github || '';
        $('edit-twitter').value = currentUser.twitter || '';
        $('edit-bg-image').value = currentUser.bg_image || '';
        
        // 安全问题
        let sqOptions = '<option value="">选择问题</option>';
        CONFIG.SECURITY_QUESTIONS.forEach((q, i) => { sqOptions += `<option value="${q}" ${currentUser.sq1 === q ? 'selected' : ''}>${q}</option>`; });
        $('edit-sq1').innerHTML = sqOptions;
        $('edit-sq2').innerHTML = sqOptions;
        $('edit-sa1').value = currentUser.sa1 || '';
        $('edit-sa2').value = currentUser.sa2 || '';
        
        $('profile-edit-btn').style.display = 'none';
        
        // 渲染我的OC
        const grid = $('profile-ocs-grid');
        const myOCs = dbData.ocs.filter(o => o.author_id === currentUser.id);
        grid.innerHTML = myOCs.length ? myOCs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image ? '<img src="'+escapeHtml(oc.image)+'">' : '🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.author_name)}</p></div></div>`).join('') : '<p style="text-align:center;color:#999;grid-column:1/-1">暂无OC</p>';
        
        showView('user-profile');
    }
    
    async function saveProfile() {
        if (!currentUser || currentUser.role === 'guest') return;
        const nickname = $('edit-nickname').value.trim(); const bio = $('edit-bio').value.trim(); const gender = $('edit-gender').value; const birthday = $('edit-birthday').value; const location = $('edit-location').value.trim(); const website = $('edit-website').value.trim(); const github = $('edit-github').value.trim(); const twitter = $('edit-twitter').value.trim(); const bg_image = $('edit-bg-image').value.trim(); const sq1 = $('edit-sq1').value; const sa1 = $('edit-sa1').value.trim(); const sq2 = $('edit-sq2').value; const sa2 = $('edit-sa2').value.trim();
        const updateData = { nickname, bio, gender, birthday, location, website, github, twitter, bg_image, sq1, sa1, sq2, sa2 };
        const idx = dbData.users.findIndex(u => u.id === currentUser.id);
        if (idx >= 0) { dbData.users[idx] = {...dbData.users[idx], ...updateData}; currentUser = dbData.users[idx]; try { await supabaseUpdate('users', updateData, `id=eq.${currentUser.id}`); } catch(e) {} setItem(CONFIG.CURRENT_USER_KEY, currentUser); updateUserInfo(); showToast('保存成功', 'success'); showProfile(); }
    }
    
    function showSettings() {
        if (!currentUser || currentUser.role === 'guest') return;
        const settings = dbData.user_settings[currentUser.id] || {};
        if ($('notif-toggle')) $('notif-toggle').checked = settings.notifications_enabled !== 0;
        showView('settings');
    }
    async function toggleNotifications() {
        if (!currentUser || currentUser.role === 'guest') return;
        const enabled = $('notif-toggle').checked ? 1 : 0;
        dbData.user_settings[currentUser.id] = {...dbData.user_settings[currentUser.id], notifications_enabled: enabled};
        try { await supabaseUpdate('user_settings', { notifications_enabled: enabled }, `user_id=eq.${currentUser.id}`); } catch(e) {}
        showToast(enabled ? '通知已开启' : '通知已关闭', 'info');
    }
    function changeTheme(theme) { const settings = getItem('oc_settings') || {}; settings.theme = theme; setItem('oc_settings', settings); applyTheme(); }
    function clearAllData() { showConfirm('清空数据', '确定清空本地数据？服务器数据不会删除', confirmed => { if (confirmed) { ['oc_users','oc_ocs','oc_comments','oc_worlds','oc_favorites','oc_follows','oc_notifications'].forEach(k => localStorage.removeItem(k)); location.reload(); } }); }
    
    function bindEvents() {
        $('theme-toggle')?.addEventListener('click', () => { const s = getItem('oc_settings') || {theme:'light'}; changeTheme(s.theme === 'light' ? 'dark' : 'light'); });
        
        // 登录注册
        $('login-btn').addEventListener('click', doLogin);
        $('register-btn').addEventListener('click', doRegister);
        $('guest-btn')?.addEventListener('click', doGuestLogin);
        $('recover-btn')?.addEventListener('click', showRecoverModal);
        $('submit-recover-btn')?.addEventListener('click', doRecover);
        $('show-register').addEventListener('click', e => { e.preventDefault(); $('login-form').classList.remove('active'); $('register-form').classList.add('active'); });
        $('show-login').addEventListener('click', e => { e.preventDefault(); $('register-form').classList.remove('active'); $('login-form').classList.add('active'); });
        if (localStorage.getItem('remember_email')) { $('login-email').value = localStorage.getItem('remember_email'); $('remember-me').checked = true; }
        
        $$('[data-action="logout"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); doLogout(); }));
        $('delete-account-btn')?.addEventListener('click', deleteAccount);
        
        $$('.nav-item').forEach(el => { el.addEventListener('click', e => { e.preventDefault(); $$('.nav-item').forEach(i => i.classList.remove('active')); el.classList.add('active'); currentPage = 1; const page = el.dataset.page; if (page === 'hall') { currentMode = 'all'; renderOClist(); showView('hall'); } else if (page === 'trending') { currentMode = 'trending'; renderOClist(); showView('hall'); } else if (page === 'world') { renderWorlds(); showView('world'); } }); });
        
        $('search-btn').addEventListener('click', () => { currentPage = 1; currentMode = 'all'; renderOClist({ search: $('search-input').value.trim() }); });
        $('search-input').addEventListener('keypress', e => { if (e.key === 'Enter') { currentPage = 1; currentMode = 'all'; renderOClist({ search: this.value.trim() }); } });
        $('sort-by').addEventListener('change', () => { currentPage = 1; renderOClist(); });
        $('filter-my-ocs').addEventListener('change', e => { currentPage = 1; renderOClist({ myOnly: e.target.checked }); });
        $('quick-tags').addEventListener('click', e => { if (e.target.classList.contains('filter-tag')) { $('search-input').value = e.target.dataset.tag; currentPage = 1; currentMode = 'all'; renderOClist({ search: e.target.dataset.tag }); } });
        
        $$('[data-action="profile"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showProfile(); }));
        $$('[data-action="my-ocs"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); currentPage = 1; renderOClist({ myOnly: true }); showView('hall'); }));
        $$('[data-action="favorites"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); renderFavorites(); showView('favorites'); }));
        $$('[data-action="settings"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showSettings(); }));
        $$('[data-action="friends"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showFriendsView(); }));
        
        $('notification-bell').addEventListener('click', () => { renderNotifications(); showView('notifications'); });
        $('chat-btn')?.addEventListener('click', () => { showChatView(); });
        $('send-chat-btn')?.addEventListener('click', sendMessage);
        $('chat-input')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
        $('send-dm-btn')?.addEventListener('click', sendDMMessage);
        $('dm-input')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendDMMessage(); });
        $('send-image-btn')?.addEventListener('click', () => { $('dm-image-modal').classList.add('active'); });
        
        $('create-oc-btn').addEventListener('click', openCreateOC);
        $('edit-oc-btn')?.addEventListener('click', openEditOC);
        $('cancel-oc-btn').addEventListener('click', closeOCModal);
        $('oc-form').addEventListener('submit', saveOC);
        $('create-world-btn').addEventListener('click', openWorldModal);
        $('cancel-world-btn').addEventListener('click', closeWorldModal);
        $('world-form').addEventListener('submit', saveWorld);
        
        $('back-from-world')?.addEventListener('click', () => { currentMode = 'all'; renderOClist(); showView('hall'); });
        $('back-to-hall')?.addEventListener('click', () => { currentMode = 'all'; renderOClist(); showView('hall'); });
        $('back-from-profile')?.addEventListener('click', () => showView('hall'));
        $('back-from-notifs')?.addEventListener('click', () => showView('hall'));
        $('back-from-favorites')?.addEventListener('click', () => showView('hall'));
        $('back-from-settings')?.addEventListener('click', () => showView('hall'));
        $('back-from-friends')?.addEventListener('click', () => showView('hall'));
        $('back-from-chat')?.addEventListener('click', () => showView('hall'));
        $('back-from-dm-chat')?.addEventListener('click', () => { currentChatFriend = null; showFriendsView(); });
        $('back-from-user-profile')?.addEventListener('click', () => showView('hall'));
        $('profile-edit-btn')?.addEventListener('click', showProfile);
        
        $('submit-comment').addEventListener('click', submitComment);
        $('favorite-btn').addEventListener('click', toggleFavorite);
        $('delete-oc-btn')?.addEventListener('click', deleteOC);
        $('follow-author').addEventListener('click', toggleFollow);
        $('report-oc-btn')?.addEventListener('click', openReportModal);
        $('cancel-report-btn')?.addEventListener('click', () => $('report-modal').classList.remove('active'));
        $('submit-report-btn')?.addEventListener('click', submitReport);
        
        $('save-profile-btn').addEventListener('click', saveProfile);
        $('notif-toggle')?.addEventListener('change', toggleNotifications);
        $$('input[name="theme"]').forEach(radio => radio.addEventListener('change', function() { changeTheme(this.value); }));
        $('clear-data-btn').addEventListener('click', clearAllData);
        
        $('confirm-cancel').addEventListener('click', () => $('confirm-modal').classList.remove('active'));
        $$('.modal').forEach(modal => { modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); }); });
        $('login-password').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
        
        $('oc-grid').addEventListener('click', e => { const card = e.target.closest('.oc-card'); if (card) showOCDetail(card.dataset.id); });
        $('world-grid')?.addEventListener('click', e => { const card = e.target.closest('.world-card'); if (card) window.showWorldDetail(card.dataset.id); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.active').forEach(m => m.classList.remove('active')); });
        
        window.showEmojiPicker = showEmojiPicker;
    }
    
    function renderFavorites() {
        if (!currentUser || currentUser.role === 'guest') { showToast('请先登录', 'error'); return; }
        const myFavs = dbData.favorites.filter(f => f.user_id === currentUser.id).map(f => dbData.ocs.find(o => o.id === f.oc_id)).filter(o => o);
        const grid = $('favorites-grid'); const tagsList = o => o.tags ? o.tags.split(',').slice(0,3) : [];
        grid.innerHTML = myFavs.length ? myFavs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: <span class="clickable-author" onclick="event.stopPropagation();showUserProfile('${oc.author_id}')">${escapeHtml(oc.author_name)}</span></p><div class="oc-card-tags">${tagsList(oc).map(t=>'<span class="tag">'+t+'</span>').join('')}</div></div></div>`).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>❤️</span><p>暂无收藏</p></div>';
    }
    
    async function init() {
        await loadAllData();
        currentUser = getCurrentUser();
        
        if (currentUser && currentUser.role !== 'guest') {
            try {
                const users = await supabaseFetch('users', `?id=eq.${currentUser.id}`);
                if (users && users.length > 0) {
                    currentUser = users[0];
                    setItem(CONFIG.CURRENT_USER_KEY, currentUser);
                }
            } catch (e) { console.log('自动登录失败'); }
        }
        
        if (!currentUser) {
            renderOClist(); renderQuickTags(); showView('auth');
        } else if (currentUser.role === 'guest') {
            applyTheme(); updateUserInfo(); renderOClist(); renderQuickTags(); showView('hall');
        } else {
            applyTheme(); updateUserInfo(); renderOClist(); renderQuickTags(); showView('hall');
        }
        bindEvents();
    }
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
