import { useGT, useMessages } from "gt-react";
import { EllipsisIcon, PaletteIcon } from "lucide-react";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import { useTheme } from "~/hooks/useTheme";
import { APPEARANCE_OPTIONS, notifyThemeSaveFailure } from "../CommandPaletteThemeItems";
import { PanelLayoutControls, type PanelLayoutControlsProps } from "../chat/PanelLayoutControls";
import { Button } from "../ui/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "../ui/menu";

/**
 * The chat header's panel toggles. Under Liquid Halo they fold into one overflow menu with the
 * appearance controls; the thread details toggle stays when it anchors the details popover.
 */
export function HaloPanelLayoutControls(props: PanelLayoutControlsProps) {
  if (!useHaloExperience()) return <PanelLayoutControls {...props} />;
  const showThreadPanelToggle =
    (props.showThreadPanelControl ?? true) && props.threadPanelPresentation === "popover";
  return (
    <div
      className="flex h-full shrink-0 items-center gap-1 [-webkit-app-region:no-drag]"
      data-panel-layout-controls
    >
      {showThreadPanelToggle ? (
        <PanelLayoutControls {...props} showTerminalControl={false} showRightPanelControl={false} />
      ) : null}
      <HaloOverflowMenu
        {...props}
        showThreadPanelItem={props.threadPanelPresentation !== "popover"}
      />
    </div>
  );
}

function HaloOverflowMenu({
  showThreadPanelItem,
  terminalAvailable,
  terminalOpen,
  terminalShortcutLabel,
  threadPanelOpen,
  threadPanelShortcutLabel,
  rightPanelAvailable,
  rightPanelOpen,
  rightPanelShortcutLabel,
  onToggleTerminal,
  onToggleThreadPanel,
  onToggleRightPanel,
}: PanelLayoutControlsProps & { showThreadPanelItem: boolean }) {
  const gt = useGT();
  const messages = useMessages();
  const { appearanceMode, setAppearanceMode, setTheme } = useTheme();
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={gt("Panels and theme")}>
            <EllipsisIcon />
          </Button>
        }
      />
      <MenuPopup align="end" className="w-62">
        <MenuGroup>
          <MenuGroupLabel>{gt("Panels")}</MenuGroupLabel>
          <MenuCheckboxItem
            checked={terminalOpen}
            disabled={!terminalAvailable}
            onCheckedChange={onToggleTerminal}
          >
            <span className="flex items-center gap-2">
              {gt("Terminal drawer")}
              {terminalShortcutLabel ? <MenuShortcut>{terminalShortcutLabel}</MenuShortcut> : null}
            </span>
          </MenuCheckboxItem>
          {showThreadPanelItem ? (
            <MenuCheckboxItem checked={threadPanelOpen} onCheckedChange={onToggleThreadPanel}>
              <span className="flex items-center gap-2">
                {gt("Thread details")}
                {threadPanelShortcutLabel ? (
                  <MenuShortcut>{threadPanelShortcutLabel}</MenuShortcut>
                ) : null}
              </span>
            </MenuCheckboxItem>
          ) : null}
          <MenuCheckboxItem
            checked={rightPanelOpen}
            disabled={!rightPanelAvailable}
            onCheckedChange={onToggleRightPanel}
          >
            <span className="flex items-center gap-2">
              {gt("Right panel")}
              {rightPanelShortcutLabel ? (
                <MenuShortcut>{rightPanelShortcutLabel}</MenuShortcut>
              ) : null}
            </span>
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>{gt("Appearance")}</MenuGroupLabel>
          <MenuRadioGroup
            value={appearanceMode}
            onValueChange={(mode: (typeof APPEARANCE_OPTIONS)[number]["mode"]) => {
              if (!setAppearanceMode(mode)) notifyThemeSaveFailure();
            }}
          >
            {APPEARANCE_OPTIONS.map(({ mode, label, icon: Icon }) => (
              <MenuRadioItem key={mode} value={mode}>
                <span className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  {messages(label)}
                  <MenuRadioItemIndicator className="ms-auto" />
                </span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
          <MenuItem
            onClick={() => {
              if (!setTheme(appearanceMode)) notifyThemeSaveFailure();
            }}
          >
            <PaletteIcon />
            {gt("Use the default theme")}
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
