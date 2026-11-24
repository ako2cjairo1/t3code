import { resolveThemeHalf, themeEnablesHaloExperience } from "../themePalette";
import { useTheme } from "./useTheme";

/** True while the active theme half is Liquid Halo; every Halo-only component gates on this. */
export function useHaloExperience(): boolean {
  const { resolvedTheme, theme, themeHalves } = useTheme();
  return themeEnablesHaloExperience(resolveThemeHalf(theme, themeHalves, resolvedTheme));
}
