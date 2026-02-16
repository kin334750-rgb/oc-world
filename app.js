// OC世界
(function() {
    'use strict';
    
    const CONFIG = {
        PAGE_SIZE: 12,
        TAGS: ['魔法', '热血', '治愈', '腹黑', '温柔', '高冷', '傲娇', '软萌', '御姐', '正太', 'LOLI', '兽耳', '机械', '异世界', '校园', '奇幻', '科幻', '古风'],
        DB: { USERS: 'oc_users', OCS: 'oc_ocs', COMMENTS: 'oc_comments', REQUESTS: 'oc_requests', WORLDS: 'oc_worlds', FAVORITES: 'oc_favorites', FOLLOWS: 'oc_follows', NOTIFICATIONS: 'oc_notifications', VIEWS: 'oc_views', SETTINGS: 'oc_settings', CURRENT_USER: 'oc_current_user', RECENTLY_VIEWED: 'oc_recently_viewed' }
    };
    
    let currentUser = null, currentOC = null, currentPage = 1, totalPages = 1, currentMode = 'all';
    
    function $(id) { return document.getElementById(id); }
    function $$(sel) { return document.querySelector(sel); }
    function $All(sel) { return document.querySelectorAll(sel); }
    function getItem(key) { try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; } }
    function setItem(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
    
    function formatTime(dateStr) {
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
        $All('.view').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
        const view = $(viewName + '-view');
        if (view) { view.classList.add('active'); view.style.display = 'block'; }
        window.scrollTo(0, 0);
    }
    
    function applyTheme() {
        const settings = getItem(CONFIG.DB.SETTINGS) || { theme: 'light' };
        document.body.setAttribute('data-theme', settings.theme);
        if ($('theme-toggle')) $('theme-toggle').textContent = settings.theme === 'light' ? '🌙' : '☀️';
    }
    
    function initData() {
        if (!getItem(CONFIG.DB.USERS)) {
            setItem(CONFIG.DB.USERS, [{id: 'u_demo', nickname: 'Demo', email: 'demo@ocworld.com', password: 'demo123', role: 'author', bio: '欢迎体验OC世界', avatar: '', createdAt: new Date().toISOString()}]);
        }
        if (!getItem(CONFIG.DB.OCS)) {
            setItem(CONFIG.DB.OCS, [
                {id: 'oc1', name: '星灵', image: '', description: '来自星空的精灵族少女，性格温柔开朗，擅长星光魔法。', tags: ['精灵', '魔法', '温柔'], authorId: 'u_demo', authorName: 'Demo', relatedOCs: [], worldId: 'w1', views: 156, likes: 23, createdAt: new Date().toISOString()},
                {id: 'oc2', name: '暗影刺客', image: '', description: '神秘的暗影刺客，行踪诡秘。', tags: ['刺客', '暗影', '腹黑'], authorId: 'u_demo', authorName: 'Demo', relatedOCs: [], worldId: 'w1', views: 89, likes: 15, createdAt: new Date().toISOString()},
                {id: 'oc3', name: '炎之勇者', image: '', description: '使用火焰的勇者，性格热血冲动。', tags: ['勇者', '火焰', '热血'], authorId: 'u_demo', authorName: 'Demo', relatedOCs: [], views: 234, likes: 45, createdAt: new Date().toISOString()}
            ]);
        }
        if (!getItem(CONFIG.DB.WORLDS)) {
            setItem(CONFIG.DB.WORLDS, [{id: 'w1', name: '星辰帝国', description: '充满魔法的奇幻世界', cover: '', ownerId: 'u_demo', ocCount: 2, createdAt: new Date().toISOString()}]);
        }
        ['COMMENTS', 'REQUESTS', 'FAVORITES', 'FOLLOWS', 'NOTIFICATIONS', 'VIEWS', 'SETTINGS', 'RECENTLY_VIEWED'].forEach(k => {
            if (!getItem(CONFIG.DB[k])) setItem(CONFIG.DB[k], k === 'FOLLOWS' ? { following: [], followers: [] } : k === 'SETTINGS' ? { theme: 'light' } : []);
        });
    }
    
    function getCurrentUser() { return getItem(CONFIG.DB.CURRENT_USER); }
    
    function doLogin() {
        const email = $('login-email').value.trim();
        const password = $('login-password').value;
        if (!email || !password) { showToast('请输入邮箱和密码', 'error'); return; }
        const users = getItem(CONFIG.DB.USERS) || [];
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) { showToast('邮箱或密码错误', 'error'); return; }
        if ($('remember-me').checked) localStorage.setItem('remember_email', email);
        setItem(CONFIG.DB.CURRENT_USER, user);
        currentUser = user;
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('欢迎回来，' + (user.nickname || user.email), 'success');
    }
    
    function doRegister() {
        const nickname = $('reg-nickname').value.trim();
        const email = $('reg-email').value.trim();
        const password = $('reg-password').value;
        const password2 = $('reg-password2').value;
        const role = $$('input[name="reg-role"]:checked')?.value || 'visitor';
        if (!nickname || !email || !password) { showToast('请填写所有必填项', 'error'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('请输入有效邮箱', 'error'); return; }
        if (password.length < 6) { showToast('密码至少6位', 'error'); return; }
        if (password !== password2) { showToast('两次密码不一致', 'error'); return; }
        const users = getItem(CONFIG.DB.USERS) || [];
        if (users.find(u => u.email === email)) { showToast('该邮箱已被注册', 'error'); return; }
        const newUser = { id: genId('u'), nickname, email, password, role, bio: '', avatar: '', createdAt: new Date().toISOString() };
        users.push(newUser); setItem(CONFIG.DB.USERS, users);
        setItem(CONFIG.DB.CURRENT_USER, newUser);
        currentUser = newUser;
        applyTheme(); updateUserInfo(); renderOClist(); showView('hall');
        showToast('注册成功！', 'success');
    }
    
    function doLogout() {
        localStorage.removeItem(CONFIG.DB.CURRENT_USER);
        currentUser = null;
        showView('auth');
    }
    
    function updateUserInfo() {
        if (!currentUser) return;
        const roleText = currentUser.role === 'author' ? '作者' : '游客';
        const displayName = currentUser.nickname || currentUser.email.split('@')[0];
        $All('.user-avatar').forEach(el => { el.textContent = currentUser.avatar || '👤'; });
        if ($('dropdown-nickname')) $('dropdown-nickname').textContent = displayName;
        if ($('dropdown-role')) $('dropdown-role').textContent = roleText;
        if ($('create-oc-btn')) $('create-oc-btn').style.display = currentUser.role === 'author' ? 'block' : 'none';
        updateNotificationBadge();
    }
    
    function addNotification(userId, text, type) {
        const notifs = getItem(CONFIG.DB.NOTIFICATIONS) || [];
        notifs.unshift({ id: genId('notif'), userId, text, type, read: false, createdAt: new Date().toISOString() });
        setItem(CONFIG.DB.NOTIFICATIONS, notifs.slice(0, 100));
    }
    
    function getNotifications() { return currentUser ? (getItem(CONFIG.DB.NOTIFICATIONS) || []).filter(n => n.userId === currentUser.id) : []; }
    
    function updateNotificationBadge() {
        const unread = getNotifications().filter(n => !n.read).length;
        if ($('notif-badge')) { $('notif-badge').textContent = unread; $('notif-badge').style.display = unread > 0 ? 'block' : 'none'; }
    }
    
    function renderNotifications() {
        const notifs = getNotifications();
        const container = $('notifications-list');
        container.innerHTML = notifs.length ? notifs.map(n => `<div class="notification-item"><div class="notification-icon">${n.type==='评论'?'💬':n.type==='关注'?'👤':'📋'}</div><div class="notification-content"><div class="notification-text">${escapeHtml(n.text)}</div><div class="notification-time">${formatTime(n.createdAt)}</div></div></div>`).join('') : '<div class="empty-state"><span>🔔</span><p>暂无通知</p></div>';
        notifs.forEach(n => n.read = true);
        setItem(CONFIG.DB.NOTIFICATIONS, notifs);
        updateNotificationBadge();
    }
    
    function addRecentlyViewed(ocId) {
        let recent = getItem(CONFIG.DB.RECENTLY_VIEWED) || [];
        recent = recent.filter(id => id !== ocId);
        recent.unshift(ocId);
        setItem(CONFIG.DB.RECENTLY_VIEWED, recent.slice(0, 20));
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
        let ocs = getItem(CONFIG.DB.OCS) || [];
        if (currentMode === 'trending') { ocs.sort((a, b) => (b.likes||0) - (a.likes||0)); }
        else if (currentMode === 'recent') { const recent = getItem(CONFIG.DB.RECENTLY_VIEWED) || []; ocs = recent.map(id => ocs.find(o => o.id === id)).filter(o => o); }
        else if (filter?.myOnly && currentUser) { ocs = ocs.filter(o => o.authorId === currentUser.id); }
        
        if (filter?.search) {
            const s = filter.search.toLowerCase();
            const type = $('search-type')?.value || 'all';
            ocs = ocs.filter(o => {
                if (type === 'name') return o.name.toLowerCase().includes(s);
                if (type === 'author') return o.authorName.toLowerCase().includes(s);
                if (type === 'tag') return o.tags.some(t => t.toLowerCase().includes(s));
                return o.name.toLowerCase().includes(s) || o.authorName.toLowerCase().includes(s) || o.tags.some(t => t.toLowerCase().includes(s));
            });
        }
        
        if (currentMode !== 'trending' && currentMode !== 'recent') {
            const sort = $('sort-by')?.value || 'latest';
            if (sort === 'latest') ocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            else if (sort === 'popular') ocs.sort((a, b) => (b.likes||0) - (a.likes||0));
            else if (sort === 'name') ocs.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        }
        
        totalPages = Math.ceil(ocs.length / CONFIG.PAGE_SIZE);
        if (currentPage > totalPages) currentPage = 1;
        const start = (currentPage - 1) * CONFIG.PAGE_SIZE;
        ocs = ocs.slice(start, start + CONFIG.PAGE_SIZE);
        
        const grid = $('oc-grid');
        grid.innerHTML = ocs.length ? ocs.map(oc => `<div class="oc-card" data-id="${oc.id}"><div class="oc-card-image">${oc.image ? '<img src="'+escapeHtml(oc.image)+'">' : '🎭'}</div><div class="oc-card-body"><h3 class="oc-card-name">${escapeHtml(oc.name)}</h3><p class="oc-card-author">作者: ${escapeHtml(oc.authorName)}</p><div class="oc-card-tags">${oc.tags.slice(0,3).map(t => '<span class="tag">'+t+'</span>').join('')}</div></div></div>`).join('') : '<div class="empty-state" style="grid-column:1/-1"><span>📦</span><p>暂无OC</p></div>';
        renderPagination();
    }
    
    function renderQuickTags() {
        const container = $('quick-tags');
        if (!container) return;
        container.innerHTML = CONFIG.TAGS.slice(0, 10).map(tag => `<span class="filter-tag" data-tag="${tag}">${tag}</span>`).join('');
    }
    
    function showOCDetail(ocId) {
        const ocs = getItem(CONFIG.DB.OCS) || [];
        currentOC = ocs.find(o => o.id === ocId);
        if (!currentOC) { showToast('未找到该OC', 'error'); return; }
        
        addRecentlyViewed(ocId);
        const views = getItem(CONFIG.DB.VIEWS) || {};
        views[ocId] = (views[ocId] || 0) + 1;
        setItem(CONFIG.DB.VIEWS, views);
        currentOC.views = views[ocId];
        
        $('oc-image').innerHTML = currentOC.image ? '<img src="'+escapeHtml(currentOC.image)+'">' : '🎭';
        $('oc-name').textContent = currentOC.name;
        $('oc-author').textContent = currentOC.authorName;
        $('oc-description').textContent = currentOC.description || '暂无背景设定';
        $('oc-views').textContent = currentOC.views || 0;
        $('oc-likes').textContent = currentOC.likes || 0;
        
        const comments = getItem(CONFIG.DB.COMMENTS) || [];
        const ocComments = comments.filter(c => c.ocId === ocId);
        $('oc-comments').textContent = ocComments.length;
        $('comment-count').textContent = '(' + ocComments.length + ')';
        
        $('oc-tags').innerHTML = currentOC.tags.map(t => '<span class="tag">'+t+'</span>').join('');
        
        const worlds = getItem(CONFIG.DB.WORLDS) || [];
        const world = worlds.find(w => w.id === currentOC.worldId);
        $('oc-world-list').innerHTML = world ? '<span class="world-tag" onclick="showWorldDetail(\''+world.id+'\')">'+world.name+'</span>' : '<span style="color:#999">未加入世界观</span>';
        
        renderRelatedOCs();
        renderComments();
        
        $('author-name').textContent = currentOC.authorName;
        const authorOCs = ocs.filter(o => o.authorId === currentOC.authorId);
        $('author-oc-count').textContent = 'OC: ' + authorOCs.length;
        
        const users = getItem(CONFIG.DB.USERS) || [];
        const author = users.find(u => u.id === currentOC.authorId);
        $('author-avatar').textContent = author?.avatar || '👤';
        
        if ($('add-related-btn')) $('add-related-btn').style.display = (currentUser && currentUser.role === 'author') ? 'inline-block' : 'none';
        if ($('edit-oc-btn')) $('edit-oc-btn').style.display = (currentUser && currentUser.id === currentOC.authorId) ? 'inline-block' : 'none';
        if ($('delete-oc-btn')) $('delete-oc-btn').style.display = (currentUser && currentUser.id === currentOC.authorId) ? 'inline-block' : 'none';
        
        updateFavoriteBtn();
        updateFollowBtn();
        
        showView('detail');
    }
    
    function renderRelatedOCs() {
        const container = $('related-ocs');
        const ocs = getItem(CONFIG.DB.OCS) || [];
        if (!currentOC.relatedOCs?.length) { container.innerHTML = '<p style="color:#999">暂无关联</p>'; return; }
        container.innerHTML = currentOC.relatedOCs.map(r => {
            const roc = ocs.find(o => o.id === r.ocId);
            if (!roc) return '';
            return '<span class="related-oc" data-id="'+roc.id+'">' + (roc.image ? '<img src="'+escapeHtml(roc.image)+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:8px">' : '🎭') + escapeHtml(roc.name) + '</span>';
        }).join('');
    }
    
    function renderComments() {
        const container = $('comments-list');
        const comments = getItem(CONFIG.DB.COMMENTS) || [];
        const ocComments = comments.filter(c => c.ocId === currentOC.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        container.innerHTML = ocComments.length ? ocComments.map(c => '<div class="comment-item"><div class="comment-header"><span class="comment-author">'+escapeHtml(c.authorName)+'</span><span class="comment-time">'+formatTime(c.createdAt)+'</span></div><div class="comment-content">'+escapeHtml(c.content)+'</div></div>').join('') : '<p style="text-align:center;color:#999">暂无评论</p>';
    }
    
    function toggleFavorite() {
        if (!currentUser || !currentOC) return;
        const favs = getItem(CONFIG.DB.FAVORITES) || [];
        const idx = favs.findIndex(f => f.userId === currentUser.id && f.ocId === currentOC.id);
        if (idx >= 0) { favs.splice(idx, 1); showToast('已取消', 'info'); }
        else { favs.push({ userId: currentUser.id, ocId: currentOC.id, createdAt: new Date().toISOString() }); showToast('已收藏', 'success'); }
        setItem(CONFIG.DB.FAVORITES, favs);
        updateFavoriteBtn();
    }
    
    function updateFavoriteBtn() {
        if (!currentUser || !currentOC || !$('favorite-btn')) return;
        const favs = getItem(CONFIG.DB.FAVORITES) || [];
        const isFav = favs.some(f => f.userId === currentUser.id && f.ocId === currentOC.id);
        $('favorite-btn').textContent = isFav ? '💔' : '❤️';
    }
    
    function renderFavorites() {
        const favs = getItem(CONFIG.DB.FAVORITES) || [];
        const ocs = getItem(CONFIG.DB.OCS) || [];
        const myFavs = favs.filter(f => f.userId === currentUser.id).map(f => ocs.find(o => o.id === f.ocId)).filter(o => o);
        const grid = $('favorites-grid');
        grid.innerHTML = myFavs.length ? myFavs.map(oc => '<div class="oc-card" data-id="'+oc.id+'"><div class="oc-card-image">'+(oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭')+'</div><div class="oc-card-body"><h3 class="oc-card-name">'+escapeHtml(oc.name)+'</h3><p class="oc-card-author">作者: '+escapeHtml(oc.authorName)+'</p><div class="oc-card-tags">'+oc.tags.slice(0,3).map(t=>'<span class="tag">'+t+'</span>').join('')+'</div></div></div>').join('') : '<div class="empty-state" style="grid-column:1/-1"><span>❤️</span><p>暂无收藏</p></div>';
    }
    
    function toggleFollow() {
        if (!currentUser || !currentOC) return;
        if (currentUser.id === currentOC.authorId) { showToast('不能关注自己', 'warning'); return; }
        const follows = getItem(CONFIG.DB.FOLLOWS) || { following: [], followers: [] };
        const idx = follows.following.indexOf(currentOC.authorId);
        if (idx >= 0) { follows.following.splice(idx, 1); follows.followers = follows.followers.filter(f => f !== currentUser.id); showToast('已取消', 'info'); }
        else { follows.following.push(currentOC.authorId); follows.followers.push(currentUser.id); showToast('已关注', 'success'); addNotification(currentOC.authorId, currentUser.nickname + ' 关注了你', '关注'); }
        setItem(CONFIG.DB.FOLLOWS, follows);
        updateFollowBtn();
    }
    
    function updateFollowBtn() {
        if (!currentUser || !currentOC || !$('follow-author')) return;
        const follows = getItem(CONFIG.DB.FOLLOWS) || { following: [] };
        const isFollowing = follows.following.includes(currentOC.authorId);
        $('follow-author').textContent = isFollowing ? '✓ 已关注' : '+ 关注';
    }
    
    function deleteOC() {
        if (!currentUser || !currentOC || currentUser.id !== currentOC.authorId) return;
        showConfirm('删除OC', '确定删除？', confirmed => {
            if (confirmed) {
                let ocs = getItem(CONFIG.DB.OCS) || [];
                ocs = ocs.filter(o => o.id !== currentOC.id);
                setItem(CONFIG.DB.OCS, ocs);
                let comments = getItem(CONFIG.DB.COMMENTS) || [];
                comments = comments.filter(c => c.ocId !== currentOC.id);
                setItem(CONFIG.DB.COMMENTS, comments);
                showToast('已删除', 'success');
                renderOClist();
                showView('hall');
            }
        });
    }
    
    function submitComment() {
        const content = $('comment-input').value.trim();
        if (!content) { showToast('请输入内容', 'error'); return; }
        if (!currentUser) { showToast('请先登录', 'error'); return; }
        const comments = getItem(CONFIG.DB.COMMENTS) || [];
        comments.push({ id: genId('c'), ocId: currentOC.id, authorId: currentUser.id, authorName: currentUser.nickname || currentUser.email.split('@')[0], content, createdAt: new Date().toISOString() });
        setItem(CONFIG.DB.COMMENTS, comments);
        $('comment-input').value = '';
        renderComments();
        showOCDetail(currentOC.id);
        if (currentUser.id !== currentOC.authorId) addNotification(currentOC.authorId, currentUser.nickname + ' 评论了你的OC', '评论');
        showToast('评论成功', 'success');
    }
    
    function openCreateOC() {
        if (!currentUser || currentUser.role !== 'author') { showToast('只有作者才能创建', 'error'); return; }
        const worlds = getItem(CONFIG.DB.WORLDS) || [];
        $('oc-world-select').innerHTML = '<option value="">无</option>' + worlds.map(w => '<option value="'+w.id+'">'+escapeHtml(w.name)+'</option>').join('');
        $('modal-title').textContent = '创建OC';
        $('oc-form').reset();
        $('oc-modal').classList.add('active');
    }
    
    function saveOC(e) {
        e.preventDefault();
        const name = $('oc-name-input').value.trim();
        const image = $('oc-image-input').value.trim();
        const desc = $('oc-desc-input').value.trim();
        const tagsStr = $('oc-tags-input').value.trim();
        const worldId = $('oc-world-select').value;
        if (!name) { showToast('请输入名称', 'error'); return; }
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
        const newOC = { id: genId('oc'), name, image, description: desc, tags, authorId: currentUser.id, authorName: currentUser.nickname || currentUser.email.split('@')[0], relatedOCs: [], worldId, views: 0, likes: 0, createdAt: new Date().toISOString() };
        const ocs = getItem(CONFIG.DB.OCS) || [];
        ocs.push(newOC);
        setItem(CONFIG.DB.OCS, ocs);
        if (worldId) { const worlds = getItem(CONFIG.DB.WORLDS) || []; const world = worlds.find(w => w.id === worldId); if (world) { world.ocCount = (world.ocCount || 0) + 1; setItem(CONFIG.DB.WORLDS, worlds); } }
        closeOCModal();
        renderOClist();
        showView('hall');
        showToast('创建成功！', 'success');
    }
    
    function closeOCModal() { $('oc-modal').classList.remove('active'); }
    
    function renderWorlds() {
        const worlds = getItem(CONFIG.DB.WORLDS) || [];
        const grid = $('world-grid');
        grid.innerHTML = worlds.length ? worlds.map(w => '<div class="world-card" data-id="'+w.id+'"><div class="world-card-cover">'+(w.cover?'<img src="'+escapeHtml(w.cover)+'">':'🌍')+'</div><div class="world-card-body"><h3 class="world-card-name">'+escapeHtml(w.name)+'</h3><p class="world-card-desc">'+escapeHtml(w.description||'')+'</p></div></div>').join('') : '<div class="empty-state" style="grid-column:1/-1"><span>🌍</span><p>暂无世界观</p></div>';
    }
    
    window.showWorldDetail = function(worldId) {
        const ocs = getItem(CONFIG.DB.OCS) || [];
        const worldOCs = ocs.filter(o => o.worldId === worldId);
        const grid = $('oc-grid');
        grid.innerHTML = worldOCs.length ? worldOCs.map(oc => '<div class="oc-card" data-id="'+oc.id+'"><div class="oc-card-image">'+(oc.image?'<img src="'+escapeHtml(oc.image)+'">':'🎭')+'</div><div class="oc-card-body"><h3 class="oc-card-name">'+escapeHtml(oc.name)+'</h3><p class="oc-card-author">作者: '+escapeHtml(oc.authorName)+'</p></div></div>').join('') : '<div class="empty-state"><span>📦</span><p>暂无OC</p></div>';
        showView('hall');
    };
    
    function openWorldModal() { $('world-form').reset(); $('world-modal').classList.add('active'); }
    function closeWorldModal() { $('world-modal').classList.remove('active'); }
    
    function saveWorld(e) {
        e.preventDefault();
        const name = $('world-name-input').value.trim();
        const desc = $('world-desc-input').value.trim();
        if (!name) { showToast('请输入名称', 'error'); return; }
        const newWorld = { id: genId('w'), name, description: desc, ownerId: currentUser.id, ocCount: 0, createdAt: new Date().toISOString() };
        const worlds = getItem(CONFIG.DB.WORLDS) || [];
        worlds.push(newWorld);
        setItem(CONFIG.DB.WORLDS, worlds);
        closeWorldModal();
        renderWorlds();
        showToast('创建成功！', 'success');
    }
    
    function openRelatedModal() { $('related-modal').classList.add('active'); }
    function closeRelatedModal() { $('related-modal').classList.remove('active'); }
    
    function submitRelatedRequest() {
        const ocName = $('related-oc-name').value.trim();
        const reason = $('related-reason').value.trim();
        if (!ocName) { showToast('请输入名称', 'error'); return; }
        const ocs = getItem(CONFIG.DB.OCS) || [];
        const targetOC = ocs.find(o => o.name === ocName);
        if (!targetOC) { showToast('未找到', 'error'); return; }
        if (targetOC.id === currentOC.id) { showToast('不能关联自己', 'error'); return; }
        const requests = getItem(CONFIG.DB.REQUESTS) || [];
        requests.push({ id: genId('req'), fromUserId: currentUser.id, fromUserName: currentUser.nickname, toOCId: targetOC.id, toOCName: targetOC.name, fromOCId: currentOC.id, fromOCName: currentOC.name, reason, status: 'pending', createdAt: new Date().toISOString() });
        setItem(CONFIG.DB.REQUESTS, requests);
        closeRelatedModal();
        addNotification(targetOC.authorId, currentUser.nickname + ' 申请关联', '申请');
        showToast('已发送', 'success');
    }
    
    function openRequestsModal() { renderRequests('received'); $('requests-modal').classList.add('active'); }
    function closeRequestsModal() { $('requests-modal').classList.remove('active'); }
    
    function renderRequests(tab) {
        if (!currentUser) return;
        const requests = getItem(CONFIG.DB.REQUESTS) || [];
        const ocs = getItem(CONFIG.DB.OCS) || [];
        let filtered;
        if (tab === 'received') { const myOCIds = ocs.filter(o => o.authorId === currentUser.id).map(o => o.id); filtered = requests.filter(r => myOCIds.includes(r.fromOCId) && r.status === 'pending'); }
        else { filtered = requests.filter(r => r.fromUserId === currentUser.id); }
        const container = $('requests-content');
        container.innerHTML = filtered.length ? filtered.map(req => `<div class="request-item"><div class="request-header"><span>${escapeHtml(req.fromOCName)} → ${escapeHtml(req.toOCName)}</span><span class="request-status ${req.status}">${req.status==='pending'?'待审核':req.status==='approved'?'已同意':'已拒绝'}</span></div>${req.status==='pending' && tab==='received' ? '<div class="request-actions"><button class="primary-btn" onclick="handleRequest(\''+req.id+'\',\'approved\')">同意</button><button class="secondary-btn" onclick="handleRequest(\''+req.id+'\',\'rejected\')">拒绝</button></div>' : ''}</div>`).join('') : '<p style="text-align:center;color:#999">暂无</p>';
        $All('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    }
    
    window.handleRequest = function(reqId, status) {
        const requests = getItem(CONFIG.DB.REQUESTS) || [];
        const req = requests.find(r => r.id === reqId);
        if (!req) return;
        req.status = status;
        setItem(CONFIG.DB.REQUESTS, requests);
        if (status === 'approved') {
            const ocs = getItem(CONFIG.DB.OCS) || [];
            const fromOC = ocs.find(o => o.id === req.fromOCId);
            const toOC = ocs.find(o => o.id === req.toOCId);
            if (fromOC && toOC) {
                if (!fromOC.relatedOCs) fromOC.relatedOCs = [];
                if (!toOC.relatedOCs) toOC.relatedOCs = [];
                fromOC.relatedOCs.push({ocId: toOC.id, reason: req.reason});
                toOC.relatedOCs.push({ocId: fromOC.id, reason: req.reason});
                setItem(CONFIG.DB.OCS, ocs);
            }
        }
        addNotification(req.fromUserId, '申请已' + (status === 'approved' ? '通过' : '拒绝'), '申请');
        renderRequests('received');
    };
    
    function showProfile() {
        if (!currentUser) return;
        $('profile-nickname').textContent = currentUser.nickname || currentUser.email.split('@')[0];
        $('profile-email').textContent = currentUser.email;
        $('profile-role').textContent = currentUser.role === 'author' ? '作者' : '游客';
        $('profile-avatar').textContent = currentUser.avatar || '👤';
        const ocs = getItem(CONFIG.DB.OCS) || [];
        $('profile-oc-count').textContent = ocs.filter(o => o.authorId === currentUser.id).length;
        const follows = getItem(CONFIG.DB.FOLLOWS) || { followers: [] };
        $('profile-fans').textContent = follows.followers.length;
        $('edit-nickname').value = currentUser.nickname || '';
        $('edit-bio').value = currentUser.bio || '';
        showView('profile');
    }
    
    function saveProfile() {
        const nickname = $('edit-nickname').value.trim();
        const bio = $('edit-bio').value.trim();
        const users = getItem(CONFIG.DB.USERS) || [];
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx >= 0) { users[idx] = {...users[idx], nickname, bio}; setItem(CONFIG.DB.USERS, users); currentUser = users[idx]; setItem(CONFIG.DB.CURRENT_USER, currentUser); updateUserInfo(); showToast('保存成功', 'success'); }
    }
    
    function openShareModal() { $('share-link').value = window.location.href.split('?')[0] + '?oc=' + currentOC.id; $('share-modal').classList.add('active'); }
    function copyShareLink() { $('share-link').select(); document.execCommand('copy'); showToast('已复制', 'success'); }
    
    function changeTheme(theme) { const settings = getItem(CONFIG.DB.SETTINGS) || {}; settings.theme = theme; setItem(CONFIG.DB.SETTINGS, settings); applyTheme(); }
    
    function clearAllData() { showConfirm('清空数据', '确定清空？不可恢复！', confirmed => { if (confirmed) { Object.values(CONFIG.DB).forEach(key => localStorage.removeItem(key)); location.reload(); } }); }
    
    function bindEvents() {
        $('theme-toggle')?.addEventListener('click', () => { const s = getItem(CONFIG.DB.SETTINGS) || {theme:'light'}; changeTheme(s.theme === 'light' ? 'dark' : 'light'); });
        $('login-btn').addEventListener('click', doLogin);
        $('register-btn').addEventListener('click', doRegister);
        $('show-register').addEventListener('click', e => { e.preventDefault(); $('login-form').classList.remove('active'); $('register-form').classList.add('active'); });
        $('show-login').addEventListener('click', e => { e.preventDefault(); $('register-form').classList.remove('active'); $('login-form').classList.add('active'); });
        if (localStorage.getItem('remember_email')) { $('login-email').value = localStorage.getItem('remember_email'); $('remember-me').checked = true; }
        $All('[data-action="logout"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); doLogout(); }));
        $All('.nav-item').forEach(el => { el.addEventListener('click', e => { e.preventDefault(); $All('.nav-item').forEach(i => i.classList.remove('active')); el.classList.add('active'); currentPage = 1; const page = el.dataset.page; if (page === 'hall') { currentMode = 'all'; renderOClist(); showView('hall'); } else if (page === 'trending') { currentMode = 'trending'; renderOClist(); showView('hall'); } else if (page === 'world') { renderWorlds(); showView('world'); } }); });
        $('search-btn').addEventListener('click', () => { currentPage = 1; currentMode = 'all'; renderOClist({ search: $('search-input').value.trim() }); });
        $('search-input').addEventListener('keypress', e => { if (e.key === 'Enter') { currentPage = 1; currentMode = 'all'; renderOClist({ search: this.value.trim() }); } });
        $('sort-by').addEventListener('change', () => { currentPage = 1; renderOClist(); });
        $('filter-my-ocs').addEventListener('change', e => { currentPage = 1; renderOClist({ myOnly: e.target.checked }); });
        $('quick-tags').addEventListener('click', e => { if (e.target.classList.contains('filter-tag')) { $('search-input').value = e.target.dataset.tag; currentPage = 1; currentMode = 'all'; renderOClist({ search: e.target.dataset.tag }); } });
        $All('[data-action="profile"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showProfile(); }));
        $All('[data-action="my-ocs"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); currentPage = 1; renderOClist({ myOnly: true }); showView('hall'); }));
        $All('[data-action="favorites"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); renderFavorites(); showView('favorites'); }));
        $All('[data-action="settings"]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showView('settings'); }));
        $('notification-bell').addEventListener('click', () => { renderNotifications(); showView('notifications'); });
        $('create-oc-btn').addEventListener('click', openCreateOC);
        $('cancel-oc-btn').addEventListener('click', closeOCModal);
        $('oc-form').addEventListener('submit', saveOC);
        $('create-world-btn').addEventListener('click', openWorldModal);
        $('create-world-modal-btn').addEventListener('click', openWorldModal);
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
        $All('.tab-btn').forEach(btn => btn.addEventListener('click', function() { if (this.dataset.tab) renderRequests(this.dataset.tab); }));
        $('save-profile-btn').addEventListener('click', saveProfile);
        $All('input[name="theme"]').forEach(radio => radio.addEventListener('change', function() { changeTheme(this.value); }));
        $('clear-data-btn').addEventListener('click', clearAllData);
        $('confirm-cancel').addEventListener('click', () => $('confirm-modal').classList.remove('active'));
        $All('.modal').forEach(modal => { modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); }); });
        $('login-password').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
        $('oc-grid').addEventListener('click', e => { const card = e.target.closest('.oc-card'); if (card) showOCDetail(card.dataset.id); });
        $('world-grid')?.addEventListener('click', e => { const card = e.target.closest('.world-card'); if (card) window.showWorldDetail(card.dataset.id); });
        document.addEventListener('click', e => { if (e.target.classList.contains('related-oc')) showOCDetail(e.target.dataset.id); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') $All('.modal.active').forEach(m => m.classList.remove('active')); if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); $('search-input')?.focus(); } });
    }
    
    function init() {
        initData();
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
