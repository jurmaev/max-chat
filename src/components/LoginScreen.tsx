import { useState, type FormEvent } from 'react';
import { createGreenApi, getErrorMessage } from '../api/greenApi';
import type { Credentials } from '../api/types';

const STATE_MESSAGES: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API и попробуйте снова.',
  starting: 'Инстанс запускается. Попробуйте через минуту.',
  blocked: 'Аккаунт инстанса заблокирован.',
  sleepMode: 'Инстанс в спящем режиме: телефон с MAX не в сети.',
  yellowCard: 'Отправка сообщений временно ограничена мессенджером.',
};

interface Props {
  onLogin: (credentials: Credentials) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [form, setForm] = useState<Credentials>({
    apiUrl: 'https://api.green-api.com',
    idInstance: '',
    apiTokenInstance: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof Credentials) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const credentials: Credentials = {
      apiUrl: form.apiUrl.trim(),
      idInstance: form.idInstance.trim(),
      apiTokenInstance: form.apiTokenInstance.trim(),
    };

    if (!/^https?:\/\/\S+$/.test(credentials.apiUrl)) {
      setError('apiUrl должен начинаться с https://');
      return;
    }
    if (!/^\d+$/.test(credentials.idInstance)) {
      setError('idInstance состоит только из цифр.');
      return;
    }
    if (!credentials.apiTokenInstance) {
      setError('Введите apiTokenInstance.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { stateInstance } = await createGreenApi(credentials).getStateInstance();
      if (stateInstance === 'authorized') {
        onLogin(credentials);
        return;
      }
      setError(STATE_MESSAGES[stateInstance] ?? `Инстанс в состоянии «${stateInstance}», отправка недоступна.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <div className="login__logo" aria-hidden="true">💬</div>
        <h1 className="login__title">Вход в MAX Chat</h1>
        <p className="login__lead">
          Данные инстанса есть в{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личном кабинете GREEN-API
          </a>
          .
        </p>

        <label className="field">
          <span className="field__label">apiUrl</span>
          <input
            className="field__input"
            value={form.apiUrl}
            onChange={(e) => update('apiUrl')(e.target.value)}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            value={form.idInstance}
            onChange={(e) => update('idInstance')(e.target.value)}
            inputMode="numeric"
            placeholder="3100000000"
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            type="password"
            value={form.apiTokenInstance}
            onChange={(e) => update('apiTokenInstance')(e.target.value)}
            autoComplete="current-password"
            spellCheck={false}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="button button--primary button--wide" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
