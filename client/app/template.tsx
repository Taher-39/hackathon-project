"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Next.js re-mounts `template.tsx` on every route change (unlike layout.tsx),
 * so this gives every page in the app the same subtle entrance transition
 * without editing each route individually.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
