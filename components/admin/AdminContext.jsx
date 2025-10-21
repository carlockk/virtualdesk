'use client';

import { createContext, useContext } from 'react';

const AdminContext = createContext({
  user: null,
  isSuperAdmin: false,
});

export function AdminProvider({ value, children }) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}
