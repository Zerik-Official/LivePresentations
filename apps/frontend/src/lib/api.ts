/**
 * Typed API client for LivePresentations backend.
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RuntimeConfig {
  turnstile_enabled: boolean;
  turnstile_site_key: string | null;
  upload_quota_bytes: number;
}

const API_BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const TURNSTILE_PUBLIC_KEY = import.meta.env.VITE_TURNSTILE_PUBLIC_KEY as string | undefined;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Register a new user.
 * @param email - User email
 * @param password - User password (min 8 chars)
 * @returns Auth response with token and user
 */
export async function register(email: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al registrarse" }));
    throw new Error(err.detail ?? "Error al registrarse");
  }
  return res.json() as Promise<AuthResponse>;
}

/**
 * Login with email and password.
 * @param email - User email
 * @param password - User password
 * @returns Auth response with token and user
 */
export async function login(email: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Credenciales inválidas" }));
    throw new Error(err.detail ?? "Credenciales inválidas");
  }
  return res.json() as Promise<AuthResponse>;
}

export async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  const res = await fetch(`${API_BASE}/api/config`);
  if (!res.ok) throw new Error("No se pudo cargar la configuración");
  return res.json() as Promise<RuntimeConfig>;
}

/**
 * Fetch current authenticated user.
 * @returns User profile
 */
export async function fetchMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("No autenticado");
  return res.json() as Promise<User>;
}

export interface Presentation {
  id: string;
  owner_id: string;
  title: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Room {
  code: string;
  presentation_id: string;
  current_slide: number;
  highlighted_id: string | null;
  show_controls: boolean;
  fullscreen: boolean;
  anti_spoiler: boolean;
  auto_fullscreen: boolean;
}

/**
 * List presentations owned by current user.
 */
export async function listPresentations(): Promise<Presentation[]> {
  const res = await fetch(`${API_BASE}/api/presentations`, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error("Error al listar presentaciones");
  return res.json() as Promise<Presentation[]>;
}

/**
 * Fetch a presentation by id.
 * @param id - Presentation id
 */
export async function getPresentation(id: string): Promise<Presentation> {
  const res = await fetch(`${API_BASE}/api/presentations/${id}`, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error("Presentación no encontrada");
  return res.json() as Promise<Presentation>;
}

/**
 * Update a presentation.
 * @param id - Presentation id
 * @param payload - Update payload
 */
export async function updatePresentation(id: string, payload: { title?: string; data?: Record<string, unknown> }): Promise<Presentation> {
  const res = await fetch(`${API_BASE}/api/presentations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al guardar");
  return res.json() as Promise<Presentation>;
}

/**
 * Create a presentation.
 * @param title - Presentation title
 * @param data - Optional initial data
 */
export async function createPresentation(title: string, data?: Record<string, unknown>): Promise<Presentation> {
  const res = await fetch(`${API_BASE}/api/presentations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ title, data: data ?? { slides: [], width: 1280, height: 720 } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al crear" }));
    throw new Error(err.detail ?? "Error al crear");
  }
  return res.json() as Promise<Presentation>;
}

/**
 * Create a room for a presentation.
 * @param presentationId - Presentation id
 */
export async function createRoom(presentationId: string): Promise<Room> {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ presentation_id: presentationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al crear sala" }));
    throw new Error(err.detail ?? "Error al crear sala");
  }
  return res.json() as Promise<Room>;
}

/**
 * Join room by code.
 * @param code - Room code
 */
export async function getRoom(code: string): Promise<Room> {
  const res = await fetch(`${API_BASE}/api/rooms/${code}`, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error("Sala no encontrada");
  return res.json() as Promise<Room>;
}

/**
 * List active rooms for current user.
 */
export async function listRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/api/rooms`, { headers: { ...getAuthHeader() } });
  if (!res.ok) return [];
  return res.json() as Promise<Room[]>;
}

/**
 * Update room config.
 * @param code - Room code
 * @param config - Config patch
 */
export async function updateRoomConfig(code: string, config: { show_controls?: boolean; fullscreen?: boolean; anti_spoiler?: boolean; auto_fullscreen?: boolean }): Promise<Room> {
  const res = await fetch(`${API_BASE}/api/rooms/${code}/config`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al actualizar configuración" }));
    throw new Error(err.detail ?? "Error al actualizar configuración");
  }
  return res.json() as Promise<Room>;
}

/**
 * Export presentation as zip package.
 * @param id - Presentation id
 */
export async function exportPresentationZip(id: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/presentations/${id}/export`, { headers: { ...getAuthHeader() } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al exportar" }));
    throw new Error(err.detail ?? "Error al exportar");
  }
  return res.blob();
}

/**
 * Import presentation from zip file.
 * @param file - Zip file
 */
export async function importPresentationZip(file: File): Promise<Presentation> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/presentations/import-zip`, { method: "POST", headers: { ...getAuthHeader() }, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al importar zip" }));
    throw new Error(err.detail ?? "Error al importar zip");
  }
  return res.json() as Promise<Presentation>;
}

/**
 * Delete a presentation.
 * @param id - Presentation id
 */
export async function deletePresentation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/presentations/${id}`, { method: "DELETE", headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error("Error al borrar");
}

/**
 * Delete a room by code.
 * @param code - Room code
 */
export async function deleteRoom(code: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/rooms/${code}`, { method: "DELETE", headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error("Error al borrar sala");
}

/**
 * Upload an image or video within the configured user quota.
 * @param file - File to upload
 * @returns URL of uploaded file
 */
export async function uploadFile(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/uploads`, { method: "POST", headers: { ...getAuthHeader() }, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error al subir archivo" }));
    throw new Error(err.detail ?? "Error al subir archivo");
  }
  return res.json() as Promise<{ url: string }>;
}
