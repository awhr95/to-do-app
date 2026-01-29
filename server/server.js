import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, 'todos.json');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

async function readTodos() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeTodos(todos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2));
}

// Get all todos
app.get('/api/todos', async (req, res) => {
  const todos = await readTodos();
  res.json(todos);
});

// Create a todo
app.post('/api/todos', async (req, res) => {
  const todos = await readTodos();
  const newTodo = {
    id: Date.now(),
    text: req.body.text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(newTodo);
  await writeTodos(todos);
  res.status(201).json(newTodo);
});

// Update a todo
app.put('/api/todos/:id', async (req, res) => {
  const todos = await readTodos();
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  todos[index] = { ...todos[index], ...req.body };
  await writeTodos(todos);
  res.json(todos[index]);
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  const todos = await readTodos();
  const filtered = todos.filter(t => t.id !== parseInt(req.params.id));
  if (filtered.length === todos.length) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  await writeTodos(filtered);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
