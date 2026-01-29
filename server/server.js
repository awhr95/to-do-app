import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TODOS_FILE = join(__dirname, 'todos.json');
const USERS_FILE = join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// File helpers
async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = await readJSON(USERS_FILE);

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    email,
    password: hashedPassword,
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeJSON(USERS_FILE, users);

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ id: user.id, email: user.email, name: user.name });
});

// Todo routes (protected)
app.get('/api/todos', authenticateToken, async (req, res) => {
  const todos = await readJSON(TODOS_FILE);
  const userTodos = todos.filter(t => t.userId === req.user.id);
  res.json(userTodos);
});

app.post('/api/todos', authenticateToken, async (req, res) => {
  const todos = await readJSON(TODOS_FILE);
  const today = new Date().toISOString().split('T')[0];
  const newTodo = {
    id: Date.now(),
    userId: req.user.id,
    title: req.body.title || '',
    description: req.body.description || '',
    status: req.body.status || 'new',
    startDate: today,
    dueDate: req.body.dueDate || today,
    createdAt: new Date().toISOString()
  };
  todos.push(newTodo);
  await writeJSON(TODOS_FILE, todos);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  const todos = await readJSON(TODOS_FILE);
  const index = todos.findIndex(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const { userId, id, ...updates } = req.body;
  todos[index] = { ...todos[index], ...updates };
  await writeJSON(TODOS_FILE, todos);
  res.json(todos[index]);
});

app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  const todos = await readJSON(TODOS_FILE);
  const index = todos.findIndex(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  await writeJSON(TODOS_FILE, todos);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
