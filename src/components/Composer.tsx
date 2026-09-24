import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendIcon } from './icons';

const MAX_HEIGHT = 160;

interface Props {
  onSend: (text: string) => void;
}

export function Composer({ onSend }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  // Поле растёт вместе с текстом до MAX_HEIGHT, дальше появляется прокрутка
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  function submit() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
    ref.current?.focus();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter — отправить, Shift+Enter — перенос строки; не мешаем IME-вводу
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        ref={ref}
        className="composer__input"
        rows={1}
        placeholder="Сообщение"
        aria-label="Текст сообщения"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <button
        className="icon-button icon-button--accent composer__send"
        type="submit"
        disabled={!text.trim()}
        aria-label="Отправить"
        title="Отправить"
      >
        <SendIcon />
      </button>
    </form>
  );
}
