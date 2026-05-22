import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <main className="app-shell auth-loading-shell">
        <div className="page-placeholder-card">Nalaganje racuna...</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/prijava" replace />;
  }

  return <>{children}</>;
}

export { ProtectedRoute };
