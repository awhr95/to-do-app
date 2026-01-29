import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TodoCard from './TodoCard';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function KanbanColumn({
  column,
  todos,
  onUpdate,
  onDelete,
  onAdd,
  activeId,
  isAddFormOpen,
  onToggleAddForm,
}) {
  const columnTodos = todos.filter(t => t.status === column.id);
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
            {isAddFormOpen ? '×' : '+'}
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
