import { Navigate, useLocation } from "react-router-dom";
import { AuthForm } from "../features/auth/components/AuthForm";
import { useAuth } from "../features/auth/AuthContext";

type AuthPageProps = {
  mode: "login" | "register";
};

function AuthPage({ mode }: AuthPageProps) {
  const { loading, user } = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  if (loading) {
    return (
      <main className="app-shell auth-loading-shell">
        <div className="page-placeholder-card">Loading account...</div>
      </main>
    );
  }

  if (user) {
    return <Navigate to={returnTo ?? "/"} replace />;
  }

  return <AuthForm mode={mode} returnTo={returnTo} />;
}

export { AuthPage };
