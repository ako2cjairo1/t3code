import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * A glass card laid over its anchor that grows out of the anchor's pill shape: the clip
 * starts at the anchor's size and springs open, so the pill reads as morphing into the card.
 */
export function HaloMorphPopup({
  align,
  anchor,
  className,
  children,
  ...props
}: {
  align: "start" | "end";
  anchor?: PopoverPrimitive.Positioner.Props["anchor"];
  className?: string;
  children: ReactNode;
} & Omit<PopoverPrimitive.Popup.Props, "className" | "children">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side="bottom"
        align={align}
        anchor={anchor}
        sideOffset={({ anchor: rect }) => -rect.height}
        collisionAvoidance={{ side: "none", align: "shift" }}
        className="z-[130]"
      >
        <PopoverPrimitive.Popup
          {...props}
          data-halo-morph=""
          className={cn(
            "group/halo-morph relative overflow-hidden rounded-3xl border text-popover-foreground outline-none [-webkit-app-region:no-drag]",
            "[clip-path:inset(-4rem_round_24px)] transition-[clip-path] duration-440 ease-(--spring) data-ending-style:duration-320 data-ending-style:ease-in-out motion-reduce:duration-120",
            align === "start"
              ? "data-starting-style:[clip-path:inset(0_calc(100%_-_var(--anchor-width))_calc(100%_-_var(--anchor-height))_0_round_15px)] data-ending-style:[clip-path:inset(0_calc(100%_-_var(--anchor-width))_calc(100%_-_var(--anchor-height))_0_round_15px)]"
              : "data-starting-style:[clip-path:inset(0_0_calc(100%_-_var(--anchor-height))_calc(100%_-_var(--anchor-width))_round_15px)] data-ending-style:[clip-path:inset(0_0_calc(100%_-_var(--anchor-height))_calc(100%_-_var(--anchor-width))_round_15px)]",
            className,
          )}
        >
          <div className="transition-[opacity,filter] delay-120 duration-240 ease-out group-data-ending-style/halo-morph:opacity-0 group-data-ending-style/halo-morph:blur-xs group-data-ending-style/halo-morph:delay-0 group-data-ending-style/halo-morph:duration-110 group-data-starting-style/halo-morph:opacity-0 group-data-starting-style/halo-morph:blur-xs motion-reduce:transition-none">
            {children}
          </div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
