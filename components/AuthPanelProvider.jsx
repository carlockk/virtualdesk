'use client';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AuthPanel from './AuthPanel';

const AuthPanelContext = createContext({
  open: false,
  mode: 'login',
  show: () => {},
  hide: () => {},
});

export function AuthPanelProvider({ children }) {
  const [state, setState] = useState({ open: false, mode: 'login' });

  const show = useCallback((mode = 'login') => {
    setState({ open: true, mode });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(
    () => ({
      open: state.open,
      mode: state.mode,
      show,
      hide,
    }),
    [state.open, state.mode, show, hide],
  );

  return (
    <AuthPanelContext.Provider value={value}>
      {children}
      <AuthPanel open={state.open} mode={state.mode} onClose={hide} />
    </AuthPanelContext.Provider>
  );
}

export function useAuthPanel() {
  return useContext(AuthPanelContext);
}
