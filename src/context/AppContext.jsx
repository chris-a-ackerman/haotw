// AppContext.jsx — shared session/auth/determinations state, provided by App
// so screens can read it without prop drilling.

import React from 'react';

const AppContext = React.createContext(null);

export function AppProvider({ value, children }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
