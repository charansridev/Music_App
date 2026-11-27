export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 520,
  damping: 36,
  mass: 0.8,
};

export const SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

export const SPRING_GENTLE = {
  type: 'spring',
  stiffness: 220,
  damping: 28,
  mass: 1,
};

export const VIEW_TRANSITION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: SPRING_SMOOTH },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } },
};

export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.032,
      delayChildren: 0.02,
    },
  },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING_SMOOTH,
  },
};

export const OVERLAY_BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const MODAL_PANEL = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SNAPPY },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.14, ease: 'easeIn' } },
};
