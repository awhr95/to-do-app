import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FiPlus, FiX } from 'react-icons/fi';
import TodoCard from './TodoCard';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function KanbanColumn({
  column,
  todos,
  onUpdate,
  onDelete,
  onToggleImportant,
  onAdd,
  activeId,
  isAddFormOpen,
  onToggleAddForm,
}) {
  // Filter by column and sort by position only (star is just visual, doesn't affect order)
  const columnTodos = todos
    .filter(t => t.status === column.id)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: getToday(),
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    await onAdd({ ...newTask, status: column.id });
    setNewTask({ title: '', description: '', dueDate: getToday() });
    onToggleAddForm(null);
  };

  return (
    <div className={`kanban-column ${isOver ? 'column-over' : ''}`}>
      <div className="column-header">
        <h2>{column.title}</h2>
        <div className="column-header-actions">
          <span className="todo-count">{columnTodos.length}</span>
          <button
            onClick={() => onToggleAddForm(isAddFormOpen ? null : column.id)}
            className="column-add-btn"
          >
            {isAddFormOpen ? <FiX size={14} /> : <FiPlus size={14} />}
          </button>
        </div>
      </div>

      {isAddFormOpen && (
        <form onSubmit={handleAdd} className="column-add-form">
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Task title"
            className="column-form-input"
            autoFocus
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Description (optional)"
            className="column-form-textarea"
          />
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="column-form-date"
          />
          <div className="column-form-actions">
            <button type="submit" className="column-form-submit">Add</button>
            <button type="button" onClick={() => onToggleAddForm(null)} className="column-form-cancel">
              Cancel
            </button>
          </div>
        </form>
      )}

      <SortableContext items={columnTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="column-content" ref={setNodeRef}>
          {columnTodos.map(todo => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleImportant={onToggleImportant}
              isDragging={activeId === todo.id}
            />
          ))}
          {columnTodos.length === 0 && !isAddFormOpen && (
            <div className="empty-column">Drop tasks here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
