"use client";

import { useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export function useDashboardMotion() {
  const prefersReducedMotion = useReducedMotion();

  const duration = prefersReducedMotion ? 0.15 : 0.45;
  const stagger = prefersReducedMotion ? 0 : 0.07;
  const offsetY = prefersReducedMotion ? 0 : 14;
  const offsetYSmall = prefersReducedMotion ? 0 : 10;

  return {
    page: {
      initial: { opacity: 0, y: offsetYSmall },
      animate: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: EASE },
      },
    },
    section: {
      initial: { opacity: 0, y: offsetY },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.15, margin: "0px 0px -24px 0px" },
      transition: { duration, ease: EASE },
    },
    statsContainer: {
      initial: "hidden",
      animate: "visible",
      variants: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: prefersReducedMotion ? 0 : 0.05,
          },
        },
      },
    },
    statsItem: {
      variants: {
        hidden: { opacity: 0, y: offsetY },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, ease: EASE },
        },
      },
    },
    gridContainer: {
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true, amount: 0.1 },
      variants: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.1,
          },
        },
      },
    },
    gridItem: {
      variants: {
        hidden: { opacity: 0, y: offsetY },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, ease: EASE },
        },
      },
    },
    listItem: (index: number) => ({
      initial: { opacity: 0, x: prefersReducedMotion ? 0 : -8 },
      whileInView: { opacity: 1, x: 0 },
      viewport: { once: true, amount: 0.5 },
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.35,
        delay: prefersReducedMotion ? 0 : index * 0.04,
        ease: EASE,
      },
    }),
    upcomingContent: {
      initial: { opacity: 0, y: offsetYSmall },
      animate: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: EASE },
      },
      exit: {
        opacity: 0,
        y: prefersReducedMotion ? 0 : -6,
        transition: { duration: 0.2 },
      },
    },
    chart: {
      initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 },
      whileInView: { opacity: 1, scale: 1 },
      viewport: { once: true, amount: 0.3 },
      transition: { duration: prefersReducedMotion ? 0.15 : 0.5, ease: EASE },
    },
  };
}
