import { useGT } from "gt-react";
import { ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const KNOB_SPAN = 38; // 32px knob + 2 x 3px inset; the track also has a 1px border each side
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
  const track = useRef<HTMLDivElement>(null);
  const start = useRef<{
    pointerX: number;
    originX: number;
    max: number;
    x: number;
    lastX: number;
    lastT: number;
    velocity: number;
  } | null>(null);
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
  // Measured, not fixed: inbox cards and child approvals give the track less than 280px.
  const maxTravel = () => Math.max(0, (track.current?.clientWidth ?? 0) - KNOB_SPAN);
  const finish = (delay: number) => {
    setApproved(true);
    setX(maxTravel());
    timer.current = window.setTimeout(onApprove, delay);
  };
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (locked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // Re-grabbing mid spring-back starts from where the knob is drawn, not where it is headed.
    const drawnX = new DOMMatrixReadOnly(getComputedStyle(event.currentTarget).transform).m41;
    start.current = {
      pointerX: event.clientX,
      originX: drawnX,
      max: maxTravel(),
      x: drawnX,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
    };
    moved.current = false;
    setX(drawnX);
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = start.current;
    if (!drag) return;
    const dx = event.clientX - drag.pointerX;
    if (Math.abs(dx) > 4) moved.current = true;
    const dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.velocity = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    drag.x = Math.max(0, Math.min(drag.max, drag.originX + dx));
    setX(drag.x);
  };
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = start.current;
    if (!drag) return;
    start.current = null;
    setDragging(false);
    // Read the position from the gesture, not render state: a fast release can beat the re-render.
    const x = drag.x;
    // A flick past halfway counts: project 100ms ahead at release velocity (px/ms), as the
    // prototype does. Below halfway it never approves, however fast.
    const velocity = event.timeStamp - drag.lastT > 100 ? 0 : drag.velocity;
    const projected = x >= drag.max / 2 ? x + velocity * 100 : x;
    if (projected >= drag.max * COMPLETE_AT) finish(reducedMotion() ? 0 : FILL_MS);
    else setX(0);
  };
  // A cancelled gesture (scroll steal, system gesture) must never approve.
  const onPointerCancel = () => {
    if (!start.current) return;
    start.current = null;
    moved.current = false;
    setDragging(false);
    setX(0);
  };

  return (
    <div
      ref={track}
      data-halo-slide=""
      data-dragging={dragging || undefined}
      data-approved={approved || undefined}
      style={{ "--halo-slide-x": `${x}px` } as CSSProperties}
    >
      <div data-halo-slide-fill="" />
      <span data-halo-slide-label="">
        <span aria-hidden={approved || undefined}>{gt("Slide to approve")}</span>
        <span aria-hidden={!approved || undefined}>{gt("Approved")}</span>
      </span>
      <button
        type="button"
        data-halo-slide-knob=""
        aria-label={ariaLabel}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onClick={() => {
          if (moved.current) {
            moved.current = false;
            return;
          }
          if (locked) return;
          setApproved(true);
          setX(maxTravel());
          onApprove();
        }}
      >
        <ChevronRightIcon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
