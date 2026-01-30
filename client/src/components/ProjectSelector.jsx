import { useState } from 'react';
import { FiChevronDown, FiFolderPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiFolder } from 'react-icons/fi';

export default function ProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const label = selectedProject ? selectedProject.name : 'All Tasks';

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
    if (selectedProjectId === id) {
      onSelect(null);
    }
  };

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  return (
    <div className="project-selector">
      <button
        className="project-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiFolder size={14} />
        <span>{label}</span>
        <FiChevronDown
          size={14}
          className={`chevron ${isOpen ? 'chevron-open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="project-dropdown">
          <button
            className={`project-option ${selectedProjectId === null ? 'active' : ''}`}
            onClick={() => { onSelect(null); setIsOpen(false); }}
          >
            All Tasks
          </button>

          {projects.map(project => (
            <div key={project.id} className="project-option-row">
              {editingId === project.id ? (
                <form
                  className="project-edit-form"
                  onSubmit={(e) => { e.preventDefault(); handleUpdate(project.id); }}
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="project-edit-input"
                    autoFocus
                  />
                  <button type="submit" className="project-icon-btn">
                    <FiCheck size={14} />
                  </button>
                  <button
                    type="button"
                    className="project-icon-btn"
                    onClick={() => setEditingId(null)}
                  >
                    <FiX size={14} />
                  </button>
                </form>
              ) : (
                <>
                  <button
                    className={`project-option ${selectedProjectId === project.id ? 'active' : ''}`}
                    onClick={() => { onSelect(project.id); setIsOpen(false); }}
                  >
                    {project.name}
                  </button>
                  <div className="project-option-actions">
                    <button
                      className="project-icon-btn"
                      onClick={() => startEditing(project)}
                    >
                      <FiEdit2 size={12} />
                    </button>
                    <button
                      className="project-icon-btn danger"
                      onClick={() => handleDelete(project.id)}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {isCreating ? (
            <form className="project-create-form" onSubmit={handleCreate}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                className="project-edit-input"
                autoFocus
              />
              <button type="submit" className="project-icon-btn">
                <FiCheck size={14} />
              </button>
              <button
                type="button"
                className="project-icon-btn"
                onClick={() => { setIsCreating(false); setNewName(''); }}
              >
                <FiX size={14} />
              </button>
            </form>
          ) : (
            <button
              className="project-add-btn"
              onClick={() => setIsCreating(true)}
            >
              <FiFolderPlus size={14} />
              <span>New Project</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
