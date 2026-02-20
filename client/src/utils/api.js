export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

// Token management
export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth API
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function signup(email, password, name) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}

// Projects API
export async function fetchProjects() {
  const res = await fetch(`${API_URL}/projects`, {
    headers: authHeaders(),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

export async function createProject(name) {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function updateProject(id, name) {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteProject(id) {
  await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// Todos API
export async function fetchTodos(projectId) {
  const params = projectId ? `?projectId=${projectId}` : '';
  const res = await fetch(`${API_URL}/todos${params}`, {
    headers: authHeaders(),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

export async function createTodo(todoData) {
  const res = await fetch(`${API_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(todoData),
  });
  return res.json();
}

export async function updateTodo(id, updates) {
  const res = await fetch(`${API_URL}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteTodo(id) {
  await fetch(`${API_URL}/todos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function reorderTodos(items) {
  console.log('[API] reorderTodos called with items:', items);
  const res = await fetch(`${API_URL}/todos/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  console.log('[API] reorderTodos response status:', res.status, 'data:', data);
  return data;
}

export async function toggleTodoImportant(id) {
  console.log('[API] toggleTodoImportant called with id:', id);
  console.log('[API] Fetching URL:', `${API_URL}/todos/${id}/important`);
  const res = await fetch(`${API_URL}/todos/${id}/important`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  console.log('[API] toggleTodoImportant response status:', res.status, 'data:', data);
  return data;
}
