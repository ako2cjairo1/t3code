import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";
import { observeResize } from "~/lib/observeResize";
import { cn } from "~/lib/utils";

// Where each named control's thumb last sat, so a remounted control slides from there.
const lastThumbs = new Map<string, { x: number; w: number }>();

/** Liquid Halo's segmented pill: a glass track whose thumb springs to the pressed segment. */
export function HaloSegmented<T extends string>({
  name,
  value,
  onValueChange,
  items,
  className,
  "aria-label": ariaLabel,
}: {
  /** Keys the remembered thumb position across remounts. */
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  items: ReadonlyArray<{
    value: T;
    label: ReactNode;
    disabled?: boolean;
  }>;
  className?: string;
  "aria-label": string;
}) {
  const placeThumb = (group: HTMLDivElement | null) => {
    if (group === null) return;
    const place = () => {
      const active = group.querySelector<HTMLElement>(`[data-segment="${value}"]`);
      if (!active) return;
      const thumb = { x: active.offsetLeft, w: active.offsetWidth };
      lastThumbs.set(name, thumb);
      group.style.setProperty("--thumb-x", `${thumb.x}px`);
      group.style.setProperty("--thumb-w", `${thumb.w}px`);
    };
    const last = lastThumbs.get(name);
    if (last && !group.style.getPropertyValue("--thumb-w")) {
      group.style.setProperty("--thumb-x", `${last.x}px`);
      group.style.setProperty("--thumb-w", `${last.w}px`);
      const frame = requestAnimationFrame(place);
      const stop = observeResize(group, place);
      return () => {
        cancelAnimationFrame(frame);
        stop();
      };
    }
    place();
    return observeResize(group, place);
  };
  return (
    <ToggleGroup
      ref={placeThumb}
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next) => {
        const picked = items.find((item) => item.value === next[0]);
        if (picked) onValueChange(picked.value);
      }}
      className={cn(
        "relative flex h-8 shrink-0 items-center rounded-full border border-foreground/8 bg-foreground/5 p-0.75",
        className,
      )}
    >
      <span
        aria-hidden
        data-halo-thumb=""
        className="pointer-events-none absolute top-0.75 bottom-0.75 left-0 w-(--thumb-w,0) translate-x-(--thumb-x,0) rounded-full bg-foreground/10"
      />
      {items.map((item) => (
        <Toggle
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          data-segment={item.value}
          className="relative flex h-6 cursor-pointer items-center gap-1.5 rounded-full px-2.25 text-xs whitespace-nowrap text-muted-foreground transition-colors duration-200 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:opacity-50 data-pressed:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {item.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
