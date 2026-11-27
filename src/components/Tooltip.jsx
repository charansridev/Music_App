import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SPRING_SNAPPY } from '../lib/motion.js';
import { classNames } from '../lib/utils.js';

export function Tooltip({ content, shortcut, side = 'top', children, className = '' }) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  return (
    <span
      className={classNames('tooltip-anchor', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            className={classNames('hw-tooltip', `side-${side}`)}
            initial={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'bottom' ? -3 : 3, scale: 0.96 }}
            transition={SPRING_SNAPPY}
          >
            <span>{content}</span>
            {shortcut && <kbd className="hw-tooltip-kbd">{shortcut}</kbd>}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
