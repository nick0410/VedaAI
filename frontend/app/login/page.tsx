'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { StaggerForm, StaggerItem } from '@/components/Stagger';
import { useAuthStore } from '@/store/authStore';
import { login } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { token, hydrated, setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) router.replace('/');
  }, [hydrated, token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      const { token: t, user } = await login(email.trim(), password);
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
      title="Welcome back"
      subtitle="Log in to access your assignments and library."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-ink-900 font-medium hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <StaggerForm className="space-y-4" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            className="field-input mt-1.5"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
            {submitting ? 'Signing in…' : 'Log in'}
          </motion.button>
        </StaggerItem>
      </StaggerForm>
    </AuthLayout>
  );
}
