import { Fragment, useLayoutEffect, useRef } from 'react';
import type { Chat, Message } from '../model/types';
import { dayKey, formatDay } from '../utils/format';
import { formatPhone } from '../utils/phone';
import { Avatar } from './Avatar';
import { Composer } from './Composer';
import { BackIcon } from './icons';
import { MessageBubble } from './MessageBubble';
import { chatTitle } from './Sidebar';

/** Насколько близко к низу (px) считаем, что пользователь «внизу» ленты. */
const STICK_THRESHOLD = 80;

interface Props {
  chat: Chat;
  messages: Message[];
  onSend: (text: string) => void;
  onRetry: (message: Message) => void;
  onBack: () => void;
}

export function ChatWindow({ chat, messages, onSend, onRetry, onBack }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastChatId = useRef<string | null>(null);

  // Прокручиваем вниз при открытии чата и при новых сообщениях,
  // но не выдёргиваем пользователя, если он читает историю выше.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const chatChanged = lastChatId.current !== chat.chatId;
    lastChatId.current = chat.chatId;
    const last = messages.at(-1);
    if (chatChanged || stickToBottom.current || last?.direction === 'out') {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat.chatId, messages]);

  const title = chatTitle(chat);
  const subtitle = chat.name && chat.phone ? formatPhone(chat.phone) : 'MAX';

  return (
    <section className="chat" aria-label={`Чат: ${title}`}>
      <header className="chat__header">
        <button className="icon-button chat__back" type="button" onClick={onBack} aria-label="К списку чатов">
          <BackIcon />
        </button>
        <Avatar id={chat.chatId} title={title} size="sm" />
        <div className="chat__heading">
          <h2 className="chat__title">{title}</h2>
          <p className="chat__subtitle">{subtitle}</p>
        </div>
      </header>

      <div
        className="chat__messages"
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
        }}
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="chat__empty">Напишите первое сообщение — оно придёт получателю в MAX.</p>
        ) : (
          messages.map((message, index) => {
            const showDay = index === 0 || dayKey(messages[index - 1].timestamp) !== dayKey(message.timestamp);
            return (
              <Fragment key={message.id}>
                {showDay && <div className="day-separator">{formatDay(message.timestamp)}</div>}
                <MessageBubble message={message} onRetry={onRetry} />
              </Fragment>
            );
          })
        )}
      </div>

      <Composer key={chat.chatId} onSend={onSend} />
    </section>
  );
}
