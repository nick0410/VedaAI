'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950 text-white">
        {/* Animated glows */}
        <motion.div
          aria-hidden
          className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl"
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute right-1/3 top-10 h-40 w-40 rounded-full bg-brand-500/15 blur-2xl"
          initial={{ y: 0 }}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute left-10 top-1/3 h-32 w-32 rounded-full bg-white/5 blur-3xl"
          animate={{ x: [0, 16, 0], y: [0, -10, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="relative z-10 flex flex-col justify-between p-12 w-full"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
        >
          <motion.div variants={fadeUp}>
            <Link href="/" className="flex items-center gap-2 w-fit">
              <motion.span
                className="h-8 w-8 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold shadow-cta"
                whileHover={{ rotate: -8, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 240, damping: 16 }}
              >
                V
              </motion.span>
              <span className="font-semibold">VedaAI</span>
            </Link>
          </motion.div>

          <div>
            <motion.h2 variants={fadeUp} className="text-3xl font-semibold leading-tight max-w-md">
              Build better assessments. <span className="text-brand-400">In seconds.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-sm text-ink-300 max-w-md leading-relaxed">
              Generate well-structured question papers, save them to your library, and download as PDF. Powered by Groq inference and a strict schema parser.
            </motion.p>

            <motion.ul variants={fadeUp} className="mt-8 space-y-3 text-sm text-ink-300">
              {[
                'Sectioned papers with difficulty + marks',
                'Live generation over WebSocket',
                'One-click PDF export',
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>
          <motion.p variants={fadeUp} className="text-xs text-ink-400">
            © VedaAI · Built for educators
          </motion.p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-page">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-6">
            <span className="h-8 w-8 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white shadow-cta">
              V
            </span>
            <span className="font-semibold text-ink-900">VedaAI</span>
          </Link>
          <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
          <p className="text-sm text-ink-500 mt-1">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink-500 text-center">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
