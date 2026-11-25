import { useGT, useMessages } from "gt-react";
import { EllipsisIcon, InfoIcon, PaletteIcon, PanelBottomIcon, PanelRightIcon } from "lucide-react";
import { useHaloExperience } from "~/hooks/useHaloExperience";
import { useTheme } from "~/hooks/useTheme";
import { APPEARANCE_OPTIONS, notifyThemeSaveFailure } from "../CommandPaletteThemeItems";
import { PanelLayoutControls, type PanelLayoutControlsProps } from "../chat/PanelLayoutControls";
import { Button } from "../ui/button";
import { HaloSegmented } from "./HaloSegmented";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
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
        panels={{ ...props, showThreadPanelItem: props.threadPanelPresentation !== "popover" }}
      />
    </div>
  );
}

/** Panel toggles (on a thread) and the appearance pill, behind one round "more" button. */
export function HaloOverflowMenu({
  panels,
}: {
  panels?: PanelLayoutControlsProps & { showThreadPanelItem: boolean };
}) {
  const gt = useGT();
  const messages = useMessages();
  const { appearanceMode, setAppearanceMode, setTheme } = useTheme();
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm-pill" aria-label={gt("Panels and theme")}>
            <EllipsisIcon />
          </Button>
        }
      />
      <MenuPopup align="end" className="w-65.5" data-halo-overflow="">
        {panels ? (
          <MenuGroup>
            <MenuGroupLabel>{gt("Panels")}</MenuGroupLabel>
            <MenuCheckboxItem
              checked={panels.terminalOpen}
              disabled={!panels.terminalAvailable}
              onCheckedChange={panels.onToggleTerminal}
            >
              <span className="flex items-center gap-2.5">
                <PanelBottomIcon className="size-3.5" />
                {gt("Terminal drawer")}
                {panels.terminalShortcutLabel ? (
                  <MenuShortcut>{panels.terminalShortcutLabel}</MenuShortcut>
                ) : null}
              </span>
            </MenuCheckboxItem>
            {panels.showThreadPanelItem ? (
              <MenuCheckboxItem
                checked={panels.threadPanelOpen}
                onCheckedChange={panels.onToggleThreadPanel}
              >
                <span className="flex items-center gap-2.5">
                  <InfoIcon className="size-3.5" />
                  {gt("Thread details")}
                  {panels.threadPanelShortcutLabel ? (
                    <MenuShortcut>{panels.threadPanelShortcutLabel}</MenuShortcut>
                  ) : null}
                </span>
              </MenuCheckboxItem>
            ) : null}
            <MenuCheckboxItem
              checked={panels.rightPanelOpen}
              disabled={!panels.rightPanelAvailable}
              onCheckedChange={panels.onToggleRightPanel}
            >
              <span className="flex items-center gap-2.5">
                <PanelRightIcon className="size-3.5" />
                {gt("Right panel")}
                {panels.rightPanelShortcutLabel ? (
                  <MenuShortcut>{panels.rightPanelShortcutLabel}</MenuShortcut>
                ) : null}
              </span>
            </MenuCheckboxItem>
          </MenuGroup>
        ) : null}
        <MenuGroup>
          <MenuGroupLabel>{gt("Theme")}</MenuGroupLabel>
          <div className="px-1 pb-1">
            <HaloSegmented
              name="appearance"
              aria-label={gt("Appearance")}
              value={appearanceMode}
              onValueChange={(mode) => {
                if (!setAppearanceMode(mode)) notifyThemeSaveFailure();
              }}
              className="h-8.5 w-full *:data-segment:flex-1 *:data-segment:justify-center"
              items={APPEARANCE_OPTIONS.map(({ mode, label, icon: Icon }) => ({
                value: mode,
                label: (
                  <>
                    <Icon className="size-3.5!" />
                    {messages(label)}
                  </>
                ),
              }))}
            />
          </div>
          <MenuItem
            onClick={() => {
              if (!setTheme(appearanceMode)) notifyThemeSaveFailure();
            }}
          >
            <PaletteIcon className="size-3.5" />
            {gt("Use the default theme")}
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
