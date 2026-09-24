import { useMemo } from 'react';
import type { Chat, Message } from '../model/types';
import { formatListTime } from '../utils/format';
import { formatPhone } from '../utils/phone';
import { Avatar } from './Avatar';
import { LogoutIcon } from './icons';
import { NewChatForm } from './NewChatForm';

export const chatTitle = (chat: Chat) => chat.name || formatPhone(chat.phone) || `Чат ${chat.chatId}`;

interface Props {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  idInstance: string;
  connectionError: string | null;
  onSelect: (chatId: string) => void;
  onCreateChat: (phone: string) => Promise<void>;
  onLogout: () => void;
}

export function Sidebar({
  chats,
  messages,
  activeChatId,
  idInstance,
  connectionError,
  onSelect,
  onCreateChat,
  onLogout,
}: Props) {
  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats]);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1 className="sidebar__title">Чаты</h1>
        <button className="icon-button" type="button" onClick={onLogout} aria-label="Выйти" title="Выйти">
          <LogoutIcon />
        </button>
      </header>

      <NewChatForm onCreate={onCreateChat} />

      {connectionError && (
        <p className="banner" role="status">
          {connectionError} Переподключаемся…
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="sidebar__empty">
          Здесь появятся ваши переписки. Введите номер получателя выше, чтобы начать чат.
        </p>
      ) : (
        <ul className="chat-list">
          {sorted.map((chat) => {
            const last = messages[chat.chatId]?.at(-1);
            const title = chatTitle(chat);
            return (
              <li key={chat.chatId}>
                <button
                  type="button"
                  className={`chat-item${chat.chatId === activeChatId ? ' chat-item--active' : ''}`}
                  onClick={() => onSelect(chat.chatId)}
                  aria-current={chat.chatId === activeChatId ? 'true' : undefined}
                >
                  <Avatar id={chat.chatId} title={title} />
                  <span className="chat-item__body">
                    <span className="chat-item__top">
                      <span className="chat-item__title">{title}</span>
                      {last && <span className="chat-item__time">{formatListTime(last.timestamp)}</span>}
                    </span>
                    <span className="chat-item__bottom">
                      <span className="chat-item__preview">
                        {last ? (
                          <>
                            {last.direction === 'out' && <span className="chat-item__you">Вы: </span>}
                            {last.text}
                          </>
                        ) : (
                          'Нет сообщений'
                        )}
                      </span>
                      {chat.unread > 0 && (
                        <span className="badge" aria-label={`Непрочитанных: ${chat.unread}`}>
                          {chat.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="sidebar__footer">Инстанс {idInstance}</footer>
    </aside>
  );
}
