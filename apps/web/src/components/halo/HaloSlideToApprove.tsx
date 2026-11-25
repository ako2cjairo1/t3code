import { useGT } from "gt-react";
import { ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const MAX_TRAVEL = 240; // 280px track - 2px border - 2 x 3px inset - 32px knob
const COMPLETE_AT = 0.85;
const FILL_MS = 260;

interface HaloSlideToApproveProps {
  ariaLabel: string;
  disabled: boolean;
  onApprove: () => void;
}

/** Prototype slide-to-approve. The knob is a real button: click, Enter and Space approve at once. */
export function HaloSlideToApprove({ ariaLabel, disabled, onApprove }: HaloSlideToApproveProps) {
  const gt = useGT();
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [approved, setApproved] = useState(false);
  const start = useRef<{ pointerX: number; originX: number } | null>(null);
  const moved = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- clears the pending approve timer on unmount
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // A failed approve re-enables a card that is still pending: reset so it can be retried.
  const [wasDisabled, setWasDisabled] = useState(disabled);
  if (disabled !== wasDisabled) {
    setWasDisabled(disabled);
    if (!disabled && approved) {
      setApproved(false);
      setX(0);
    }
  }

  const locked = disabled || approved;
  const finish = (delay: number) => {
    setApproved(true);
    setX(MAX_TRAVEL);
    timer.current = window.setTimeout(onApprove, delay);
  };
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (locked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { pointerX: event.clientX, originX: x };
    moved.current = false;
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.pointerX;
    if (Math.abs(dx) > 4) moved.current = true;
    setX(Math.max(0, Math.min(MAX_TRAVEL, start.current.originX + dx)));
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    if (x >= MAX_TRAVEL * COMPLETE_AT) finish(reducedMotion() ? 0 : FILL_MS);
    else setX(0);
  };

  return (
    <div
      data-halo-slide=""
      data-dragging={dragging || undefined}
      data-approved={approved || undefined}
      style={{ "--halo-slide-x": `${x}px` } as CSSProperties}
    >
      <div data-halo-slide-fill="" />
      <span data-halo-slide-label="">{approved ? gt("Approved") : gt("Slide to approve")}</span>
      <button
        type="button"
        data-halo-slide-knob=""
        aria-label={ariaLabel}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (moved.current) {
            moved.current = false;
            return;
          }
          if (locked) return;
          setApproved(true);
          setX(MAX_TRAVEL);
          onApprove();
        }}
      >
        <ChevronRightIcon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
