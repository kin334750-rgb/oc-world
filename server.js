const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const Tables = {
  users: 'users',
  worlds: 'worlds',
  ocs: 'ocs',
  comments: 'comments',
  favorites: 'favorites',
  follows: 'follows',
  notifications: 'notifications',
  messages: 'messages',
  dm_messages: 'dm_messages',
  friends: 'friends',
  reports: 'reports',
  user_settings: 'user_settings'
};

async function supabaseRequest(table, method = 'GET', query = '', body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const options = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : ''
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  return res.json();
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: '无效的令牌' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nickname, email, password } = req.body;
    if (!nickname || !email || !password) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }
    const existingUsers = await supabaseRequest('users', 'GET', `?email=eq.${encodeURIComponent(email)}`);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      nickname,
      email,
      password: hashedPassword,
      role: 'author',
      bio: '',
      avatar: '',
      gender: '',
      birthday: '',
      location: '',
      website: '',
      github: '',
      twitter: '',
      bg_image: '',
      sq1: '',
      sa1: '',
      sq2: '',
      sa2: '',
      created_at: new Date().toISOString()
    };
    const created = await supabaseRequest('users', 'POST', '', newUser);
    await supabaseRequest('user_settings', 'POST', '', { user_id: newUser.id, notifications_enabled: 1 });
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }
    const users = await supabaseRequest('users', 'GET', `?email=eq.${encodeURIComponent(email)}`);
    if (!users || users.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const users = await supabaseRequest('users', 'GET', `?id=eq.${req.user.id}`);
    if (!users || users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const { password: _, ...userWithoutPassword } = users[0];
    res.json(userWithoutPassword);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/guest', (req, res) => {
  const guestUser = {
    id: 'guest_' + Date.now(),
    nickname: '游客',
    email: '',
    password: '',
    role: 'guest',
    bio: '',
    avatar: '',
    gender: '',
    birthday: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    bg_image: '',
    sq1: '',
    sa1: '',
    sq2: '',
    sa2: '',
    created_at: new Date().toISOString()
  };
  const token = jwt.sign({ id: guestUser.id, role: 'guest' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: guestUser, token });
});

const publicTables = ['users', 'worlds', 'ocs', 'comments'];
const protectedTables = ['favorites', 'follows', 'notifications', 'messages', 'dm_messages', 'friends', 'reports', 'user_settings'];

publicTables.forEach(table => {
  const tableName = Tables[table];

  app.get(`/api/${table}`, async (req, res) => {
    try {
      const data = await supabaseRequest(tableName);
      if (table === 'users') {
        const sanitized = (data || []).map(u => { const { password, ...rest } = u; return rest; });
        return res.json(sanitized);
      }
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

protectedTables.forEach(table => {
  const tableName = Tables[table];

  app.get(`/api/${table}`, authMiddleware, async (req, res) => {
    try {
      const query = req.url.split('?')[1] || '';
      const data = await supabaseRequest(tableName, 'GET', `?${query}`);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(`/api/${table}`, authMiddleware, async (req, res) => {
    try {
      const data = await supabaseRequest(tableName, 'POST', '', req.body);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch(`/api/${table}`, authMiddleware, async (req, res) => {
    try {
      const { eq, ...rest } = req.query;
      const query = Object.keys(rest).map(k => `${k}=${rest[k]}`).join('&');
      const data = await supabaseRequest(tableName, 'PATCH', `?${query}`, req.body);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete(`/api/${table}`, authMiddleware, async (req, res) => {
    try {
      const query = Object.keys(req.query).map(k => `${k}=${req.query[k]}`).join('&');
      const data = await supabaseRequest(tableName, 'DELETE', `?${query}`);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

app.post('/api/ocs', authMiddleware, async (req, res) => {
  try {
    const data = await supabaseRequest('ocs', 'POST', '', req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/ocs', authMiddleware, async (req, res) => {
  try {
    const { eq, ...rest } = req.query;
    const query = Object.keys(rest).map(k => `${k}=${rest[k]}`).join('&');
    const data = await supabaseRequest('ocs', 'PATCH', `?${query}`, req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/ocs', authMiddleware, async (req, res) => {
  try {
    const query = Object.keys(req.query).map(k => `${k}=${req.query[k]}`).join('&');
    const data = await supabaseRequest('ocs', 'DELETE', `?${query}`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/worlds', authMiddleware, async (req, res) => {
  try {
    const data = await supabaseRequest('worlds', 'POST', '', req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
