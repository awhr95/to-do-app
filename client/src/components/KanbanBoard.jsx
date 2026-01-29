import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import { COLUMNS } from '../utils/constants';
import * as api from '../utils/api';

export default function KanbanBoard({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [addFormColumn, setAddFormColumn] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    try {
      const data = await api.fetchTodos();
      setTodos(data);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        onLogout();
      } else {
        console.error('Failed to fetch todos:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTodo(todoData) {
    try {
      const todo = await api.createTodo(todoData);
      setTodos(prev => [...prev, todo]);
      return todo;
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  }

  async function handleUpdateTodo(id, updates) {
    try {
      const updated = await api.updateTodo(id, updates);
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  }

  async function handleDeleteTodo(id) {
    try {
      await api.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active } = event;
    setActiveId(null);

    const draggedTodo = todos.find(t => t.id === active.id);
    if (draggedTodo) {
      handleUpdateTodo(active.id, { status: draggedTodo.status });
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const draggedTodo = todos.find(t => t.id === active.id);
    if (!draggedTodo) return;

    let targetStatus = null;

    const column = COLUMNS.find(c => c.id === over.id);
    if (column) {
      targetStatus = column.id;
    } else {
      const overTodo = todos.find(t => t.id === over.id);
      if (overTodo) {
        targetStatus = overTodo.status;
      }
    }

    if (targetStatus && draggedTodo.status !== targetStatus) {
      setTodos(prev =>
        prev.map(t => (t.id === active.id ? { ...t, status: targetStatus } : t))
      );
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>DoNext</h1>
        <div className="header-actions">
          <span className="user-name">Hi, {user.name}</span>
          <button
            onClick={() => setAddFormColumn(addFormColumn === 'new' ? null : 'new')}
            className="add-btn"
          >
            {addFormColumn === 'new' ? 'Cancel' : '+ Add Task'}
          </button>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

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
              onUpdate={handleUpdateTodo}
              onDelete={handleDeleteTodo}
              onAdd={handleAddTodo}
              activeId={activeId}
              isAddFormOpen={addFormColumn === column.id}
              onToggleAddForm={setAddFormColumn}
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
              {activeTodo.description && (
                <p className="card-description">{activeTodo.description}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
