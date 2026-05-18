import { Navigate } from "react-router-dom";
import { AuthForm } from "../features/auth/components/AuthForm";
import { useAuth } from "../features/auth/AuthContext";

type AuthPageProps = {
  mode: "login" | "register";
};

function AuthPage({ mode }: AuthPageProps) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <main className="app-shell auth-loading-shell">
        <div className="page-placeholder-card">Nalaganje racuna...</div>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthForm mode={mode} />;
}

export { AuthPage };
