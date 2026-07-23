import { type FormEvent, useEffect, useState } from "react";
import type { UserProfile, UserProfileInput } from "../types";

interface ProfileProps {
  email: string;
  profile: UserProfile | null;
  loading: boolean;
  loadError: string | null;
  onSave: (input: UserProfileInput) => Promise<UserProfile>;
}

interface ProfileFormState {
  expectedDueDate: string;
  babyName: string;
  doctorName: string;
  doctorPhone: string;
  doctorWebsite: string;
}

const EMPTY_FORM: ProfileFormState = {
  expectedDueDate: "",
  babyName: "",
  doctorName: "",
  doctorPhone: "",
  doctorWebsite: "",
};

function formFromProfile(profile: UserProfile | null): ProfileFormState {
  if (!profile) return EMPTY_FORM;
  return {
    expectedDueDate: profile.expected_due_date ?? "",
    babyName: profile.baby_name ?? "",
    doctorName: profile.doctor_name ?? "",
    doctorPhone: profile.doctor_phone ?? "",
    doctorWebsite: profile.doctor_website ?? "",
  };
}

const DAY_MS = 86_400_000;
const FULL_TERM_DAYS = 40 * 7;

interface GestationalAge {
  weeks: number;
  days: number;
}

function dateOnlyToUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return utc;
}

function getGestationalAge(expectedDueDate: string, today = new Date()): GestationalAge | null {
  const dueDateUtc = dateOnlyToUtc(expectedDueDate);
  if (dueDateUtc === null) return null;

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilDue = Math.round((dueDateUtc - todayUtc) / DAY_MS);
  const gestationalDays = FULL_TERM_DAYS - daysUntilDue;
  if (gestationalDays < 0 || gestationalDays > 44 * 7) return null;

  return {
    weeks: Math.floor(gestationalDays / 7),
    days: gestationalDays % 7,
  };
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateWithOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function formatDueDate(value: string): string | null {
  const utc = dateOnlyToUtc(value);
  if (utc === null) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(utc));
}

export function Profile({ email, profile, loading, loadError, onSave }: ProfileProps) {
  const [form, setForm] = useState<ProfileFormState>(() => formFromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const gestationalAge = getGestationalAge(form.expectedDueDate);
  const formattedDueDate = formatDueDate(form.expectedDueDate);

  useEffect(() => {
    setForm(formFromProfile(profile));
  }, [profile]);

  function updateField(field: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await onSave({
        expectedDueDate: form.expectedDueDate,
        babyName: form.babyName,
        doctorName: form.doctorName,
        doctorPhone: form.doctorPhone,
        doctorWebsite: form.doctorWebsite,
      });
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="profile-page page-section">
        <div className="loading-card" aria-live="polite">Loading your profile…</div>
      </section>
    );
  }

  return (
    <section className="profile-page page-section">
      <div className="page-heading profile-heading">
        <div>
          <p className="eyebrow">Pregnancy profile</p>
          <h1>A little about you.</h1>
          <p>Keep important details close at hand and update them any time.</p>
        </div>
      </div>

      {loadError && (
        <p className="form-message form-error profile-load-error" role="alert">{loadError}</p>
      )}

      <div className="profile-layout">
        <aside className="profile-overview" aria-label="Profile summary">
          <div className="profile-week-mark">
            <strong>{gestationalAge?.weeks ?? "—"}</strong>
            <span>
              {gestationalAge?.days
                ? `weeks + ${gestationalAge.days}d`
                : "weeks"}
            </span>
          </div>
          <p className="eyebrow eyebrow-light">Your little one</p>
          <h2>{form.babyName.trim() || "Baby’s name"}</h2>
          {formattedDueDate && <p className="profile-due-date">Due {formattedDueDate}</p>}
          <p className="profile-overview-email">{email}</p>
          <div className="profile-care-note">
            <span aria-hidden="true">+</span>
            <div>
              <strong>Care details, ready for later</strong>
              <p>Your doctor’s phone number is stored so a quick-call option can be added in the future.</p>
            </div>
          </div>
        </aside>

        <form className="profile-form" onSubmit={submit}>
          <div className="profile-card">
            <div className="profile-card-heading">
              <span className="profile-section-number">01</span>
              <div>
                <h2>About the baby</h2>
                <p>Add what you know now. These details can change with you.</p>
              </div>
            </div>
            <div className="profile-fields profile-fields-two">
              <label className="profile-field">
                <span>Expected due date</span>
                <input
                  type="date"
                  min={dateWithOffset(-28)}
                  max={dateWithOffset(FULL_TERM_DAYS)}
                  value={form.expectedDueDate}
                  onInput={(event) => updateField("expectedDueDate", event.currentTarget.value)}
                />
                <small>Choose a date from four weeks ago through 40 weeks from today.</small>
                {gestationalAge && (
                  <span className="profile-derived-age" aria-live="polite">
                    <strong>
                      {gestationalAge.weeks} weeks
                      {gestationalAge.days
                        ? `, ${gestationalAge.days} ${gestationalAge.days === 1 ? "day" : "days"}`
                        : ""}
                    </strong>
                    <span>pregnant today</span>
                  </span>
                )}
              </label>
              <label className="profile-field">
                <span>Baby’s name</span>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={100}
                  placeholder="What do you call your little one?"
                  value={form.babyName}
                  onChange={(event) => updateField("babyName", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-heading">
              <span className="profile-section-number">02</span>
              <div>
                <h2>My doctor’s information</h2>
                <p>Save the provider details you may want when you need reassurance.</p>
              </div>
            </div>
            <div className="profile-fields">
              <label className="profile-field">
                <span>Doctor’s name</span>
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={200}
                  placeholder="Dr. Jane Smith"
                  value={form.doctorName}
                  onChange={(event) => updateField("doctorName", event.target.value)}
                />
              </label>
              <div className="profile-fields profile-fields-two">
                <label className="profile-field">
                  <span>Doctor’s phone number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={50}
                    placeholder="(555) 123-4567"
                    value={form.doctorPhone}
                    onChange={(event) => updateField("doctorPhone", event.target.value)}
                  />
                  <small>Saved for a future quick-call option.</small>
                </label>
                <label className="profile-field">
                  <span>Doctor’s website</span>
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    maxLength={500}
                    placeholder="https://example.com"
                    value={form.doctorWebsite}
                    onChange={(event) => updateField("doctorWebsite", event.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="profile-form-actions">
            <div aria-live="polite">
              {saveError && <p className="form-message form-error" role="alert">{saveError}</p>}
              {saved && <p className="form-message form-success">Your profile is up to date.</p>}
            </div>
            <button className="button button-primary" type="submit" disabled={saving || Boolean(loadError)}>
              {saving ? "Saving…" : profile ? "Save changes" : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
