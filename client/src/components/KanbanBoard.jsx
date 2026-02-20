import { useState, useCallback } from 'react';
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
import useTodos from '../hooks/useTodos';
import useProjects from '../hooks/useProjects';
import * as api from '../utils/api';
import '../styles/KanbanBoard.css';

export default function KanbanBoard({ user, onLogout }) {
  const [activeId, setActiveId] = useState(null);
  const [addFormColumn, setAddFormColumn] = useState(null);

  const {
    projects,
    selectedProjectId,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects(onLogout);

  const {
    todos,
    setTodos,
    todosRef,
    initialLoading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleImportant,
    loadTodos,
  } = useTodos(selectedProjectId, onLogout);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag handlers
  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const currentTodos = todosRef.current;
    const draggedTodo = currentTodos.find(t => t.id === active.id);
    if (!draggedTodo) return;

    const columnTodos = currentTodos.filter(t => t.status === draggedTodo.status);
    const reorderItems = columnTodos.map((todo, index) => ({
      id: todo.id,
      position: index,
    }));

    setTodos(prev => prev.map(t => {
      const item = reorderItems.find(r => r.id === t.id);
      return item ? { ...t, position: item.position } : t;
    }));

    try {
      await api.updateTodo(active.id, { status: draggedTodo.status });
      await api.reorderTodos(reorderItems);
    } catch (err) {
      console.error('Failed to persist drag:', err);
      loadTodos();
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

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

  // Memoized callbacks for Sidebar
  const handleAddTask = useCallback(() => setAddFormColumn('new'), []);

  if (initialLoading) {
    return <div className="loading">Loading...</div>;
  }

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <div className="app">
      <Sidebar
        user={user}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={selectProject}
        onCreate={createProject}
        onUpdate={updateProject}
        onDelete={deleteProject}
        onLogout={onLogout}
        onAddTask={handleAddTask}
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
                onUpdate={updateTodo}
                onDelete={deleteTodo}
                onToggleImportant={toggleImportant}
                onAdd={addTodo}
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
