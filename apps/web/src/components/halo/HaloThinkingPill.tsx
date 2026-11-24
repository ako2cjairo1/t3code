import type { ReactNode } from "react";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";

const LED_DOTS = Array.from({ length: 15 }, (_, index) => index);

/** Liquid Halo's live-activity pill; the LED sweep runs only while `live` and visible. */
export function HaloThinkingPill({ label, live }: { label: ReactNode; live: boolean }) {
  return (
    <span
      ref={live ? observeVisibleAnimation : undefined}
      data-halo-thinking={live ? "" : undefined}
      className="inline-flex h-7 max-w-full min-w-0 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-secondary-label shadow-xs"
    >
      <span data-halo-led="" aria-hidden="true" className="grid shrink-0 grid-cols-5 gap-px">
        {LED_DOTS.map((dot) => (
          <i key={dot} />
        ))}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
