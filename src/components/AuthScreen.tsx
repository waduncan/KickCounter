import { type FormEvent, useState } from "react";
import { getSupabase } from "../lib/supabase";

interface AuthScreenProps {
  configured: boolean;
  onDemo: () => void;
}

export function AuthScreen({ configured, onDemo }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    setMessage(null);

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Check your inbox to confirm your email, then come back to sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <a className="brand brand-on-dark" href="/" aria-label="Little Kicks home">
          <span className="brand-mark" aria-hidden="true">10</span>
          <span>Little Kicks</span>
        </a>
        <div className="auth-copy">
          <p className="eyebrow eyebrow-light">A calm place to keep count</p>
          <h1>Tiny moments,<br />clearly tracked.</h1>
          <p>
            One simple tap for every movement, with a clear timer and personal
            patterns you can revisit together.
          </p>
        </div>
        <div className="auth-preview" aria-hidden="true">
          <div className="preview-orbit preview-orbit-one" />
          <div className="preview-orbit preview-orbit-two" />
          <div className="preview-core">
            <strong>7</strong>
            <span>of 10</span>
          </div>
          <div className="preview-time">08:42</div>
        </div>
        <p className="privacy-note">Private by design. Your records stay in your account.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Welcome to Little Kicks</p>
          <h2>{mode === "signin" ? "Good to see you." : "Create your space."}</h2>
          <p className="muted">
            {mode === "signin"
              ? "Sign in to continue your movement log."
              : "Use an email you can access on all your devices."}
          </p>

          {configured ? (
            <form className="auth-form" onSubmit={submit}>
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {error && <p className="form-message form-error" role="alert">{error}</p>}
              {message && <p className="form-message form-success" role="status">{message}</p>}
              <button className="button button-primary button-wide" disabled={busy} type="submit">
                {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          ) : (
            <div className="setup-card">
              <span className="setup-number">01</span>
              <div>
                <strong>Connect Supabase to sign in</strong>
                <p>Add the two project variables from the included setup guide.</p>
              </div>
            </div>
          )}

          {configured && (
            <button
              className="text-button auth-switch"
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setMessage(null);
              }}
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          )}

          {!configured && (
            <button className="button button-secondary button-wide" type="button" onClick={onDemo}>
              Explore with sample data
            </button>
          )}

          <p className="auth-footnote">
            By continuing, you agree to use this as a personal record—not a substitute
            for advice from your maternity care team.
          </p>
        </div>
      </section>
    </main>
  );
}
