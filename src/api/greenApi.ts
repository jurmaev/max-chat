import type {
  CheckAccountResponse,
  Credentials,
  ReceivedNotification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types';

export class GreenApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

/** Таймаут long polling для receiveNotification, секунды (допустимо 5–60). */
const RECEIVE_TIMEOUT_SEC = 20;

const KNOWN_REASONS: Record<string, string> = {
  'instance is starting or not authorized':
    'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API.',
  'User get contact info limit reached':
    'Превышен лимит проверки номеров. Попробуйте позже.',
};

function describeError(status: number, body: string): string {
  let reason: string | undefined;
  try {
    const parsed = JSON.parse(body) as { reason?: string; message?: string };
    reason = parsed.reason ?? parsed.message;
  } catch {
    // тело не JSON — используем код ответа
  }
  if (reason && KNOWN_REASONS[reason]) return KNOWN_REASONS[reason];
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance.';
  if (status === 429) return 'Слишком много запросов к GREEN-API. Подождите немного.';
  if (status === 466) return 'Исчерпан лимит запросов тарифа GREEN-API.';
  if (status === 469) return 'Слишком частая проверка номеров. GREEN-API рекомендует подождать 2 часа.';
  return reason ? `GREEN-API: ${reason}` : `GREEN-API ответил ошибкой ${status}.`;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка.';
}

interface CallOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** Дополнительный сегмент пути после токена, например `/receiptId`. */
  suffix?: string;
  query?: Record<string, string | number>;
  signal?: AbortSignal;
}

export function createGreenApi(credentials: Credentials) {
  const baseUrl = `${credentials.apiUrl.trim().replace(/\/+$/, '')}/waInstance${credentials.idInstance.trim()}`;
  const token = credentials.apiTokenInstance.trim();

  async function call<T>(apiMethod: string, options: CallOptions = {}): Promise<T> {
    const { method = 'GET', body, suffix = '', query, signal } = options;
    const search = query
      ? `?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`
      : '';
    const url = `${baseUrl}/${apiMethod}/${token}${suffix}${search}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        signal,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      // На неверные учётные данные GREEN-API отвечает 403 без CORS-заголовков,
      // и браузер видит это как сетевую ошибку — поэтому подсказываем и про них
      throw new GreenApiError(
        'Не удалось связаться с GREEN-API. Проверьте apiUrl, idInstance, apiTokenInstance и подключение к интернету.',
      );
    }

    const text = await response.text();
    if (!response.ok) throw new GreenApiError(describeError(response.status, text), response.status);
    if (!text || text === 'null') return null as T;

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new GreenApiError('GREEN-API вернул ответ в неожиданном формате.', response.status);
    }
    // Часть ошибок приходит с кодом 200 в виде { status: false, reason }
    if (data && typeof data === 'object' && (data as { status?: unknown }).status === false) {
      throw new GreenApiError(describeError(response.status, text), response.status);
    }
    return data as T;
  }

  return {
    getStateInstance: (signal?: AbortSignal) =>
      call<StateInstanceResponse>('getStateInstance', { signal }),

    checkAccount: (phoneNumber: number) =>
      call<CheckAccountResponse>('checkAccount', { method: 'POST', body: { phoneNumber } }),

    sendMessage: (chatId: string, message: string) =>
      call<SendMessageResponse>('sendMessage', { method: 'POST', body: { chatId, message } }),

    receiveNotification: (signal?: AbortSignal) =>
      call<ReceivedNotification | null>('receiveNotification', {
        query: { receiveTimeout: RECEIVE_TIMEOUT_SEC },
        signal,
      }),

    deleteNotification: (receiptId: number, signal?: AbortSignal) =>
      call<{ result: boolean }>('deleteNotification', {
        method: 'DELETE',
        suffix: `/${receiptId}`,
        signal,
      }),
  };
}

export type GreenApi = ReturnType<typeof createGreenApi>;
