import { useRef } from 'react';

export function SeekSurface({
  id,
  className,
  children,
  onSeek,
  value = 0,
  label = 'Playback position',
  step = 5,
  ...props
}) {
  const draggingRef = useRef(false);

  const seekFromPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    const percentage = (event.clientX - bounds.left) / bounds.width;
    onSeek(Math.max(0, Math.min(1, percentage)));
  };

  const handleKeyDown = (event) => {
    let nextValue;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextValue = value + step / 100;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextValue = value - step / 100;
    else if (event.key === 'Home') nextValue = 0;
    else if (event.key === 'End') nextValue = 1;
    else return;

    event.preventDefault();
    event.stopPropagation();
    onSeek(Math.max(0, Math.min(1, nextValue)));
  };

  return (
    <div
      id={id}
      className={className}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (draggingRef.current) seekFromPointer(event);
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}
