import { useState, memo } from 'react';
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
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await onCreate(newName.trim());
    setNewName('');
    setIsCreating(false);
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await onUpdate(id, editName.trim());
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
          <div key={project.id} className="sidebar-project-row">
            {editingId === project.id ? (
              <form
                className="sidebar-edit-form"
                onSubmit={(e) => { e.preventDefault(); handleUpdate(project.id); }}
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
                  onClick={() => setEditingId(null)}
                >
                  <FiX size={13} />
                </button>
              </form>
            ) : (
              <>
                <button
                  className={`sidebar-nav-item ${selectedProjectId === project.id ? 'active' : ''}`}
                  onClick={() => onSelect(project.id)}
                >
                  <FiFolder size={15} />
                  <span>{project.name}</span>
                </button>
                <div className="sidebar-project-actions">
                  <button
                    className="sidebar-icon-btn"
                    title="Rename"
                    onClick={() => startEditing(project)}
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    className="sidebar-icon-btn danger"
                    title="Delete"
                    onClick={() => handleDelete(project.id)}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
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
          <button
            className="sidebar-new-project-btn"
            onClick={() => setIsCreating(true)}
          >
            <FiFolderPlus size={14} />
            <span>New Project</span>
          </button>
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
