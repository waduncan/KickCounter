import { useEffect, useState } from "react";
import {
  createSession,
  loadSessions,
  loadUserProfile,
  saveUserProfile,
} from "../lib/data";
import type {
  AppTab,
  KickSession,
  NewKickSession,
  UserIdentity,
  UserProfile,
  UserProfileInput,
} from "../types";
import { History } from "./History";
import { Insights } from "./Insights";
import { Profile } from "./Profile";
import { Tracker } from "./Tracker";

interface AppShellProps {
  user: UserIdentity;
  demoMode: boolean;
  onSignOut: () => Promise<void>;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; shortLabel: string }> = [
  { id: "today", label: "Today", shortLabel: "Today" },
  { id: "insights", label: "Insights", shortLabel: "Insights" },
  { id: "history", label: "History", shortLabel: "History" },
];

export function AppShell({ user, demoMode, onSignOut }: AppShellProps) {
  const [tab, setTab] = useState<AppTab>("today");
  const [sessions, setSessions] = useState<KickSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadSessions(demoMode)
      .then((result) => {
        if (!active) return;
        setSessions(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Your sessions could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demoMode]);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    loadUserProfile(demoMode)
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setProfileError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setProfileError(loadError instanceof Error ? loadError.message : "Your profile could not be loaded.");
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [demoMode]);

  async function saveSession(input: NewKickSession) {
    const created = await createSession(input, user.id, demoMode);
    setSessions((current) => [created, ...current]);
    return created;
  }

  async function saveProfile(input: UserProfileInput) {
    const saved = await saveUserProfile(input, user.id, demoMode);
    setProfile(saved);
    setProfileError(null);
    return saved;
  }

  const initials = user.email.slice(0, 2).toUpperCase();
  const hasProfileDetails = Boolean(
    profile?.expected_due_date ||
    profile?.baby_name ||
    profile?.doctor_name ||
    profile?.doctor_phone ||
    profile?.doctor_website,
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand brand-button" type="button" onClick={() => setTab("today")}>
          <span className="brand-mark" aria-hidden="true">10</span>
          <span>Little Kicks</span>
        </button>

        <nav className="desktop-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "nav-item nav-item-active" : "nav-item"}
              type="button"
              onClick={() => {
                setTab(item.id);
                setProfileOpen(false);
              }}
              aria-current={tab === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="profile-wrap">
          <button
            className="profile-button"
            type="button"
            aria-label="Open account menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
          >
            {initials}
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <span className="profile-email">{demoMode ? "Sample data mode" : user.email}</span>
              <button
                className="profile-menu-item"
                type="button"
                onClick={() => {
                  setTab("profile");
                  setProfileOpen(false);
                }}
              >
                <span>{hasProfileDetails ? "Edit profile" : "Set up profile"}</span>
                <span aria-hidden="true">→</span>
              </button>
              <button className="profile-menu-item profile-menu-signout" type="button" onClick={onSignOut}>
                {demoMode ? "Exit sample mode" : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </header>

      {demoMode && (
        <div className="demo-banner" role="status">
          <span>Sample data mode</span>
          <p>Try every feature. New sessions are kept only on this device.</p>
        </div>
      )}

      {error && (
        <div className="app-error" role="alert">
          <strong>We couldn’t load your records.</strong>
          <span>{error}</span>
        </div>
      )}

      <main className="app-main">
        {tab === "today" && (
          <Tracker
            userId={user.id}
            sessions={sessions}
            onSave={saveSession}
            onShowInsights={() => setTab("insights")}
          />
        )}
        {tab === "insights" && <Insights sessions={sessions} loading={loading} />}
        {tab === "history" && <History sessions={sessions} loading={loading} />}
        {tab === "profile" && (
          <Profile
            email={demoMode ? "Sample data mode" : user.email}
            profile={profile}
            loading={profileLoading}
            loadError={profileError}
            onSave={saveProfile}
          />
        )}
      </main>

      <nav className="mobile-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "mobile-nav-item mobile-nav-active" : "mobile-nav-item"}
            type="button"
            onClick={() => {
              setTab(item.id);
              setProfileOpen(false);
            }}
            aria-current={tab === item.id ? "page" : undefined}
          >
            <span className={`nav-dot nav-dot-${item.id}`} aria-hidden="true" />
            {item.shortLabel}
          </button>
        ))}
      </nav>
    </div>
  );
}
