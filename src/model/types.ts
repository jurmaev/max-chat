export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  /** idMessage из GREEN-API или локальный id, пока сообщение отправляется. */
  id: string;
  chatId: string;
  text: string;
  direction: 'in' | 'out';
  /** Unix-время в миллисекундах. */
  timestamp: number;
  status?: MessageStatus;
  error?: string;
}

export interface Chat {
  chatId: string;
  /** Номер, по которому создан чат (только цифры). Пустой для входящих от незнакомых. */
  phone: string;
  name?: string;
  unread: number;
  updatedAt: number;
}
