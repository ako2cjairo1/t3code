import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { formatDiffCount } from "@t3tools/client-runtime/diff-count";
import { useGT } from "gt-react";
import { ChevronDownIcon, GitBranchIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import { Menu, MenuPopup, MenuTrigger } from "../ui/menu";
import { HaloMorphPopup } from "./HaloMorphPopup";

/**
 * Liquid Halo's header git control: branch and change counts, a primary action, and the
 * action menu. The commit form springs out of the pill; GitActionsControl owns every action.
 */
export function HaloGitPill({
  branch,
  insertions,
  deletions,
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
  branch: string | null;
  insertions: number;
  deletions: number;
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
  return (
    <>
      <div
        ref={pillRef}
        role="group"
        aria-label={gt("Git actions")}
        className={cn(
          "flex h-7.5 shrink-0 items-stretch overflow-hidden rounded-full bg-foreground text-xs font-medium text-background shadow-(--halo-depth) transition-opacity duration-160",
          commitOpen && "pointer-events-none opacity-0",
        )}
      >
        {branch !== null ? (
          <span className="flex min-w-0 items-center gap-1.5 ps-3 pe-1 @max-4xl/chat-header:hidden">
            <GitBranchIcon aria-hidden className="size-3.5 shrink-0 opacity-70" />
            <span className="max-w-32 truncate">{branch}</span>
            {insertions > 0 || deletions > 0 ? (
              <span className="flex gap-1 font-mono text-2xs tabular-nums">
                <span className="text-diff-addition">+{formatDiffCount(insertions)}</span>
                <span className="text-diff-deletion">-{formatDiffCount(deletions)}</span>
              </span>
            ) : null}
          </span>
        ) : null}
        <button
          type="button"
          aria-haspopup={primaryOpensCommit ? "dialog" : undefined}
          aria-expanded={primaryOpensCommit ? commitOpen : undefined}
          aria-label={primaryLabel}
          disabled={primaryDisabled}
          onClick={onPrimary}
          className="flex min-w-0 cursor-pointer items-center gap-1.5 ps-2.5 pe-2.5 whitespace-nowrap transition-colors outline-none hover:bg-background/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:opacity-70"
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
                className="flex w-7 cursor-pointer items-center justify-center border-s border-background/15 transition-colors outline-none hover:bg-background/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:opacity-60"
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
          aria-label={gt("Commit changes")}
          className="w-95 max-w-[calc(100vw-2rem)]"
        >
          <div className="p-3.5">{commitForm}</div>
        </HaloMorphPopup>
      </PopoverPrimitive.Root>
    </>
  );
}
