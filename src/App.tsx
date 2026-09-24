import { useState } from 'react';
import type { Credentials } from './api/types';
import { LoginScreen } from './components/LoginScreen';
import { Messenger } from './components/Messenger';
import { clearCredentials, loadCredentials, saveCredentials } from './utils/storage';

export function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);

  if (!credentials) {
    return (
      <LoginScreen
        onLogin={(value) => {
          saveCredentials(value);
          setCredentials(value);
        }}
      />
    );
  }

  return (
    <Messenger
      key={credentials.idInstance}
      credentials={credentials}
      onLogout={() => {
        clearCredentials();
        setCredentials(null);
      }}
    />
  );
}
