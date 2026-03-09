import { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../utils/api';

export default function useProjects(onLogout, activeMode) {
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // Filter projects by active mode
  const projects = useMemo(() => {
    return allProjects.filter(p => p.mode === activeMode);
  }, [allProjects, activeMode]);

  // Reset selection when mode changes and current selection is not in filtered list
  useEffect(() => {
    if (selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId]);

  async function loadProjects() {
    try {
      const data = await api.fetchProjects();
      setAllProjects(data);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        onLogout();
      } else {
        console.error('Failed to fetch projects:', err);
      }
    }
  }

  const createProject = useCallback(async (name, mode) => {
    try {
      const project = await api.createProject(name, mode);
      setAllProjects(prev => [...prev, project]);
      setSelectedProjectId(project.id);
      return project;
    } catch (err) {
      console.error('Failed to create project:', err);
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    try {
      const updated = await api.updateProject(id, updates);
      setAllProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    try {
      await api.deleteProject(id);
      setAllProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProjectId(prev => prev === id ? null : prev);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }, []);

  const selectProject = useCallback((id) => setSelectedProjectId(id), []);

  return {
    projects,
    allProjects,
    selectedProjectId,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  };
}
