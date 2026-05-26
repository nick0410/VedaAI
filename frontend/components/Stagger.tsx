'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerForm({
  children,
  className,
  ...rest
}: HTMLMotionProps<'form'>) {
  return (
    <motion.form
      className={className}
      initial="hidden"
      animate="show"
      variants={containerVariants}
      {...rest}
    >
      {children}
    </motion.form>
  );
}

export function StaggerDiv({
  children,
  className,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={containerVariants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={itemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}
