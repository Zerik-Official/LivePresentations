import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  as?: "div" | "li";
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function Reveal({ as = "div", delay = 0, className = "", children }: RevealProps): React.ReactNode {
  const reduceMotion = useReducedMotion();
  const Component = as === "li" ? motion.li : motion.div;

  if (reduceMotion) return <Component className={className}>{children}</Component>;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
