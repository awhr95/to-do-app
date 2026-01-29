import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { sequelize, User, Todo } from './models/index.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,
      name: name || email.split('@')[0],
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Todo routes (protected)
app.get('/api/todos', authenticateToken, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
    });
    res.json(todos);
  } catch (err) {
    console.error('Get todos error:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todo = await Todo.create({
      userId: req.user.id,
      title: req.body.title || '',
      description: req.body.description || '',
      status: req.body.status || 'new',
      startDate: today,
      dueDate: req.body.dueDate || today,
    });
    res.status(201).json(todo);
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const { userId, id, createdAt, ...updates } = req.body;
    await todo.update(updates);
    res.json(todo);
  } catch (err) {
    console.error('Update todo error:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Todo.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Database sync and server start
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models (creates tables if they don't exist)
    // In production, use migrations instead
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
