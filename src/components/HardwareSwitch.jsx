import { classNames } from '../lib/utils.js';

export function HardwareSwitch({ checked, onChange, label, className = '', ...props }) {
  return (
    <button
      type="button"
      className={classNames('hw-switch', checked && 'on', className)}
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      {...props}
    >
      <i />
    </button>
  );
}
