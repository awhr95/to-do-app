import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TodoCard({ todo, onUpdate, onDelete, isDragging }) {
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

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = todo.dueDate < today && todo.status !== 'complete';

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
