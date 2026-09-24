import { useState, type FormEvent } from 'react';
import { getErrorMessage } from '../api/greenApi';
import { normalizePhone } from '../utils/phone';
import { PlusIcon } from './icons';

interface Props {
  onCreate: (phone: string) => Promise<void>;
}

export function NewChatForm({ onCreate }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const phone = normalizePhone(value);
    if (!phone) {
      setError('Введите номер с кодом 7 или 375, например 79991234567.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate(phone);
      setValue('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="new-chat" onSubmit={handleSubmit} noValidate>
      <div className="new-chat__row">
        <input
          className="new-chat__input"
          type="tel"
          inputMode="tel"
          placeholder="Номер получателя"
          aria-label="Номер телефона получателя"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          disabled={loading}
        />
        <button
          className="icon-button icon-button--accent"
          type="submit"
          disabled={loading || !value.trim()}
          aria-label="Создать чат"
          title="Создать чат"
        >
          {loading ? <span className="spinner" /> : <PlusIcon />}
        </button>
      </div>
      {error && (
        <p className="form-error form-error--compact" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
