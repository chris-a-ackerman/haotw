// ChampionRoute.jsx — route guard for /issue. Non-champions get redirected
// to home. Champion status is derived from the active session's claimed
// hybrid profile matching the latest determination's winners.

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

function ChampionRoute() {
  const { isChampion } = useAppContext();
  if (!isChampion) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default ChampionRoute;
