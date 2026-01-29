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

const API_URL = 'http://localhost:3001/api/todos';

const COLUMNS = [
  { id: 'new', title: 'New' },
  { id: 'working', title: 'Working On' },
  { id: 'complete', title: 'Complete' },
];

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

function App() {
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
      const res = await fetch(API_URL);
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
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
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
    const overId = over.id;

    // Find the dragged todo's current status in state
    const draggedTodo = todos.find(t => t.id === draggedId);
    if (!draggedTodo) return;

    // The status was already updated in handleDragOver, so just persist to server
    updateTodo(draggedId, { status: draggedTodo.status });
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id;
    const overId = over.id;

    const draggedTodo = todos.find(t => t.id === draggedId);
    if (!draggedTodo) return;

    // Determine the target column
    let targetStatus = null;

    // Check if hovering over a column directly
    const column = COLUMNS.find(c => c.id === overId);
    if (column) {
      targetStatus = column.id;
    } else {
      // Check if hovering over another todo card
      const overTodo = todos.find(t => t.id === overId);
      if (overTodo) {
        targetStatus = overTodo.status;
      }
    }

    // Update the status if it changed
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
        <button onClick={() => setShowForm(!showForm)} className="add-btn">
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
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

export default App;
