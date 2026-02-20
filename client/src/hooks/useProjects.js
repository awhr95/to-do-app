import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

export default function useProjects(onLogout, onProjectsLoaded) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.fetchProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      } else {
        onProjectsLoaded?.();
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        onLogout();
      } else {
        console.error('Failed to fetch projects:', err);
        onProjectsLoaded?.();
      }
    }
  }

  const createProject = useCallback(async (name) => {
    try {
      const project = await api.createProject(name);
      setProjects(prev => [...prev, project]);
      setSelectedProjectId(project.id);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  }, []);

  const updateProject = useCallback(async (id, name) => {
    try {
      const updated = await api.updateProject(id, name);
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProjectId(prev => prev === id ? null : prev);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }, []);

  const selectProject = useCallback((id) => setSelectedProjectId(id), []);

  return {
    projects,
    selectedProjectId,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  };
}
