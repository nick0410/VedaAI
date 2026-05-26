'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { useAuthStore } from '@/store/authStore';
import { updateMe } from '@/lib/api';
import { fileToCenteredCroppedDataUrl } from '@/lib/image';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, clear } = useAuthStore();
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setSchoolName(user.schoolName);
      setSchoolLocation(user.schoolLocation ?? '');
      setAvatar(user.avatarDataUrl ?? null);
    }
  }, [user]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ kind: 'err', text: 'Image must be under 5 MB.' });
      return;
    }
    setPhotoBusy(true);
    setMessage(null);
    try {
      const dataUrl = await fileToCenteredCroppedDataUrl(file, 256, 0.85);
      const updated = await updateMe({ avatarDataUrl: dataUrl });
      setUser(updated);
      setAvatar(updated.avatarDataUrl ?? null);
      setMessage({ kind: 'ok', text: 'Photo updated.' });
    } catch (err) {
      setMessage({ kind: 'err', text: (err as Error).message });
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setMessage(null);
    try {
      const updated = await updateMe({ avatarDataUrl: null });
      setUser(updated);
      setAvatar(null);
      setMessage({ kind: 'ok', text: 'Photo removed.' });
    } catch (err) {
      setMessage({ kind: 'err', text: (err as Error).message });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!name.trim() || !schoolName.trim()) {
      setMessage({ kind: 'err', text: 'Name and school are required.' });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMe({
        name: name.trim(),
        schoolName: schoolName.trim(),
        schoolLocation: schoolLocation.trim() || undefined,
      });
      setUser(updated);
      setMessage({ kind: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ kind: 'err', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  function onLogout() {
    clear();
    router.replace('/login');
  }

  return (
    <AppShell title="Settings" subtitle="Manage your profile and workspace preferences.">
      <div className="max-w-2xl space-y-6">
        {/* Photo */}
        <div className="surface p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar
                src={avatar ?? undefined}
                name={user?.name ?? '?'}
                size={88}
                className="ring-4 ring-page"
              />
              {photoBusy && (
                <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-ink-200 border-t-ink-900 animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onPickFile}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy}
                  className="btn-dark"
                >
                  {avatar ? 'Change photo' : 'Upload photo'}
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoBusy}
                    className="btn-outline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="field-help">JPG, PNG or WebP. Auto-cropped to a square, resized to 256×256.</p>
            </div>
          </div>
        </div>

        {/* Profile */}
        <form onSubmit={onSave} className="surface p-6 space-y-5">
          <h2 className="font-semibold text-ink-900">Profile</h2>

          <div>
            <label className="field-label">Full name</label>
            <input className="field-input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="field-label">Email</label>
            <input className="field-input mt-1.5 cursor-not-allowed bg-ink-50 text-ink-500" value={user?.email ?? ''} disabled />
            <p className="field-help mt-1">Email cannot be changed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">School name</label>
              <input className="field-input mt-1.5" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">School location <span className="text-ink-400 font-normal">(optional)</span></label>
              <input className="field-input mt-1.5" value={schoolLocation} onChange={(e) => setSchoolLocation(e.target.value)} />
            </div>
          </div>
          <p className="field-help">
            The school name appears as the header of every generated question paper.
          </p>

          {message && (
            <div className={`rounded-lg px-3 py-2 text-sm ${message.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-line">
            <button type="submit" className="btn-dark" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <div className="surface p-6 space-y-3">
          <h2 className="font-semibold text-ink-900">Session</h2>
          <p className="text-sm text-ink-500">Log out of this device. Your assignments remain saved on the server.</p>
          <button onClick={onLogout} className="btn-outline">Log out</button>
        </div>
      </div>
    </AppShell>
  );
}
