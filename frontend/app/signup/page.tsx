'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { StaggerForm, StaggerItem } from '@/components/Stagger';
import { useAuthStore } from '@/store/authStore';
import { signup } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const { token, hydrated, setSession } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) router.replace('/');
  }, [hydrated, token, router]);

  function validate(): string | null {
    if (!name.trim()) return 'Name is required';
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!schoolName.trim()) return 'School name is required';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const { token: t, user } = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        schoolName: schoolName.trim(),
        schoolLocation: schoolLocation.trim() || undefined,
      });
      setSession(t, user);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your VedaAI workspace in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-ink-900 font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <StaggerForm className="space-y-4" onSubmit={onSubmit}>
        <StaggerItem>
          <label className="field-label">Full name</label>
          <input
            className="field-input mt-1.5"
            placeholder="e.g. Anita Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </StaggerItem>
        <StaggerItem>
          <label className="field-label">Email</label>
          <input
            type="email"
            autoComplete="email"
            className="field-input mt-1.5"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </StaggerItem>
        <StaggerItem>
          <label className="field-label">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="field-input mt-1.5"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </StaggerItem>
        <StaggerItem className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">School name</label>
            <input
              className="field-input mt-1.5"
              placeholder="e.g. Delhi Public School"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">School location <span className="text-ink-400 font-normal">(optional)</span></label>
            <input
              className="field-input mt-1.5"
              placeholder="Sector-4, Bokaro"
              value={schoolLocation}
              onChange={(e) => setSchoolLocation(e.target.value)}
            />
          </div>
        </StaggerItem>
        <AnimatePresence>
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700 overflow-hidden"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <StaggerItem>
          <motion.button
            type="submit"
            className="btn-dark w-full"
            disabled={submitting}
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </motion.button>
        </StaggerItem>
      </StaggerForm>
    </AuthLayout>
  );
}
