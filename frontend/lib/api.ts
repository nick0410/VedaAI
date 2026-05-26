import type { Assignment } from './types';
import type { AuthUser } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vedaai-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = readToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
}

async function unwrap<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let body: { message?: string; issues?: { message: string }[]; error?: string } = {};
  try {
    body = await res.json();
  } catch {
    /* empty */
  }
  const msg =
    body.message ||
    body.issues?.[0]?.message ||
    body.error ||
    `${fallbackMsg} (${res.status})`;
  throw new Error(msg);
}

// -------------------- AUTH --------------------

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  schoolName: string;
  schoolLocation?: string;
}

export async function signup(input: SignupInput): Promise<{ token: string; user: AuthUser }> {
  const res = await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(input) });
  return unwrap(res, 'Signup failed');
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return unwrap(res, 'Login failed');
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiFetch('/api/auth/me');
  const data = await unwrap<{ user: AuthUser }>(res, 'Session check failed');
  return data.user;
}

export interface UpdateMePatch {
  name?: string;
  schoolName?: string;
  schoolLocation?: string;
  avatarDataUrl?: string | null;
}

export async function updateMe(patch: UpdateMePatch): Promise<AuthUser> {
  const res = await apiFetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });
  const data = await unwrap<{ user: AuthUser }>(res, 'Update failed');
  return data.user;
}

// -------------------- ASSIGNMENTS --------------------

export interface AssignmentSummary {
  id: string;
  title: string;
  subject?: string;
  dueDate: string;
  status: Assignment['status'];
  createdAt: string;
  questionTypes: Assignment['questionTypes'];
}

export async function listAssignments(): Promise<AssignmentSummary[]> {
  const res = await apiFetch('/api/assignments');
  const data = await unwrap<{ items: AssignmentSummary[] }>(res, 'Failed to load assignments');
  return data.items;
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await apiFetch(`/api/assignments/${id}`, { method: 'DELETE' });
  await unwrap(res, 'Delete failed');
}

export interface CreateAssignmentResult {
  id: string;
  status: Assignment['status'];
  paper?: Assignment['paper'];
  error?: string;
}

export async function createAssignment(formData: FormData): Promise<CreateAssignmentResult> {
  const res = await apiFetch('/api/assignments', { method: 'POST', body: formData });
  return unwrap(res, 'Create failed');
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await apiFetch(`/api/assignments/${id}`);
  return unwrap(res, 'Failed to load assignment');
}

export async function regenerateAssignment(id: string): Promise<CreateAssignmentResult> {
  const res = await apiFetch(`/api/assignments/${id}/regenerate`, { method: 'POST' });
  return unwrap(res, 'Regenerate failed');
}

// -------------------- GROUPS --------------------

export interface StudentRow {
  id: string;
  name: string;
  rollNumber: string;
  attendancePercent: number;
}

export interface StudentInput {
  name: string;
  rollNumber: string;
  attendancePercent: number;
}

export interface GroupAssignmentRef {
  id: string;
  title?: string;
  subject?: string;
  status?: Assignment['status'];
  dueDate?: string;
}

export interface Group {
  id: string;
  name: string;
  grade: string;
  students: StudentRow[];
  assignedAssignments: GroupAssignmentRef[];
  createdAt: string;
  updatedAt: string;
}

export async function listGroups(): Promise<Group[]> {
  const res = await apiFetch('/api/groups');
  const data = await unwrap<{ items: Group[] }>(res, 'Failed to load groups');
  return data.items;
}

export async function createGroup(input: { name: string; grade: string }): Promise<Group> {
  const res = await apiFetch('/api/groups', { method: 'POST', body: JSON.stringify(input) });
  const data = await unwrap<{ group: Group }>(res, 'Create group failed');
  return data.group;
}

export async function getGroup(id: string): Promise<Group> {
  const res = await apiFetch(`/api/groups/${id}`);
  const data = await unwrap<{ group: Group }>(res, 'Failed to load group');
  return data.group;
}

export async function deleteGroup(id: string): Promise<void> {
  const res = await apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
  await unwrap(res, 'Delete group failed');
}

export async function updateGroup(id: string, patch: { name?: string; grade?: string }): Promise<Group> {
  const res = await apiFetch(`/api/groups/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  const data = await unwrap<{ group: Group }>(res, 'Update group failed');
  return data.group;
}

export async function addStudents(
  groupId: string,
  students: StudentInput[]
): Promise<{ group: Group; added: number; skippedDuplicates: number }> {
  const res = await apiFetch(`/api/groups/${groupId}/students`, {
    method: 'POST',
    body: JSON.stringify({ students }),
  });
  return unwrap(res, 'Add students failed');
}

export async function updateStudent(
  groupId: string,
  studentId: string,
  patch: Partial<StudentInput>
): Promise<Group> {
  const res = await apiFetch(`/api/groups/${groupId}/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  const data = await unwrap<{ group: Group }>(res, 'Update student failed');
  return data.group;
}

export async function removeStudent(groupId: string, studentId: string): Promise<Group> {
  const res = await apiFetch(`/api/groups/${groupId}/students/${studentId}`, { method: 'DELETE' });
  const data = await unwrap<{ group: Group }>(res, 'Remove student failed');
  return data.group;
}

export async function assignAssignmentToGroup(groupId: string, assignmentId: string): Promise<Group> {
  const res = await apiFetch(`/api/groups/${groupId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ assignmentId }),
  });
  const data = await unwrap<{ group: Group }>(res, 'Assign failed');
  return data.group;
}

export async function unassignAssignmentFromGroup(groupId: string, assignmentId: string): Promise<Group> {
  const res = await apiFetch(`/api/groups/${groupId}/assignments/${assignmentId}`, { method: 'DELETE' });
  const data = await unwrap<{ group: Group }>(res, 'Unassign failed');
  return data.group;
}
