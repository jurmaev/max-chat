/** Учётные данные инстанса из личного кабинета GREEN-API. */
export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface StateInstanceResponse {
  stateInstance: 'authorized' | 'notAuthorized' | 'starting' | 'blocked' | 'sleepMode' | 'yellowCard' | string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: string;
  phoneNumber?: number;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface SenderData {
  chatId: string;
  chatName?: string;
  sender?: string;
  senderName?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
}

/** Тело уведомления HTTP API. Поля зависят от typeWebhook, поэтому всё, кроме него, опционально. */
export interface NotificationBody {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  senderData?: SenderData;
  messageData?: MessageData;
  // outgoingMessageStatus
  chatId?: string;
  status?: string;
}

export interface ReceivedNotification {
  receiptId: number;
  body: NotificationBody;
}
