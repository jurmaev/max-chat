import { memo } from 'react';
import type { Message } from '../model/types';
import { formatTime } from '../utils/format';
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from './icons';

const STATUS_LABEL = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
} as const;

function StatusIcon({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending':
      return <ClockIcon />;
    case 'sent':
      return <CheckIcon />;
    case 'delivered':
      return <DoubleCheckIcon />;
    case 'read':
      return <DoubleCheckIcon className="status--read" />;
    case 'failed':
      return <AlertIcon className="status--failed" />;
    default:
      return null;
  }
}

interface Props {
  message: Message;
  onRetry: (message: Message) => void;
}

export const MessageBubble = memo(function MessageBubble({ message, onRetry }: Props) {
  const outgoing = message.direction === 'out';
  return (
    <div className={`message message--${message.direction}`}>
      <div className={`bubble${message.status === 'failed' ? ' bubble--failed' : ''}`}>
        <span className="bubble__text">{message.text}</span>
        <span className="bubble__meta">
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
          {outgoing && message.status && (
            <span className="bubble__status" title={STATUS_LABEL[message.status]}>
              <StatusIcon status={message.status} />
              <span className="visually-hidden">{STATUS_LABEL[message.status]}</span>
            </span>
          )}
        </span>
      </div>
      {message.status === 'failed' && (
        <div className="message__error">
          <span>{message.error ?? 'Не удалось отправить.'}</span>
          <button type="button" className="link-button" onClick={() => onRetry(message)}>
            Повторить
          </button>
        </div>
      )}
    </div>
  );
});
