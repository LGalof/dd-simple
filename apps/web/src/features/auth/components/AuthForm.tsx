import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

type AuthFormProps = {
  mode: "login" | "register";
  returnTo?: string;
};

function AuthForm({ mode, returnTo }: AuthFormProps) {
  const isRegisterMode = mode === "register";
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegisterMode) {
        await register({
          displayName,
          email,
          password,
        });
      } else {
        await login({
          email,
          password,
        });
      }

      navigate(returnTo ?? "/", {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Account access</p>
          <h1>{isRegisterMode ? "Register" : "Log in"}</h1>
          <p>
            {isRegisterMode
              ? "Create an account for your personal D&D character workspace."
              : "Log in to continue managing your D&D Simple characters."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <label className="auth-field">
              <span>Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Aria Stormborn"
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              minLength={isRegisterMode ? 8 : undefined}
              required
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : isRegisterMode
                ? "Register"
                : "Log in"}
          </button>

          <p className="auth-switch">
            {isRegisterMode ? "Already have an account?" : "New user?"}
            <Link
              to={isRegisterMode ? "/login" : "/register"}
              state={returnTo ? { returnTo } : undefined}
            >
              {isRegisterMode ? "Log in" : "Register"}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export { AuthForm };
