import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../utils/api';

export default function useTodos(selectedProjectId, onLogout) {
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Ref to always have access to latest todos (fixes race condition in drag handlers)
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const loadTodos = useCallback(async () => {
    try {
      setTodosLoading(true);
      const data = await api.fetchTodos(selectedProjectId);
      setTodos(data);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        onLogout();
      } else {
        console.error('Failed to fetch todos:', err);
      }
    } finally {
      setTodosLoading(false);
      setInitialLoading(false);
    }
  }, [selectedProjectId, onLogout]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = useCallback(async (todoData) => {
    try {
      const todo = await api.createTodo({
        ...todoData,
        projectId: selectedProjectId,
      });
      setTodos(prev => [...prev, todo]);
      return todo;
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  }, [selectedProjectId]);

  const updateTodo = useCallback(async (id, updates) => {
    try {
      const updated = await api.updateTodo(id, updates);
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  }, []);

  const deleteTodo = useCallback(async (id) => {
    try {
      await api.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }, []);

  const toggleImportant = useCallback(async (id) => {
    const todo = todosRef.current.find(t => t.id === id);
    if (!todo) return;

    const newImportant = !todo.important;

    // If starring (not unstarring), bump to top of column
    if (newImportant) {
      // Set position to -1 to sort to top, then normalize positions
      setTodos(prev => {
        const updated = prev.map(t =>
          t.id === id ? { ...t, important: true, position: -1 } : t
        );
        // Normalize positions within the column
        const columnTodos = updated
          .filter(t => t.status === todo.status)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const normalizedIds = columnTodos.map((t, i) => ({ id: t.id, position: i }));
        return updated.map(t => {
          const norm = normalizedIds.find(n => n.id === t.id);
          return norm ? { ...t, position: norm.position } : t;
        });
      });

      // Persist to server
      try {
        await api.toggleTodoImportant(id);
        // Also persist the new positions
        const columnTodos = todosRef.current
          .filter(t => t.status === todo.status)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const reorderItems = columnTodos.map((t, i) => ({ id: t.id, position: i }));
        await api.reorderTodos(reorderItems);
      } catch (err) {
        console.error('Failed to toggle important:', err);
        // Revert on error
        setTodos(prev => prev.map(t => (t.id === id ? { ...t, important: false } : t)));
      }
    } else {
      // Just unstar, don't change position
      setTodos(prev => prev.map(t => (t.id === id ? { ...t, important: false } : t)));
      try {
        await api.toggleTodoImportant(id);
      } catch (err) {
        console.error('Failed to toggle important:', err);
        setTodos(prev => prev.map(t => (t.id === id ? { ...t, important: true } : t)));
      }
    }
  }, []);

  return {
    todos,
    setTodos,
    todosRef,
    todosLoading,
    initialLoading,
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleImportant,
  };
}
