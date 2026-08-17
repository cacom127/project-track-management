import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { isAuthenticated } from "../lib/auth";

type Props = {
  children: ReactNode;
};

/** UI-AUTH-03-1: chưa có token hợp lệ trong localStorage -> về /login. */
export function RouteGuard({ children }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default RouteGuard;
