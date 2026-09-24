import { useEffect, useRef, useState } from 'react';
import { getErrorMessage, type GreenApi } from '../api/greenApi';
import type { NotificationBody } from '../api/types';

const MAX_BACKOFF_MS = 30_000;

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

/**
 * Цикл получения входящих уведомлений через HTTP API GREEN-API:
 * receiveNotification (long polling) → обработка → deleteNotification.
 *
 * Уведомление удаляется из очереди только после обработки, поэтому при сбое
 * сети оно придёт повторно (дубли отсекает редьюсер по idMessage).
 * При ошибках — экспоненциальная пауза, чтобы не долбить API.
 *
 * Возвращает текст последней ошибки связи или null.
 */
export function useNotifications(
  api: GreenApi,
  onNotification: (body: NotificationBody) => void,
): string | null {
  const [error, setError] = useState<string | null>(null);
  const handlerRef = useRef(onNotification);

  useEffect(() => {
    handlerRef.current = onNotification;
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loop() {
      let failures = 0;
      while (!signal.aborted) {
        try {
          const notification = await api.receiveNotification(signal);
          failures = 0;
          setError(null);
          if (!notification) continue;

          try {
            handlerRef.current(notification.body);
          } catch (handlerError) {
            // Битое уведомление не должно застрять в очереди навсегда
            console.error('Не удалось обработать уведомление', handlerError, notification);
          }
          await api.deleteNotification(notification.receiptId, signal);
        } catch (loopError) {
          if (signal.aborted) return;
          failures += 1;
          setError(getErrorMessage(loopError));
          await delay(Math.min(1000 * 2 ** failures, MAX_BACKOFF_MS), signal);
        }
      }
    }

    void loop();
    return () => controller.abort();
  }, [api]);

  return error;
}
