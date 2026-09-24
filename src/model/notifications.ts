import type { NotificationBody } from '../api/types';
import type { Message, MessageStatus } from './types';

export type ChatEvent =
  | { kind: 'message'; message: Message; chatName?: string; phone?: string }
  | { kind: 'status'; chatId: string; id: string; status: MessageStatus };

function extractText(body: NotificationBody): string | null {
  const data = body.messageData;
  if (!data) return null;
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null;
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null;
  return null; // по заданию поддерживаем только текст
}

function mapStatus(status: string | undefined): MessageStatus | null {
  switch (status) {
    case 'sent':
    case 'delivered':
    case 'read':
      return status;
    case 'failed':
    case 'noAccount':
    case 'notInGroup':
      return 'failed';
    default:
      return null;
  }
}

/**
 * Превращает уведомление GREEN-API в событие для чата.
 * Возвращает null для всего, что интерфейс не показывает.
 *
 * outgoingAPIMessageReceived намеренно игнорируется: сообщения, отправленные
 * через API из этого интерфейса, уже есть в ленте, иначе появились бы дубли.
 */
export function toChatEvent(body: NotificationBody): ChatEvent | null {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived': {
      const text = extractText(body);
      const sender = body.senderData;
      if (text === null || !sender?.chatId || !body.idMessage) return null;
      const incoming = body.typeWebhook === 'incomingMessageReceived';
      return {
        kind: 'message',
        message: {
          id: body.idMessage,
          chatId: sender.chatId,
          text,
          direction: incoming ? 'in' : 'out',
          timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
          status: incoming ? undefined : 'sent',
        },
        chatName: incoming
          ? sender.senderContactName || sender.chatName || sender.senderName || undefined
          : undefined,
        phone: incoming && sender.senderPhoneNumber ? String(sender.senderPhoneNumber) : undefined,
      };
    }
    case 'outgoingMessageStatus': {
      const status = mapStatus(body.status);
      if (!status || !body.chatId || !body.idMessage) return null;
      return { kind: 'status', chatId: body.chatId, id: body.idMessage, status };
    }
    default:
      return null;
  }
}
