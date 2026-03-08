const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// ── Token management ──
let accessToken: string | null = null;

export function setToken(token: string) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cms_token', token);
  }
}

export function getToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('cms_token');
  }
  return accessToken;
}

export function clearToken() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
  }
}

export function getStoredUser() {
  if (typeof window !== 'undefined') {
    const u = localStorage.getItem('cms_user');
    return u ? JSON.parse(u) : null;
  }
  return null;
}

export function setStoredUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cms_user', JSON.stringify(user));
  }
}

// ── Generic fetch ──
async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// ── Auth ──
export async function login(username: string, password: string) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.accessToken);
  setStoredUser(data.user);
  return data;
}

export async function getProfile() {
  return apiFetch('/auth/profile');
}

// ── Dashboard ──
export async function getDashboard() {
  return apiFetch('/admin/dashboard');
}

// ── Articles ──
export async function getArticles(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/articles/manage/all${qs ? `?${qs}` : ''}`);
}

export async function getArticleById(id: string) {
  return apiFetch(`/articles/manage/${id}`);
}

export async function createArticle(data: any) {
  return apiFetch('/articles', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateArticle(id: string, data: any) {
  return apiFetch(`/articles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function publishArticle(id: string) {
  return apiFetch(`/articles/${id}/publish`, { method: 'PATCH' });
}

export async function archiveArticle(id: string) {
  return apiFetch(`/articles/${id}/archive`, { method: 'PATCH' });
}

export async function unarchiveArticle(id: string) {
  return apiFetch(`/articles/${id}/unarchive`, { method: 'PATCH' });
}

export async function deleteArticle(id: string) {
  return apiFetch(`/articles/${id}`, { method: 'DELETE' });
}

// ── Categories ──
export async function getCategories() {
  return apiFetch('/categories');
}

export async function createCategory(data: { name: string; description?: string }) {
  return apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCategory(id: string, data: { name?: string; description?: string }) {
  return apiFetch(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteCategory(id: string) {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' });
}

// ── Tags ──
export async function getTags() {
  return apiFetch('/tags');
}

export async function createTag(data: { name: string }) {
  return apiFetch('/tags', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteTag(id: string) {
  return apiFetch(`/tags/${id}`, { method: 'DELETE' });
}

// ── Users ──
export async function getUsers(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/users${qs ? `?${qs}` : ''}`);
}

export async function createUser(data: { name: string; username: string; email: string; role: string }) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(id: string, data: any) {
  return apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteUser(id: string) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

// ── Account (self) ──
export async function getMe() {
  return apiFetch('/users/me');
}

export async function updateMe(data: { name?: string; email?: string }) {
  return apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  return apiFetch('/users/me/password', { method: 'PATCH', body: JSON.stringify(data) });
}
