import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthScreen } from "./components/AuthScreen";
import { AppShell } from "./components/AppShell";
import { getSupabase, hasSupabaseConfig } from "./lib/supabase";
import type { UserIdentity } from "./types";

type AuthStatus = "loading" | "ready";

function toIdentity(user: User | null): UserIdentity | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? "Signed-in user" };
}

export default function App() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("ready");
      return;
    }

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setIdentity(toIdentity(data.user));
      setStatus("ready");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setIdentity(toIdentity(session?.user ?? null));
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (demoMode) {
      setDemoMode(false);
      return;
    }
    await getSupabase()?.auth.signOut();
    setIdentity(null);
  }

  if (status === "loading") {
    return (
      <main className="loading-screen" aria-live="polite">
        <span className="brand-mark" aria-hidden="true">10</span>
        <p>Getting your space ready…</p>
      </main>
    );
  }

  const activeIdentity = demoMode
    ? { id: "demo-user", email: "demo@littlekicks.app" }
    : identity;

  if (!activeIdentity) {
    return (
      <AuthScreen
        configured={hasSupabaseConfig}
        onDemo={() => setDemoMode(true)}
      />
    );
  }

  return (
    <AppShell
      user={activeIdentity}
      demoMode={demoMode}
      onSignOut={signOut}
    />
  );
}
