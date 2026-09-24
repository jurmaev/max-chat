import type { Chat, Message, MessageStatus } from './types';

export interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
}

export const emptyChatState: ChatState = { chats: [], messages: {}, activeChatId: null };

export type ChatAction =
  | { type: 'chatOpened'; chatId: string; phone: string }
  | { type: 'chatSelected'; chatId: string | null }
  | { type: 'messageAdded'; message: Message; chatName?: string; phone?: string }
  | { type: 'messageSent'; chatId: string; localId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; id: string; error: string }
  | { type: 'messageRetried'; chatId: string; id: string }
  | { type: 'statusChanged'; chatId: string; id: string; status: MessageStatus };

/** Статусы только растут: уведомление «sent» не должно откатить «read». */
const STATUS_RANK: Record<MessageStatus, number> = {
  failed: -1,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

function patchChat(chats: Chat[], chatId: string, patch: Partial<Chat>): Chat[] {
  return chats.map((chat) => (chat.chatId === chatId ? { ...chat, ...patch } : chat));
}

function patchMessage(
  state: ChatState,
  chatId: string,
  id: string,
  patch: (message: Message) => Message,
): ChatState {
  const list = state.messages[chatId];
  const index = list?.findIndex((m) => m.id === id) ?? -1;
  if (!list || index === -1) return state;
  const next = list.slice();
  next[index] = patch(list[index]);
  return { ...state, messages: { ...state.messages, [chatId]: next } };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened': {
      const exists = state.chats.some((c) => c.chatId === action.chatId);
      const chats = exists
        ? patchChat(state.chats, action.chatId, { unread: 0, phone: action.phone })
        : [
            { chatId: action.chatId, phone: action.phone, unread: 0, updatedAt: Date.now() },
            ...state.chats,
          ];
      return { ...state, chats, activeChatId: action.chatId };
    }

    case 'chatSelected':
      return {
        ...state,
        activeChatId: action.chatId,
        chats: action.chatId ? patchChat(state.chats, action.chatId, { unread: 0 }) : state.chats,
      };

    case 'messageAdded': {
      const { message, chatName, phone } = action;
      const list = state.messages[message.chatId] ?? [];
      // GREEN-API может повторно доставить уведомление — защищаемся от дублей
      if (list.some((m) => m.id === message.id)) return state;

      const messages = [...list, message].sort((a, b) => a.timestamp - b.timestamp);
      const existing = state.chats.find((c) => c.chatId === message.chatId);
      const isUnread = message.direction === 'in' && state.activeChatId !== message.chatId;

      const chat: Chat = existing
        ? {
            ...existing,
            name: existing.name ?? chatName,
            phone: existing.phone || phone || '',
            unread: existing.unread + (isUnread ? 1 : 0),
            updatedAt: Math.max(existing.updatedAt, message.timestamp),
          }
        : {
            chatId: message.chatId,
            phone: phone ?? '',
            name: chatName,
            unread: isUnread ? 1 : 0,
            updatedAt: message.timestamp,
          };

      return {
        ...state,
        chats: existing
          ? state.chats.map((c) => (c.chatId === chat.chatId ? chat : c))
          : [chat, ...state.chats],
        messages: { ...state.messages, [message.chatId]: messages },
      };
    }

    case 'messageSent': {
      const list = state.messages[action.chatId] ?? [];
      // Если сообщение с настоящим id уже пришло уведомлением, локальная копия лишняя
      if (list.some((m) => m.id === action.idMessage)) {
        return {
          ...state,
          messages: {
            ...state.messages,
            [action.chatId]: list.filter((m) => m.id !== action.localId),
          },
        };
      }
      return patchMessage(state, action.chatId, action.localId, (m) => ({
        ...m,
        id: action.idMessage,
        status: 'sent',
        error: undefined,
      }));
    }

    case 'messageFailed':
      return patchMessage(state, action.chatId, action.id, (m) => ({
        ...m,
        status: 'failed',
        error: action.error,
      }));

    case 'messageRetried':
      return patchMessage(state, action.chatId, action.id, (m) => ({
        ...m,
        status: 'pending',
        error: undefined,
      }));

    case 'statusChanged':
      return patchMessage(state, action.chatId, action.id, (m) => {
        const current = m.status ?? 'sent';
        if (action.status === 'failed') {
          return STATUS_RANK[current] >= STATUS_RANK.delivered
            ? m
            : { ...m, status: 'failed', error: 'Получатель не получил сообщение.' };
        }
        return STATUS_RANK[action.status] > STATUS_RANK[current] ? { ...m, status: action.status } : m;
      });
  }
}

/**
 * Восстанавливает состояние из хранилища. Сообщения, которые отправлялись
 * в момент перезагрузки страницы, помечаются как неотправленные.
 */
export function reviveChatState(raw: unknown): ChatState {
  if (!raw || typeof raw !== 'object') return emptyChatState;
  const saved = raw as Partial<ChatState>;
  if (!Array.isArray(saved.chats) || typeof saved.messages !== 'object' || !saved.messages) {
    return emptyChatState;
  }
  const messages: Record<string, Message[]> = {};
  for (const [chatId, list] of Object.entries(saved.messages)) {
    messages[chatId] = list.map((m) =>
      m.status === 'pending' ? { ...m, status: 'failed', error: 'Отправка прервана.' } : m,
    );
  }
  return {
    chats: saved.chats,
    messages,
    activeChatId: saved.activeChatId ?? null,
  };
}
