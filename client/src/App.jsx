import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './App.css';

const API_URL = 'http://localhost:3001/api';

const COLUMNS = [
  { id: 'new', title: 'New' },
  { id: 'working', title: 'Working On' },
  { id: 'complete', title: 'Complete' },
];

// Auth helpers
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth Forms Component
function AuthForms({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Kanban Board</h1>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="auth-input"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="auth-input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="auth-input"
            required
            minLength={6}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="auth-switch-btn">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

function TodoCard({ todo, onUpdate, onDelete, isDragging }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(todo.id, editData);
    setIsEditing(false);
  };

  const isOverdue = new Date(todo.dueDate) < new Date(new Date().toISOString().split('T')[0]) && todo.status !== 'complete';

  if (isEditing) {
    return (
      <div className="todo-card editing" ref={setNodeRef} style={style}>
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          placeholder="Title"
          className="edit-input"
        />
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Description"
          className="edit-textarea"
        />
        <label className="date-label">
          Due Date:
          <input
            type="date"
            value={editData.dueDate}
            onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
            className="edit-date"
          />
        </label>
        <div className="edit-actions">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`todo-card ${isOverdue ? 'overdue' : ''}`}
    >
      <div className="card-header" {...attributes} {...listeners}>
        <span className="drag-handle">⋮⋮</span>
        <h3 className="card-title">{todo.title || 'Untitled'}</h3>
      </div>
      {todo.description && <p className="card-description">{todo.description}</p>}
      <div className="card-dates">
        <span className="start-date">Started: {todo.startDate}</span>
        <span className={`due-date ${isOverdue ? 'overdue-text' : ''}`}>Due: {todo.dueDate}</span>
      </div>
      <div className="card-actions">
        <button onClick={() => setIsEditing(true)} className="edit-btn">Edit</button>
        <button onClick={() => onDelete(todo.id)} className="delete-btn">Delete</button>
      </div>
    </div>
  );
}

function KanbanColumn({ column, todos, onUpdate, onDelete, activeId }) {
  const columnTodos = todos.filter(t => t.status === column.id);
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className={`kanban-column ${isOver ? 'column-over' : ''}`}>
      <div className="column-header">
        <h2>{column.title}</h2>
        <span className="todo-count">{columnTodos.length}</span>
      </div>
      <SortableContext items={columnTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="column-content" ref={setNodeRef}>
          {columnTodos.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isDragging={activeId === todo.id}
            />
          ))}
          {columnTodos.length === 0 && (
            <div className="empty-column">Drop tasks here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanBoard({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch(`${API_URL}/todos`, {
        headers: authHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      const res = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(newTodo),
      });
      const todo = await res.json();
      setTodos([...todos, todo]);
      setNewTodo({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  }

  async function updateTodo(id, updates) {
    try {
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setTodos(todos.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  }

  async function deleteTodo(id) {
    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedId = active.id;
    const draggedTodo = todos.find(t => t.id === draggedId);
    if (!draggedTodo) return;

    updateTodo(draggedId, { status: draggedTodo.status });
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id;
    const overId = over.id;

    const draggedTodo = todos.find(t => t.id === draggedId);
    if (!draggedTodo) return;

    let targetStatus = null;

    const column = COLUMNS.find(c => c.id === overId);
    if (column) {
      targetStatus = column.id;
    } else {
      const overTodo = todos.find(t => t.id === overId);
      if (overTodo) {
        targetStatus = overTodo.status;
      }
    }

    if (targetStatus && draggedTodo.status !== targetStatus) {
      setTodos(prevTodos =>
        prevTodos.map(t =>
          t.id === draggedId ? { ...t, status: targetStatus } : t
        )
      );
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kanban Board</h1>
        <div className="header-actions">
          <span className="user-name">Hi, {user.name}</span>
          <button onClick={() => setShowForm(!showForm)} className="add-btn">
            {showForm ? 'Cancel' : '+ Add Task'}
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={addTodo} className="add-form">
          <input
            type="text"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            placeholder="Task title"
            className="form-input"
            autoFocus
          />
          <textarea
            value={newTodo.description}
            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
            placeholder="Description (optional)"
            className="form-textarea"
          />
          <label className="form-label">
            Due Date:
            <input
              type="date"
              value={newTodo.dueDate}
              onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
              className="form-date"
            />
          </label>
          <button type="submit" className="submit-btn">Add Task</button>
        </form>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="kanban-board">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              todos={todos}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTodo ? (
            <div className="todo-card dragging">
              <div className="card-header">
                <span className="drag-handle">⋮⋮</span>
                <h3 className="card-title">{activeTodo.title || 'Untitled'}</h3>
              </div>
              {activeTodo.description && <p className="card-description">{activeTodo.description}</p>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: authHeaders(),
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        removeToken();
      }
    } catch (err) {
      removeToken();
    } finally {
      setCheckingAuth(false);
    }
  }

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    removeToken();
    setUser(null);
  }

  if (checkingAuth) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <AuthForms onLogin={handleLogin} />;
  }

  return <KanbanBoard user={user} onLogout={handleLogout} />;
}

export default App;
