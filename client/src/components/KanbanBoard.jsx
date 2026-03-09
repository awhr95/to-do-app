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
import useMode from '../hooks/useMode';
import * as api from '../utils/api';
import '../styles/KanbanBoard.css';

export default function KanbanBoard({ user, onLogout }) {
  const [activeId, setActiveId] = useState(null);
  const [activeTodoProjectId, setActiveTodoProjectId] = useState(null);
  const [addFormColumn, setAddFormColumn] = useState(null);

  const { mode, toggleMode } = useMode();

  const {
    projects,
    selectedProjectId,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects(onLogout, mode);

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
  } = useTodos(selectedProjectId, onLogout, mode);

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
    const draggedTodo = todosRef.current.find(t => t.id === event.active.id);
    setActiveId(event.active.id);
    setActiveTodoProjectId(draggedTodo?.projectId ?? null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    setActiveTodoProjectId(null);

    if (!over) return;

    const currentTodos = todosRef.current;
    const draggedTodo = currentTodos.find(t => t.id === active.id);
    if (!draggedTodo) return;

    // Check if dropping on "New Project" button
    if (over.id === 'project-new') {
      // Optimistically remove from current view
      const previousTodos = [...currentTodos];
      setTodos(prev => prev.filter(t => t.id !== active.id));

      // Save current selection to restore after (createProject auto-selects)
      const previousSelectedProjectId = selectedProjectId;

      try {
        // Create a new project with the same mode as the dragged task
        const newProject = await createProject('Untitled Project', draggedTodo.mode || mode);
        if (!newProject) {
          throw new Error('Failed to create project');
        }

        // Restore previous selection (don't auto-switch to new project)
        selectProject(previousSelectedProjectId);

        // Move the task to the new project
        await api.updateTodo(active.id, { projectId: newProject.id, status: 'new' });
        loadTodos(); // Refresh to get updated data
      } catch (err) {
        console.error('Failed to create project and move todo:', err);
        setTodos(previousTodos); // Revert on failure
        selectProject(previousSelectedProjectId); // Restore selection on error too
      }
      return;
    }

    // Check if dropping on an existing project in the sidebar
    if (typeof over.id === 'string' && over.id.startsWith('project-')) {
      const targetProjectId = parseInt(over.id.replace('project-', ''), 10);

      // Skip if already in this project
      if (draggedTodo.projectId === targetProjectId) return;

      // Optimistically remove from current view
      const previousTodos = [...currentTodos];
      setTodos(prev => prev.filter(t => t.id !== active.id));

      try {
        await api.updateTodo(active.id, { projectId: targetProjectId, status: 'new' });
        loadTodos(); // Refresh to get updated data
      } catch (err) {
        console.error('Failed to move todo to project:', err);
        setTodos(previousTodos); // Revert on failure
      }
      return; // Don't run the column reorder logic
    }

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
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
          mode={mode}
          onToggleMode={toggleMode}
          draggedTodoProjectId={activeTodoProjectId}
        />

        <div className="board-content">
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

          <DragOverlay dropAnimation={null}>
            {activeTodo ? (
              <div style={{
                opacity: 0.75,
                transform: 'scale(0.85)',
                transformOrigin: 'top left',
                pointerEvents: 'none',
              }}>
                <div className={`todo-card dragging ${activeTodo.important ? 'important' : ''}`}>
                  <div className="card-header">
                    <h3 className="card-title">{activeTodo.title || 'Untitled'}</h3>
                  </div>
                  {activeTodo.description && (
                    <p className="card-description">{activeTodo.description}</p>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  );
}
