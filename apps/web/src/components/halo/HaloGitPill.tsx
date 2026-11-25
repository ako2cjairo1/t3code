import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useGT } from "gt-react";
import { ChevronDownIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { Menu, MenuPopup, MenuTrigger } from "../ui/menu";
import { HaloMorphPopup } from "./HaloMorphPopup";

/**
 * Liquid Halo's header git control: a primary action and the action menu. The commit form
 * springs out of the pill; GitActionsControl owns every action.
 */
export function HaloGitPill({
  state,
  primary,
  primaryDisabled,
  primaryLabel,
  primaryOpensCommit,
  onPrimary,
  commitOpen,
  onCommitOpenChange,
  commitForm,
  menuItems,
  menuDisabled,
  onMenuOpen,
}: {
  /** busy while an action runs; ok briefly after one succeeds; needs when there is work to commit. */
  state: "idle" | "busy" | "ok" | "needs";
  primary: ReactNode;
  primaryDisabled: boolean;
  primaryLabel: string;
  primaryOpensCommit: boolean;
  onPrimary: () => void;
  commitOpen: boolean;
  onCommitOpenChange: (open: boolean) => void;
  commitForm: ReactNode;
  menuItems: ReactNode;
  menuDisabled: boolean;
  onMenuOpen: () => void;
}) {
  const gt = useGT();
  const pillRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <div
        ref={pillRef}
        role="group"
        aria-label={gt("Git actions")}
        data-state={state}
        data-halo-git-pill=""
        className={cn(
          "flex h-7.5 shrink-0 items-stretch overflow-hidden rounded-full bg-foreground text-xs font-medium text-background transition-[background-color,color,opacity] duration-260 data-[state=busy]:bg-foreground/8 data-[state=busy]:text-foreground data-[state=ok]:bg-primary data-[state=ok]:text-primary-foreground",
          commitOpen && "pointer-events-none opacity-0",
        )}
      >
        <button
          ref={primaryRef}
          type="button"
          aria-haspopup={primaryOpensCommit ? "dialog" : undefined}
          aria-expanded={primaryOpensCommit ? commitOpen : undefined}
          aria-label={primaryLabel}
          disabled={primaryDisabled}
          onClick={onPrimary}
          className="flex min-w-0 cursor-pointer items-center gap-1.5 ps-2.75 pe-2.5 whitespace-nowrap transition-colors outline-none hover:bg-background/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:opacity-70 in-data-[state=busy]:opacity-100 in-data-[state=ok]:opacity-100"
        >
          {primary}
        </button>
        <Menu
          onOpenChange={(open) => {
            if (open) onMenuOpen();
          }}
        >
          <MenuTrigger
            disabled={menuDisabled}
            aria-label={gt("Git action options")}
            render={
              <button
                type="button"
                className="flex w-7 cursor-pointer items-center justify-center border-s border-current/14 transition-colors outline-none hover:bg-background/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:opacity-60"
              />
            }
          >
            <ChevronDownIcon aria-hidden className="size-3.5" />
          </MenuTrigger>
          <MenuPopup align="end" anchor={pillRef}>
            {menuItems}
          </MenuPopup>
        </Menu>
      </div>
      <PopoverPrimitive.Root open={commitOpen} onOpenChange={onCommitOpenChange}>
        <HaloMorphPopup
          align="end"
          anchor={pillRef}
          finalFocus={primaryRef}
          aria-label={gt("Commit changes")}
          className="w-95 max-w-[calc(100vw-2rem)]"
        >
          <div className="p-3.5">{commitForm}</div>
        </HaloMorphPopup>
      </PopoverPrimitive.Root>
    </>
  );
}
