import { useState, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  FiPlus,
  FiFolder,
  FiList,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiFolderPlus,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import '../styles/Sidebar.css';

// Separate component to use useDroppable hook per project
function DroppableProjectItem({
  project,
  isSelected,
  isCurrentProject,
  isDragging,
  isEditing,
  editName,
  setEditName,
  onSelect,
  onStartEditing,
  onUpdate,
  onDelete,
  onCancelEdit,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}`,
  });

  // Highlight when dragging over, but not if it's the todo's current project
  const isValidDropTarget = isOver && !isCurrentProject;

  // Determine styles based on state
  let rowStyle;
  let buttonStyle;

  if (isValidDropTarget) {
    rowStyle = {
      background: 'var(--color-primary)',
      borderRadius: '6px',
      boxShadow: '0 0 0 2px var(--color-primary-light)',
    };
    buttonStyle = { color: 'white' };
  } else if (isCurrentProject && isDragging) {
    // Grey out the task's current project while dragging
    rowStyle = {
      opacity: 0.4,
      cursor: 'not-allowed',
    };
    buttonStyle = {
      color: '#6b7280',
      cursor: 'not-allowed',
    };
  }

  return (
    <div
      ref={setNodeRef}
      className="sidebar-project-row"
      style={rowStyle}
    >
      {isEditing ? (
        <form
          className="sidebar-edit-form"
          onSubmit={(e) => { e.preventDefault(); onUpdate(project.id); }}
        >
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="sidebar-edit-input"
            autoFocus
          />
          <button type="submit" className="sidebar-icon-btn" title="Save">
            <FiCheck size={13} />
          </button>
          <button
            type="button"
            className="sidebar-icon-btn"
            title="Cancel"
            onClick={onCancelEdit}
          >
            <FiX size={13} />
          </button>
        </form>
      ) : (
        <>
          <button
            className={`sidebar-nav-item ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(project.id)}
            style={buttonStyle}
          >
            <FiFolder size={15} />
            <span>{project.name}</span>
          </button>
          <div className="sidebar-project-actions">
            <button
              className="sidebar-icon-btn"
              title="Rename"
              onClick={() => onStartEditing(project)}
            >
              <FiEdit2 size={12} />
            </button>
            <button
              className="sidebar-icon-btn danger"
              title="Delete"
              onClick={() => onDelete(project.id)}
            >
              <FiTrash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Droppable wrapper for the New Project button
function DroppableNewProjectButton({ isDragging, onClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'project-new',
  });

  const isValidDropTarget = isOver && isDragging;

  const style = isValidDropTarget ? {
    background: 'var(--color-primary)',
    borderRadius: '6px',
    boxShadow: '0 0 0 2px var(--color-primary-light)',
    color: 'white',
    borderColor: 'var(--color-primary)',
  } : undefined;

  return (
    <button
      ref={setNodeRef}
      className="sidebar-new-project-btn"
      onClick={onClick}
      style={style}
    >
      <FiFolderPlus size={14} />
      <span>{isValidDropTarget ? 'Drop to create project' : 'New Project'}</span>
    </button>
  );
}

export default memo(function Sidebar({
  user,
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onLogout,
  onAddTask,
  mode,
  onToggleMode,
  draggedTodoProjectId,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await onCreate(newName.trim(), mode);
    setNewName('');
    setIsCreating(false);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await onUpdate(id, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id) => {
    await onDelete(id);
  };

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  return (
    <aside className="sidebar">
      {/* App name / logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">✓</span>
        <span className="sidebar-logo-text">DoNext</span>
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <span className={`mode-label ${mode === 'work' ? 'active' : ''}`}>Work</span>
        <button
          className="toggle-switch"
          data-mode={mode}
          onClick={onToggleMode}
          aria-label={`Switch to ${mode === 'work' ? 'life' : 'work'} mode`}
        />
        <span className={`mode-label ${mode === 'life' ? 'active' : ''}`}>Life</span>
      </div>

      {/* Add Task button */}
      <button className="sidebar-add-task-btn" onClick={onAddTask}>
        <FiPlus size={16} />
        <span>Add Task</span>
      </button>

      {/* Nav section */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Projects</p>

        {/* All Tasks */}
        <button
          className={`sidebar-nav-item ${selectedProjectId === null ? 'active' : ''}`}
          onClick={() => onSelect(null)}
        >
          <FiList size={15} />
          <span>All Tasks</span>
        </button>

        {/* Project list */}
        {projects.map((project) => (
          <DroppableProjectItem
            key={project.id}
            project={project}
            isSelected={selectedProjectId === project.id}
            isCurrentProject={draggedTodoProjectId === project.id}
            isDragging={draggedTodoProjectId !== undefined}
            isEditing={editingId === project.id}
            editName={editName}
            setEditName={setEditName}
            onSelect={onSelect}
            onStartEditing={startEditing}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}

        {/* New project */}
        {isCreating ? (
          <form className="sidebar-create-form" onSubmit={handleCreate}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className="sidebar-edit-input"
              autoFocus
            />
            <button type="submit" className="sidebar-icon-btn" title="Create">
              <FiCheck size={13} />
            </button>
            <button
              type="button"
              className="sidebar-icon-btn"
              title="Cancel"
              onClick={() => { setIsCreating(false); setNewName(''); }}
            >
              <FiX size={13} />
            </button>
          </form>
        ) : (
          <DroppableNewProjectButton
            isDragging={draggedTodoProjectId !== undefined}
            onClick={() => setIsCreating(true)}
          />
        )}
      </nav>

      {/* User / logout at bottom */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <FiUser size={14} />
          </div>
          <span className="sidebar-user-name">{user.name}</span>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Log out">
          <FiLogOut size={15} />
        </button>
      </div>
    </aside>
  );
});
