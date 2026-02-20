import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiEdit2, FiTrash2, FiSave, FiX, FiCalendar, FiClock, FiAlertCircle, FiStar } from 'react-icons/fi';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}`;
}

export default function TodoCard({ todo, onUpdate, onDelete, onToggleImportant, isDragging }) {
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
          <FiCalendar size={12} />
          Due Date:
          <input
            type="date"
            value={editData.dueDate}
            onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
            className="edit-date"
          />
        </label>
        <div className="edit-actions">
          <button onClick={handleSave} className="save-btn icon-btn">
            <FiSave size={14} />
            <span>Save</span>
          </button>
          <button onClick={() => setIsEditing(false)} className="cancel-btn icon-btn">
            <FiX size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`todo-card ${isOverdue ? 'overdue' : ''} ${todo.important ? 'important' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="card-header">
        <h3 className="card-title">{todo.title || 'Untitled'}</h3>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onToggleImportant(todo.id)}
          className={`important-btn ${todo.important ? 'active' : ''}`}
          title={todo.important ? 'Remove importance' : 'Mark as important'}
        >
          <FiStar size={14} />
        </button>
      </div>
      {todo.description && <p className="card-description">{todo.description}</p>}
      <div className="card-dates">
        <span className="start-date">
          <FiClock size={11} /> {formatDate(todo.startDate)}
        </span>
        <span className={`due-date ${isOverdue ? 'overdue-text' : ''}`}>
          {isOverdue ? <FiAlertCircle size={11} /> : <FiCalendar size={11} />} {formatDate(todo.dueDate)}
        </span>
      </div>
      <div className="card-actions">
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsEditing(true)} className="edit-btn icon-btn">
          <FiEdit2 size={13} />
        </button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(todo.id)} className="delete-btn icon-btn">
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  );
}
