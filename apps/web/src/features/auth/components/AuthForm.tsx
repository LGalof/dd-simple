import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

type AuthFormProps = {
  mode: "login" | "register";
};

function AuthForm({ mode }: AuthFormProps) {
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

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prijava ni uspela");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Dostop do racuna</p>
          <h1>{isRegisterMode ? "Registracija" : "Prijava"}</h1>
          <p>
            {isRegisterMode
              ? "Ustvari racun za svoj zasebni prostor z D&D liki."
              : "Prijavi se za nadaljevanje urejanja svojih D&D Simple likov."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <label className="auth-field">
              <span>Prikazno ime</span>
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
            <span>Geslo</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Vsaj 8 znakov"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              minLength={isRegisterMode ? 8 : undefined}
              required
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting
              ? "Prosim pocakaj..."
              : isRegisterMode
                ? "Registracija"
                : "Prijava"}
          </button>

          <p className="auth-switch">
            {isRegisterMode ? "Ze imas racun?" : "Nov uporabnik?"}
            <Link to={isRegisterMode ? "/prijava" : "/registracija"}>
              {isRegisterMode ? "Prijava" : "Registracija"}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export { AuthForm };
