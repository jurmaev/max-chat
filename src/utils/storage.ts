import type { Credentials } from '../api/types';

const CREDENTIALS_KEY = 'max-chat:credentials';

export function loadJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // хранилище недоступно или переполнено — чат продолжит работать без сохранения
  }
}

export function loadCredentials(): Credentials | null {
  const data = loadJson(CREDENTIALS_KEY) as Partial<Credentials> | null;
  if (!data?.apiUrl || !data.idInstance || !data.apiTokenInstance) return null;
  return { apiUrl: data.apiUrl, idInstance: data.idInstance, apiTokenInstance: data.apiTokenInstance };
}

export function saveCredentials(credentials: Credentials): void {
  saveJson(CREDENTIALS_KEY, credentials);
}

export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
  } catch {
    // нечего очищать
  }
}

export const chatStateKey = (idInstance: string) => `max-chat:${idInstance}:state`;
