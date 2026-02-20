import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import Sidebar from './Sidebar';
import { COLUMNS } from '../utils/constants';
import * as api from '../utils/api';
import '../styles/KanbanBoard.css';

export default function KanbanBoard({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [addFormColumn, setAddFormColumn] = useState(null);

  // Ref to always have access to latest todos (fixes race condition in drag handlers)
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTodos();
  }, [selectedProjectId]);

  async function loadProjects() {
    try {
      const data = await api.fetchProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        onLogout();
      } else {
        console.error('Failed to fetch projects:', err);
        setLoading(false);
      }
    }
  }

  async function loadTodos() {
    try {
      setLoading(true);
      const data = await api.fetchTodos(selectedProjectId);
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
      const todo = await api.createTodo({
        ...todoData,
        projectId: selectedProjectId,
      });
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

  async function handleToggleImportant(id) {
    const todo = todosRef.current.find(t => t.id === id);
    if (!todo) return;

    const newImportant = !todo.important;

    // If starring (not unstarring), bump to top of column
    if (newImportant) {
      // Set position to -1 to sort to top, then normalize positions
      setTodos(prev => {
        const updated = prev.map(t =>
          t.id === id ? { ...t, important: true, position: -1 } : t
        );
        // Normalize positions within the column
        const columnTodos = updated
          .filter(t => t.status === todo.status)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const normalizedIds = columnTodos.map((t, i) => ({ id: t.id, position: i }));
        return updated.map(t => {
          const norm = normalizedIds.find(n => n.id === t.id);
          return norm ? { ...t, position: norm.position } : t;
        });
      });

      // Persist to server
      try {
        await api.toggleTodoImportant(id);
        // Also persist the new positions
        const columnTodos = todosRef.current
          .filter(t => t.status === todo.status)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const reorderItems = columnTodos.map((t, i) => ({ id: t.id, position: i }));
        await api.reorderTodos(reorderItems);
      } catch (err) {
        console.error('Failed to toggle important:', err);
        // Revert on error
        setTodos(prev => prev.map(t => (t.id === id ? { ...t, important: false } : t)));
      }
    } else {
      // Just unstar, don't change position
      setTodos(prev => prev.map(t => (t.id === id ? { ...t, important: false } : t)));
      try {
        await api.toggleTodoImportant(id);
      } catch (err) {
        console.error('Failed to toggle important:', err);
        setTodos(prev => prev.map(t => (t.id === id ? { ...t, important: true } : t)));
      }
    }
  }

  async function handleCreateProject(name) {
    try {
      const project = await api.createProject(name);
      setProjects(prev => [...prev, project]);
      setSelectedProjectId(project.id);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  }

  async function handleUpdateProject(id, name) {
    try {
      const updated = await api.updateProject(id, name);
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  }

  async function handleDeleteProject(id) {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Use ref to get latest state (fixes race condition with fast drags)
    const currentTodos = todosRef.current;
    const draggedTodo = currentTodos.find(t => t.id === active.id);
    if (!draggedTodo) return;

    // Get todos in the same column (using latest state)
    const columnTodos = currentTodos.filter(t => t.status === draggedTodo.status);

    // Build reorder items from current array order
    const reorderItems = columnTodos.map((todo, index) => ({
      id: todo.id,
      position: index,
    }));

    // Update local state with normalized positions
    setTodos(prev => prev.map(t => {
      const item = reorderItems.find(r => r.id === t.id);
      return item ? { ...t, position: item.position } : t;
    }));

    // Persist to server
    try {
      await api.updateTodo(active.id, { status: draggedTodo.status });
      await api.reorderTodos(reorderItems);
    } catch (err) {
      console.error('Failed to persist drag:', err);
      // Reload on error to get correct state
      loadTodos();
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    // Use functional update to always work with latest state
    setTodos(prev => {
      const draggedTodo = prev.find(t => t.id === active.id);
      if (!draggedTodo) return prev;

      // Check if dropping on a column
      const column = COLUMNS.find(c => c.id === over.id);
      if (column) {
        if (draggedTodo.status !== column.id) {
          return prev.map(t => (t.id === active.id ? { ...t, status: column.id } : t));
        }
        return prev;
      }

      // Dropping on another todo
      const overTodo = prev.find(t => t.id === over.id);
      if (!overTodo) return prev;

      // Cross-column move
      if (draggedTodo.status !== overTodo.status) {
        const updated = prev.map(t =>
          t.id === active.id ? { ...t, status: overTodo.status } : t
        );
        const columnTodos = updated.filter(t => t.status === overTodo.status);
        const oldIndex = columnTodos.findIndex(t => t.id === active.id);
        const newIndex = columnTodos.findIndex(t => t.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(columnTodos, oldIndex, newIndex);
          const otherTodos = updated.filter(t => t.status !== overTodo.status);
          return [...otherTodos, ...reordered];
        }
        return updated;
      }

      // Within-column reorder
      if (active.id !== over.id) {
        const columnTodos = prev.filter(t => t.status === draggedTodo.status);
        const otherTodos = prev.filter(t => t.status !== draggedTodo.status);
        const oldIndex = columnTodos.findIndex(t => t.id === active.id);
        const newIndex = columnTodos.findIndex(t => t.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnTodos, oldIndex, newIndex);
          return [...otherTodos, ...reordered];
        }
      }

      return prev;
    });
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <div className="app">
      <Sidebar
        user={user}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={setSelectedProjectId}
        onCreate={handleCreateProject}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
        onLogout={onLogout}
        onAddTask={() => setAddFormColumn('new')}
      />

      <div className="board-content">
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
                onToggleImportant={handleToggleImportant}
                onAdd={handleAddTodo}
                activeId={activeId}
                isAddFormOpen={addFormColumn === column.id}
                onToggleAddForm={setAddFormColumn}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTodo ? (
              <div className={`todo-card dragging ${activeTodo.important ? 'important' : ''}`}>
                <div className="card-header">
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
    </div>
  );
}
