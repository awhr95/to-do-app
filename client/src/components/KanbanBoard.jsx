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
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { FiPlus, FiX, FiLogOut, FiMoreVertical } from 'react-icons/fi';
import KanbanColumn from './KanbanColumn';
import ProjectSelector from './ProjectSelector';
import { COLUMNS } from '../utils/constants';
import * as api from '../utils/api';

export default function KanbanBoard({ user, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
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
    // Optimistic update
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, important: !t.important } : t))
    );

    try {
      const updated = await api.toggleTodoImportant(id);
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      // Revert on error
      setTodos(prev =>
        prev.map(t => (t.id === id ? { ...t, important: !t.important } : t))
      );
      console.error('Failed to toggle important:', err);
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

    const draggedTodo = todos.find(t => t.id === active.id);
    if (!draggedTodo) return;

    // Get todos in the same column as the dragged todo (after any status change from handleDragOver)
    const columnTodos = todos.filter(t => t.status === draggedTodo.status);

    // Persist the status change (handles cross-column moves)
    await handleUpdateTodo(active.id, { status: draggedTodo.status });

    // Persist the new order within the column
    const reorderItems = columnTodos.map((todo, index) => ({
      id: todo.id,
      position: index,
    }));

    try {
      await api.reorderTodos(reorderItems);
    } catch (err) {
      console.error('Failed to persist reorder:', err);
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const draggedTodo = todos.find(t => t.id === active.id);
    if (!draggedTodo) return;

    // Check if dropping on a column
    const column = COLUMNS.find(c => c.id === over.id);
    if (column) {
      // Cross-column move to an empty column or column header
      if (draggedTodo.status !== column.id) {
        setTodos(prev =>
          prev.map(t => (t.id === active.id ? { ...t, status: column.id } : t))
        );
      }
      return;
    }

    // Dropping on another todo
    const overTodo = todos.find(t => t.id === over.id);
    if (!overTodo) return;

    // Cross-column move (dropping on a todo in a different column)
    if (draggedTodo.status !== overTodo.status) {
      setTodos(prev => {
        const updated = prev.map(t =>
          t.id === active.id ? { ...t, status: overTodo.status } : t
        );
        // Reorder within the new column
        const columnTodos = updated.filter(t => t.status === overTodo.status);
        const oldIndex = columnTodos.findIndex(t => t.id === active.id);
        const newIndex = columnTodos.findIndex(t => t.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(columnTodos, oldIndex, newIndex);
          const columnIds = reordered.map(t => t.id);
          return updated.sort((a, b) => {
            if (a.status === overTodo.status && b.status === overTodo.status) {
              return columnIds.indexOf(a.id) - columnIds.indexOf(b.id);
            }
            return 0;
          });
        }
        return updated;
      });
      return;
    }

    // Within-column reorder
    if (active.id !== over.id) {
      setTodos(prev => {
        const columnTodos = prev.filter(t => t.status === draggedTodo.status);
        const otherTodos = prev.filter(t => t.status !== draggedTodo.status);
        const oldIndex = columnTodos.findIndex(t => t.id === active.id);
        const newIndex = columnTodos.findIndex(t => t.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnTodos, oldIndex, newIndex);
          return [...otherTodos, ...reordered];
        }
        return prev;
      });
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
        <ProjectSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
          onCreate={handleCreateProject}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
        />
        <div className="header-actions">
          <span className="user-name">Hi, {user.name}</span>
          <button
            onClick={() => setAddFormColumn(addFormColumn === 'new' ? null : 'new')}
            className="add-btn icon-btn"
          >
            {addFormColumn === 'new' ? <FiX size={16} /> : <FiPlus size={16} />}
            <span>{addFormColumn === 'new' ? 'Cancel' : 'Add Task'}</span>
          </button>
          <button onClick={onLogout} className="logout-btn icon-btn">
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
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
            <div className="todo-card dragging">
              <div className="card-header">
                <FiMoreVertical className="drag-handle" size={16} />
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
