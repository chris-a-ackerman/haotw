// AdminRoute.jsx — route guard for /tree/admin. Non-admins get redirected
// to /tree. Admin status is derived in App.jsx (profiles.is_admin in live
// mode; Jake Bernhardt's claim OR DEV_ADMIN_EMAILS in dev mode).

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

function AdminRoute() {
  const { isAdmin } = useAppContext();
  if (!isAdmin) return <Navigate to="/tree" replace />;
  return <Outlet />;
}

export default AdminRoute;
