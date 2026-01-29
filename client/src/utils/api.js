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

// Todos API
export async function fetchTodos() {
  const res = await fetch(`${API_URL}/todos`, {
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
