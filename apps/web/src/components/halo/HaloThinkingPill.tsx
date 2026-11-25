import type { ReactNode } from "react";
import { tickTextContent } from "~/lib/tickTextContent";
import { observeVisibleAnimation } from "~/lib/visibleAnimation";

const LED_DOTS = Array.from({ length: 25 }, (_, index) => index);

/** `1s`, `42s`, `1m 5s`: the pill's elapsed readout. */
function formatPillElapsed(seconds: number): string {
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/** Liquid Halo's live-activity pill; the LED sweep and clock run only while `live` and visible. */
export function HaloThinkingPill({ label, live }: { label: ReactNode; live: boolean }) {
  return (
    <span
      ref={live ? observeVisibleAnimation : undefined}
      data-halo-thinking={live ? "" : undefined}
      className="inline-flex h-8 max-w-full min-w-0 items-center gap-2.25 rounded-full border border-(--halo-line) bg-foreground/6 pr-3.5 pl-2.5 text-xs font-medium text-secondary-label shadow-(--halo-depth) backdrop-blur-(--glass-blur)"
    >
      <span data-halo-led="" aria-hidden="true" className="grid shrink-0 grid-cols-5 gap-px">
        {LED_DOTS.map((dot) => (
          <i key={dot} />
        ))}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      {live ? (
        <span
          aria-hidden="true"
          ref={(node) => {
            if (!node) return;
            const startedAt = Date.now();
            return tickTextContent(
              (now) => formatPillElapsed(Math.max(0, Math.floor((now - startedAt) / 1000))),
              true,
            )(node);
          }}
          className="shrink-0 font-mono text-2xs font-normal text-muted-foreground tabular-nums"
        />
      ) : null}
    </span>
  );
}
