import { motion } from 'framer-motion';
import { SPRING_SMOOTH } from '../lib/motion.js';
import { classNames } from '../lib/utils.js';

function EmptyIllustration({ variant = 'disc' }) {
  if (variant === 'folder') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="6" y="14" width="84" height="50" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 22h84" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
        <path d="M12 14V9a3 3 0 0 1 3-3h22l6 8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="43" r="11" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="43" r="3" fill="#E03A1E" />
        <path d="M24 43h8M64 43h8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
      </svg>
    );
  }

  if (variant === 'tape') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="8" y="12" width="80" height="48" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="32" cy="36" r="11" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="64" cy="36" r="11" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="32" cy="36" r="3.5" fill="currentColor" />
        <circle cx="64" cy="36" r="3.5" fill="currentColor" />
        <path d="M32 47h32" stroke="#E03A1E" strokeWidth="1.5" />
        <path d="M22 54l4-6h44l4 6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" />
      </svg>
    );
  }

  if (variant === 'search') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <circle cx="42" cy="34" r="18" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="42" cy="34" r="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
        <path d="M55 47l14 14" stroke="#E03A1E" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14 18h10M14 26h6M70 18h12" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.45" />
      </svg>
    );
  }

  if (variant === 'hires') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="12" y="12" width="72" height="48" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M22 42V30M29 47V25M36 40V32M43 50V22M50 44V28M57 48V24M64 41V31M71 45V27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="76" cy="18" r="3" fill="#B87D14" />
      </svg>
    );
  }

  if (variant === 'queue' || variant === 'history') {
    return (
      <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <rect x="14" y="12" width="68" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="14" y="30" width="68" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.65" />
        <rect x="14" y="48" width="68" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.35" />
        <circle cx="22" cy="18" r="2.2" fill="#E03A1E" />
      </svg>
    );
  }

  return (
    <svg className="empty-svg" viewBox="0 0 96 72" fill="none" aria-hidden="true">
      <circle cx="48" cy="36" r="24" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="36" r="15" stroke="currentColor" strokeWidth="1.1" strokeDasharray="3 4" />
      <circle cx="48" cy="36" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="36" r="2" fill="#E03A1E" />
    </svg>
  );
}

export function EmptyState({
  variant = 'disc',
  eyebrow,
  title,
  description,
  actions,
  compact = false,
  className = '',
}) {
  return (
    <motion.div
      className={classNames('empty-state hw-card', compact && 'compact', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SMOOTH}
    >
      <EmptyIllustration variant={variant} />
      {eyebrow && <div className="empty-eyebrow mono">{eyebrow}</div>}
      <div className="empty-title">{title}</div>
      {description && <p className="empty-desc mono">{description}</p>}
      {actions && <div className="empty-actions">{actions}</div>}
    </motion.div>
  );
}

export function LibrarySkeleton({ rows = 6, progress = null, label = 'INDEXING LOCAL ARCHIVE' }) {
  const total = progress?.total || 0;
  const done = progress?.done || 0;
  const pct = total ? Math.round((done / total) * 100) : 18;

  return (
    <div className="skeleton-panel hw-card" aria-busy="true" aria-label={label}>
      <div className="skeleton-head">
        <div className="skeleton-title-row">
          <span className="tally-dot pulse" />
          <span className="mono">{label}</span>
        </div>
        <span className="mono skeleton-pct">
          {total ? `${done} / ${total} (${pct}%)` : 'READING DIRECTORY...'}
        </span>
      </div>
      <div className="mount-progress-track">
        <div className="mount-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="skeleton-rows">
        {Array.from({ length: rows }, (_, index) => (
          <div className="skeleton-row" key={index} style={{ '--sk-delay': `${index * 90}ms` }}>
            <span className="sk-block sk-idx" />
            <span className="sk-block sk-art" />
            <div className="sk-meta">
              <span className="sk-block sk-line-lg" />
              <span className="sk-block sk-line-sm" />
            </div>
            <span className="sk-block sk-badge" />
            <span className="sk-block sk-dur" />
          </div>
        ))}
      </div>
    </div>
  );
}
