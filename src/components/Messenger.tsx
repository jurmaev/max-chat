import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { createGreenApi, getErrorMessage } from '../api/greenApi';
import type { Credentials, NotificationBody } from '../api/types';
import { useNotifications } from '../hooks/useNotifications';
import { chatReducer, reviveChatState } from '../model/chatReducer';
import { toChatEvent } from '../model/notifications';
import type { Message } from '../model/types';
import { chatStateKey, loadJson, saveJson } from '../utils/storage';
import { ChatWindow } from './ChatWindow';
import { Sidebar } from './Sidebar';

const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

interface Props {
  credentials: Credentials;
  onLogout: () => void;
}

export function Messenger({ credentials, onLogout }: Props) {
  const api = useMemo(() => createGreenApi(credentials), [credentials]);
  const storageKey = chatStateKey(credentials.idInstance);
  const [state, dispatch] = useReducer(chatReducer, storageKey, (key) => reviveChatState(loadJson(key)));

  useEffect(() => {
    saveJson(storageKey, state);
  }, [storageKey, state]);

  const handleNotification = useCallback((body: NotificationBody) => {
    const event = toChatEvent(body);
    if (!event) return;
    if (event.kind === 'message') {
      dispatch({ type: 'messageAdded', message: event.message, chatName: event.chatName, phone: event.phone });
    } else {
      dispatch({ type: 'statusChanged', chatId: event.chatId, id: event.id, status: event.status });
    }
  }, []);

  const connectionError = useNotifications(api, handleNotification);

  const createChat = useCallback(
    async (phone: string) => {
      const existing = state.chats.find((c) => c.phone === phone);
      if (existing) {
        dispatch({ type: 'chatSelected', chatId: existing.chatId });
        return;
      }
      // В MAX сообщения адресуются по chatId, поэтому сначала узнаём его по номеру
      const account = await api.checkAccount(Number(phone));
      if (!account?.exist || !account.chatId) {
        throw new Error('На этот номер не зарегистрирован аккаунт MAX.');
      }
      dispatch({ type: 'chatOpened', chatId: account.chatId, phone });
    },
    [api, state.chats],
  );

  const deliver = useCallback(
    async (chatId: string, id: string, text: string) => {
      try {
        const { idMessage } = await api.sendMessage(chatId, text);
        dispatch({ type: 'messageSent', chatId, localId: id, idMessage });
      } catch (error) {
        dispatch({ type: 'messageFailed', chatId, id, error: getErrorMessage(error) });
      }
    },
    [api],
  );

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId) ?? null;

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeChat) return;
      const message: Message = {
        id: createLocalId(),
        chatId: activeChat.chatId,
        text,
        direction: 'out',
        timestamp: Date.now(),
        status: 'pending',
      };
      dispatch({ type: 'messageAdded', message });
      void deliver(message.chatId, message.id, text);
    },
    [activeChat, deliver],
  );

  const retryMessage = useCallback(
    (message: Message) => {
      dispatch({ type: 'messageRetried', chatId: message.chatId, id: message.id });
      void deliver(message.chatId, message.id, message.text);
    },
    [deliver],
  );

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        activeChatId={state.activeChatId}
        idInstance={credentials.idInstance}
        connectionError={connectionError}
        onSelect={(chatId) => dispatch({ type: 'chatSelected', chatId })}
        onCreateChat={createChat}
        onLogout={onLogout}
      />
      <main className="messenger__main">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            messages={state.messages[activeChat.chatId] ?? []}
            onSend={sendMessage}
            onRetry={retryMessage}
            onBack={() => dispatch({ type: 'chatSelected', chatId: null })}
          />
        ) : (
          <div className="placeholder">
            <p>Выберите чат или создайте новый по номеру телефона</p>
          </div>
        )}
      </main>
    </div>
  );
}
