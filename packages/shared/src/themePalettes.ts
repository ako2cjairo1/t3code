export const BUILT_IN_THEME_IDS = [
  "t3-chat",
  "grove",
  "ocean",
  "ember",
  "iris",
  "liquid-halo",
] as const;

export const MOBILE_DEFAULT_THEME_ID = "t3-code";

export const MOBILE_THEME_IDS = [MOBILE_DEFAULT_THEME_ID, ...BUILT_IN_THEME_IDS] as const;

/** Reserve appearance keywords, built-ins, and legacy aliases so custom themes cannot capture stored preferences. */
export const RESERVED_THEME_IDS: ReadonlySet<string> = new Set([
  "system",
  "light",
  "dark",
  ...BUILT_IN_THEME_IDS,
  "t3-chat-dark",
  "t3-grove",
  "t3-ocean",
  "t3-ember",
  "t3-iris",
]);

/** The mobile default id is valid in saved themes but cannot be published because web/desktop cannot resolve it. */
export const UNPUBLISHABLE_THEME_IDS: ReadonlySet<string> = new Set([
  ...RESERVED_THEME_IDS,
  MOBILE_DEFAULT_THEME_ID,
]);

export type BuiltInThemeId = (typeof BUILT_IN_THEME_IDS)[number];
export type MobileThemeId = (typeof MOBILE_THEME_IDS)[number];
export type ThemeAppearance = "light" | "dark";

export const THEME_COLOR_ROLES = [
  "canvas",
  "chrome",
  "toolbar",
  "toolbarForeground",
  "toolbarBorder",
  "toolbarControl",
  "toolbarControlForeground",
  "toolbarControlHover",
  "surface",
  "surfaceRaised",
  "surfaceOverlay",
  "text",
  "textMuted",
  "border",
  "input",
  "focus",
  "accent",
  "accentForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "placeholder",
  "secondaryLabel",
  "iconMuted",
  "error",
  "errorForeground",
  "errorSurface",
  "warning",
  "warningForeground",
  "warningSurface",
  "update",
  "updateForeground",
  "updateSurface",
  "accentSurface",
  "accentSurfaceForeground",
  "messageSurface",
  "messageForeground",
  "messageAction",
  "messageActionForeground",
  "messageActionHover",
  "codeBackground",
  "codeForeground",
  "searchMatchBackground",
  "searchMatchForeground",
  "searchMatchActiveBackground",
  "searchMatchActiveForeground",
  "sidebar",
  "sidebarForeground",
  "sidebarMutedForeground",
  "sidebarControlSurface",
  "sidebarRowHover",
  "sidebarRowActive",
  "sidebarRowSelected",
  "sidebarBorder",
  "terminalBackground",
  "terminalForeground",
  "terminalCursor",
  "terminalSelection",
  "terminalScrollbar",
  "terminalScrollbarHover",
] as const;

export type ThemeColorRole = (typeof THEME_COLOR_ROLES)[number];
export type ThemeColors = Readonly<Record<ThemeColorRole, string>>;
export type ThemeVariants = Readonly<Partial<Record<ThemeAppearance, ThemeColors>>>;
export type ThemeDefinition = Readonly<{
  id: string;
  label: string;
  appearance: ThemeAppearance;
  colors: ThemeColors;
  variants?: ThemeVariants;
  collection?: Readonly<{ id: string; label: string }>;
  sidebarArtwork?: boolean;
  /** Built-in only: turns on the Liquid Halo interface (orb, status island, inbox board, trace). */
  haloExperience?: boolean;
  managed?: boolean;
  /** Custom styles for web and desktop. */
  css?: string;
}>;

export const T3_CODE_LIGHT_THEME_COLORS: ThemeColors = {
  searchMatchBackground: "#ffde8b",
  searchMatchForeground: "#21180a",
  searchMatchActiveBackground: "#eea52b",
  searchMatchActiveForeground: "#21180a",
  canvas: "#fcfcfc",
  chrome: "#fcfcfc",
  toolbar: "#fcfcfc",
  toolbarForeground: "#27272a",
  toolbarBorder: "#e4e4e7",
  toolbarControl: "#ffffff",
  toolbarControlForeground: "#27272a",
  toolbarControlHover: "#f4f4f5",
  surface: "#ffffff",
  surfaceRaised: "#fcfcfc",
  surfaceOverlay: "#ffffff",
  text: "#27272a",
  textMuted: "#71717b",
  border: "#e4e4e7",
  input: "#d4d4d8",
  focus: "#1b4ed8",
  accent: "#1b4ed8",
  accentForeground: "#ffffff",
  secondary: "#fafafa",
  secondaryForeground: "#27272a",
  muted: "#fafafa",
  mutedForeground: "#71717b",
  placeholder: "#71717b",
  secondaryLabel: "#71717b",
  iconMuted: "#71717b",
  error: "#fb2c36",
  errorForeground: "#c10007",
  errorSurface: "#fcebec",
  warning: "#fe9a00",
  warningForeground: "#bb4d00",
  warningSurface: "#fcf4e8",
  update: "#1b4ed8",
  updateForeground: "#1b4ed8",
  updateSurface: "#e0e6f7",
  accentSurface: "#f4f4f5",
  accentSurfaceForeground: "#18181b",
  messageSurface: "#f4f4f5",
  messageForeground: "#27272a",
  messageAction: "#1b4ed8",
  messageActionForeground: "#ffffff",
  messageActionHover: "#3160db",
  codeBackground: "#ffffff",
  codeForeground: "#27272a",
  sidebar: "#fafafa",
  sidebarForeground: "#27272a",
  sidebarMutedForeground: "#71717b",
  sidebarControlSurface: "#f4f4f5",
  sidebarRowHover: "#fcfcfc",
  sidebarRowActive: "#ffffff",
  sidebarRowSelected: "#ffffff",
  sidebarBorder: "#e4e4e7",
  terminalBackground: "#fcfcfc",
  terminalForeground: "#27272a",
  terminalCursor: "#26384e",
  terminalSelection: "#d0d6dd",
  terminalScrollbar: "#d6d6d6",
  terminalScrollbarHover: "#bdbdbd",
};

export const T3_CODE_DARK_THEME_COLORS: ThemeColors = {
  searchMatchBackground: "#8c6c1f",
  searchMatchForeground: "#f5f5f5",
  searchMatchActiveBackground: "#eea52b",
  searchMatchActiveForeground: "#21180a",
  canvas: "#0a0a0a",
  chrome: "#0a0a0a",
  toolbar: "#0a0a0a",
  toolbarForeground: "#f5f5f5",
  toolbarBorder: "#191919",
  toolbarControl: "#111111",
  toolbarControlForeground: "#f5f5f5",
  toolbarControlHover: "#141414",
  surface: "#111111",
  surfaceRaised: "#111111",
  surfaceOverlay: "#111111",
  text: "#f5f5f5",
  textMuted: "#818181",
  border: "#191919",
  input: "#1e1e1e",
  focus: "#346bf1",
  accent: "#346bf1",
  accentForeground: "#ffffff",
  secondary: "#111111",
  secondaryForeground: "#f5f5f5",
  muted: "#111111",
  mutedForeground: "#818181",
  placeholder: "#818181",
  secondaryLabel: "#818181",
  iconMuted: "#818181",
  error: "#fb414a",
  errorForeground: "#ff6467",
  errorSurface: "#301214",
  warning: "#fe9a00",
  warningForeground: "#ffb900",
  warningSurface: "#312108",
  update: "#346bf1",
  updateForeground: "#51a2ff",
  updateSurface: "#121b34",
  accentSurface: "#141414",
  accentSurfaceForeground: "#f5f5f5",
  messageSurface: "#141414",
  messageForeground: "#f5f5f5",
  messageAction: "#346bf1",
  messageActionForeground: "#ffffff",
  messageActionHover: "#3061d9",
  codeBackground: "#111111",
  codeForeground: "#f5f5f5",
  sidebar: "#000000",
  sidebarForeground: "#f1f3f7",
  sidebarMutedForeground: "#a3a3a3",
  sidebarControlSurface: "#0a0a0a",
  sidebarRowHover: "#131313",
  sidebarRowActive: "#1a1b1b",
  sidebarRowSelected: "#111111",
  sidebarBorder: "#141414",
  terminalBackground: "#0a0a0a",
  terminalForeground: "#f5f5f5",
  terminalCursor: "#b4cbff",
  terminalSelection: "#343a47",
  terminalScrollbar: "#222222",
  terminalScrollbarHover: "#363636",
};

export const T3_CHAT_THEME: ThemeDefinition = {
  id: "t3-chat",
  label: "T3 Chat",
  appearance: "light",
  colors: {
    canvas: "oklch(0.982446 0.010114 325.653)",
    chrome: "oklch(0.982446 0.010114 325.653)",
    toolbar: "oklch(0.982446 0.010114 325.653)",
    toolbarForeground: "oklch(0.325698 0.116116 325.037)",
    toolbarBorder: "oklch(0.856784 0.082879 328.911)",
    toolbarControl: "oklch(0.939552 0.024286 321.664)",
    toolbarControlForeground: "oklch(0.325698 0.116116 325.037)",
    toolbarControlHover: "oklch(0.884525 0.041658 337.177)",
    surface: "oklch(0.971835 0.012884 321.894)",
    surfaceRaised: "oklch(0.988235 0.005049 325.615)",
    surfaceOverlay: "oklch(1 0 0)",
    text: "oklch(0.325698 0.116116 325.037)",
    textMuted: "oklch(0.494754 0.190937 354.544)",
    border: "oklch(0.923531 0.021247 328.096)",
    input: "oklch(0.851713 0.055822 336.6)",
    focus: "oklch(0.591646 0.217985 0.584)",
    accent: "oklch(0.591646 0.217985 0.584)",
    accentForeground: "oklch(1 0 0)",
    secondary: "oklch(0.869588 0.06751 334.899)",
    secondaryForeground: "oklch(0.444777 0.134061 324.799)",
    muted: "oklch(0.802407 0.090963 345.892)",
    mutedForeground: "oklch(0.428932 0.163929 354.332)",
    placeholder: "oklch(0.549927 0.090215 323.149)",
    secondaryLabel: "oklch(0.494754 0.190937 354.544)",
    iconMuted: "oklch(0.494754 0.190937 354.544)",
    error: "oklch(0.627117 0.248974 7.734)",
    errorForeground: "oklch(0.458704 0.169677 3.815)",
    errorSurface: "oklch(0.942787 0.032076 344.963)",
    warning: "oklch(0.76859 0.164659 70.08)",
    warningForeground: "oklch(0.54612 0.143036 48.949)",
    warningSurface: "oklch(0.962901 0.015297 48.56)",
    update: "oklch(0.591646 0.217985 0.584)",
    updateForeground: "oklch(0.494754 0.190937 354.544)",
    updateSurface: "oklch(0.930264 0.036194 341.45)",
    accentSurface: "oklch(0.939552 0.024286 321.664)",
    accentSurfaceForeground: "oklch(0.396296 0.025134 285.196)",
    messageSurface: "oklch(0.926746 0.037898 332.6)",
    messageForeground: "oklch(0.354591 0.093575 307.568)",
    messageAction: "oklch(0.591646 0.217985 0.584)",
    messageActionForeground: "oklch(1 0 0)",
    messageActionHover: "oklch(0.539042 0.197866 0.305)",
    codeBackground: "oklch(0.953855 0.019695 315.668)",
    codeForeground: "oklch(0.445128 0.13005 307.026)",
    searchMatchBackground: "oklch(0.915 0.11 85)",
    searchMatchForeground: "oklch(0.216164 0.028283 77.423)",
    searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
    searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
    sidebar: "oklch(0.928886 0.031178 322.592)",
    sidebarForeground: "oklch(0.396296 0.025134 285.196)",
    sidebarMutedForeground: "oklch(0.494754 0.190937 354.544)",
    sidebarControlSurface: "oklch(0.978851 0.001321 106.424)",
    sidebarRowHover: "oklch(0.978851 0.001321 106.424)",
    sidebarRowActive: "oklch(0.978851 0.001321 106.424)",
    sidebarRowSelected: "oklch(0.978851 0.001321 106.424)",
    sidebarBorder: "oklch(0.938313 0.002552 48.717)",
    terminalBackground: "oklch(0.982446 0.010114 325.653)",
    terminalForeground: "oklch(0.325698 0.116116 325.037)",
    terminalCursor: "oklch(0.591646 0.217985 0.584)",
    terminalSelection: "oklch(0.869588 0.06751 334.899)",
    terminalScrollbar: "oklch(0.851713 0.055822 336.6)",
    terminalScrollbarHover: "oklch(0.802407 0.090963 345.892)",
  },
  variants: {
    dark: {
      canvas: "oklch(0.22813 0.020366 307.469)",
      chrome: "oklch(0.22813 0.020366 307.469)",
      toolbar: "oklch(0.22813 0.020366 307.469)",
      toolbarForeground: "oklch(0.980735 0.004092 301.426)",
      toolbarBorder: "oklch(0.266943 0.015262 302.425)",
      toolbarControl: "oklch(0.313674 0.030572 310.061)",
      toolbarControlForeground: "oklch(0.848252 0.038248 307.961)",
      toolbarControlHover: "oklch(0.364912 0.050794 308.491)",
      surface: "oklch(0.267101 0.02016 311.799)",
      surfaceRaised: "oklch(0.279864 0.021572 309.532)",
      surfaceOverlay: "oklch(0.154761 0.01316 338.901)",
      text: "oklch(0.980735 0.004092 301.426)",
      textMuted: "oklch(0.880303 0.03077 342.696)",
      border: "oklch(0.266943 0.015262 302.425)",
      input: "oklch(0.266817 0.02897 344.461)",
      focus: "oklch(0.591646 0.217985 0.584)",
      accent: "oklch(0.460685 0.185347 4.099)",
      accentForeground: "oklch(0.901233 0.057189 343.694)",
      secondary: "oklch(0.313674 0.030572 310.061)",
      secondaryForeground: "oklch(0.848252 0.038248 307.961)",
      muted: "oklch(0.360924 0.021469 316.83)",
      mutedForeground: "oklch(0.880303 0.03077 342.696)",
      placeholder: "oklch(0.657087 0.028226 307.985)",
      secondaryLabel: "oklch(0.880303 0.03077 342.696)",
      iconMuted: "oklch(0.848252 0.038248 307.961)",
      error: "oklch(0.458704 0.169677 3.815)",
      errorForeground: "oklch(0.901233 0.057189 343.694)",
      errorSurface: "oklch(0.259022 0.04799 340.062)",
      warning: "oklch(0.76859 0.164659 70.08)",
      warningForeground: "oklch(0.836861 0.164422 84.429)",
      warningSurface: "oklch(0.321706 0.036256 60.806)",
      update: "oklch(0.460685 0.185347 4.099)",
      updateForeground: "oklch(0.901233 0.057189 343.694)",
      updateSurface: "oklch(0.256077 0.063004 342.914)",
      accentSurface: "oklch(0.364912 0.050794 308.491)",
      accentSurfaceForeground: "oklch(0.964695 0.009139 341.803)",
      messageSurface: "oklch(0.273791 0.025541 309.079)",
      messageForeground: "oklch(0.949872 0.021269 306.838)",
      messageAction: "oklch(0.460685 0.185347 4.099)",
      messageActionForeground: "oklch(0.901233 0.057189 343.694)",
      messageActionHover: "oklch(0.458754 0.184639 3.857)",
      codeBackground: "oklch(0.22813 0.020366 307.469)",
      codeForeground: "oklch(0.848703 0.064239 306.645)",
      searchMatchBackground: "oklch(0.55 0.1 85)",
      searchMatchForeground: "oklch(0.970151 0 0)",
      searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
      searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
      sidebar: "oklch(0.185778 0.019368 322.159)",
      sidebarForeground: "oklch(0.967434 0.001326 286.375)",
      sidebarMutedForeground: "oklch(0.880303 0.03077 342.696)",
      sidebarControlSurface: "oklch(0.23366 0.026081 338.196)",
      sidebarRowHover: "oklch(0.23366 0.026081 338.196)",
      sidebarRowActive: "oklch(0.23366 0.026081 338.196)",
      sidebarRowSelected: "oklch(0.23366 0.026081 338.196)",
      sidebarBorder: "oklch(0.269132 0.030766 351.067)",
      terminalBackground: "oklch(0.22813 0.020366 307.469)",
      terminalForeground: "oklch(0.980735 0.004092 301.426)",
      terminalCursor: "oklch(0.591646 0.217985 0.584)",
      terminalSelection: "oklch(0.313674 0.030572 310.061)",
      terminalScrollbar: "oklch(0.266817 0.02897 344.461)",
      terminalScrollbarHover: "oklch(0.360924 0.021469 316.83)",
    },
  },
  sidebarArtwork: true,
};

export const GROVE_THEME: ThemeDefinition = {
  id: "grove",
  label: "Grove",
  appearance: "light",
  colors: {
    canvas: "oklch(0.972369 0.005497 157.15)",
    chrome: "oklch(0.972369 0.005497 157.15)",
    toolbar: "oklch(0.972369 0.005497 157.15)",
    toolbarForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarBorder: "oklch(0.909438 0.021521 164.612)",
    toolbarControl: "oklch(0.936464 0.014601 163.554)",
    toolbarControlForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarControlHover: "oklch(0.909438 0.021521 164.612)",
    surface: "oklch(0.972369 0.005497 157.15)",
    surfaceRaised: "oklch(0.949276 0.004496 159.002)",
    surfaceOverlay: "oklch(0.932695 0.003778 160.944)",
    text: "oklch(0.222003 0.03479 328.979)",
    textMuted: "oklch(0.540472 0.014944 326.176)",
    border: "oklch(0.864831 0.01312 167.255)",
    input: "oklch(0.829746 0.016084 168.234)",
    focus: "oklch(0.523295 0.112292 158.089)",
    accent: "oklch(0.523295 0.112292 158.089)",
    accentForeground: "oklch(0.990339 0.008411 325.64)",
    secondary: "oklch(0.936464 0.014601 163.554)",
    secondaryForeground: "oklch(0.222003 0.03479 328.979)",
    muted: "oklch(0.945455 0.012308 162.879)",
    mutedForeground: "oklch(0.527266 0.012309 320.683)",
    placeholder: "oklch(0.529681 0.01551 326.299)",
    secondaryLabel: "oklch(0.540472 0.014944 326.176)",
    iconMuted: "oklch(0.540472 0.014944 326.176)",
    error: "oklch(0.637823 0.237287 25.436)",
    errorForeground: "oklch(0.509494 0.208583 28.513)",
    errorSurface: "oklch(0.936968 0.014243 26.295)",
    warning: "oklch(0.772406 0.172798 65.367)",
    warningForeground: "oklch(0.545036 0.155019 45.359)",
    warningSurface: "oklch(0.953175 0.02009 93.379)",
    update: "oklch(0.523295 0.112292 158.089)",
    updateForeground: "oklch(0.388012 0.080082 158.768)",
    updateSurface: "oklch(0.900411 0.02384 164.795)",
    accentSurface: "oklch(0.909438 0.021521 164.612)",
    accentSurfaceForeground: "oklch(0.222003 0.03479 328.979)",
    messageSurface: "oklch(0.891377 0.026164 164.929)",
    messageForeground: "oklch(0.222003 0.03479 328.979)",
    messageAction: "oklch(0.535028 0.106403 77.549)",
    messageActionForeground: "oklch(0.990339 0.008411 325.64)",
    messageActionHover: "oklch(0.488753 0.096536 77.829)",
    codeBackground: "oklch(0.955888 0.004783 158.391)",
    codeForeground: "oklch(0.222003 0.03479 328.979)",
    searchMatchBackground: "oklch(0.915 0.11 85)",
    searchMatchForeground: "oklch(0.216164 0.028283 77.423)",
    searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
    searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
    sidebar: "oklch(0.936464 0.014601 163.554)",
    sidebarForeground: "oklch(0.222003 0.03479 328.979)",
    sidebarMutedForeground: "oklch(0.515606 0.011938 318.897)",
    sidebarControlSurface: "oklch(0.88585 0.011734 166.331)",
    sidebarRowHover: "oklch(0.886676 0.027374 164.983)",
    sidebarRowActive: "oklch(0.85335 0.03597 165.158)",
    sidebarRowSelected: "oklch(0.836654 0.040284 165.149)",
    sidebarBorder: "oklch(0.860274 0.010287 168.339)",
    terminalBackground: "oklch(0.972369 0.005497 157.15)",
    terminalForeground: "oklch(0.222003 0.03479 328.979)",
    terminalCursor: "oklch(0.523295 0.112292 158.089)",
    terminalSelection: "oklch(0.891377 0.026164 164.929)",
    terminalScrollbar: "oklch(0.824752 0.001392 294.641)",
    terminalScrollbarHover: "oklch(0.755495 0.004415 318.776)",
  },
  variants: {
    dark: {
      canvas: "oklch(0.260865 0.02152 162.75)",
      chrome: "oklch(0.260865 0.02152 162.75)",
      toolbar: "oklch(0.260865 0.02152 162.75)",
      toolbarForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarBorder: "oklch(0.464636 0.066083 158.72)",
      toolbarControl: "oklch(0.380487 0.048313 159.608)",
      toolbarControlForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarControlHover: "oklch(0.437021 0.060312 158.962)",
      surface: "oklch(0.260865 0.02152 162.75)",
      surfaceRaised: "oklch(0.363192 0.016572 165.32)",
      surfaceOverlay: "oklch(0.411828 0.014378 166.627)",
      text: "oklch(0.990339 0.008411 325.64)",
      textMuted: "oklch(0.666747 0.004239 187.292)",
      border: "oklch(0.457475 0.044046 160.971)",
      input: "oklch(0.519849 0.049896 160.863)",
      focus: "oklch(0.796228 0.133058 157.319)",
      accent: "oklch(0.796228 0.133058 157.319)",
      accentForeground: "oklch(0.222003 0.03479 328.979)",
      secondary: "oklch(0.380487 0.048313 159.608)",
      secondaryForeground: "oklch(0.990339 0.008411 325.64)",
      muted: "oklch(0.339728 0.039456 160.274)",
      mutedForeground: "oklch(0.715427 0.010896 171.428)",
      placeholder: "oklch(0.739243 0.002222 223.225)",
      secondaryLabel: "oklch(0.666747 0.004239 187.292)",
      iconMuted: "oklch(0.666747 0.004239 187.292)",
      error: "oklch(0.655108 0.221148 23.473)",
      errorForeground: "oklch(0.704237 0.187511 22.228)",
      errorSurface: "oklch(0.312773 0.02923 32.121)",
      warning: "oklch(0.772406 0.172798 65.367)",
      warningForeground: "oklch(0.829017 0.171221 81.038)",
      warningSurface: "oklch(0.345524 0.046882 99.736)",
      update: "oklch(0.796228 0.133058 157.319)",
      updateForeground: "oklch(0.86276 0.089288 159.704)",
      updateSurface: "oklch(0.448116 0.062637 158.86)",
      accentSurface: "oklch(0.437021 0.060312 158.962)",
      accentSurfaceForeground: "oklch(0.990339 0.008411 325.64)",
      messageSurface: "oklch(0.470111 0.067221 158.676)",
      messageForeground: "oklch(0.990339 0.008411 325.64)",
      messageAction: "oklch(0.791603 0.129713 83.299)",
      messageActionForeground: "oklch(0.222003 0.03479 328.979)",
      messageActionHover: "oklch(0.815227 0.117902 84.21)",
      codeBackground: "oklch(0.312979 0.018942 164.082)",
      codeForeground: "oklch(0.990339 0.008411 325.64)",
      searchMatchBackground: "oklch(0.55 0.1 85)",
      searchMatchForeground: "oklch(0.970151 0 0)",
      searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
      searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
      sidebar: "oklch(0.309925 0.032827 160.944)",
      sidebarForeground: "oklch(0.990339 0.008411 325.64)",
      sidebarMutedForeground: "oklch(0.711387 0.007643 175.89)",
      sidebarControlSurface: "oklch(0.432727 0.024549 163.654)",
      sidebarRowHover: "oklch(0.374959 0.047124 159.686)",
      sidebarRowActive: "oklch(0.41688 0.056069 159.165)",
      sidebarRowSelected: "oklch(0.437466 0.060406 158.958)",
      sidebarBorder: "oklch(0.569253 0.015933 167.062)",
      terminalBackground: "oklch(0.260865 0.02152 162.75)",
      terminalForeground: "oklch(0.990339 0.008411 325.64)",
      terminalCursor: "oklch(0.796228 0.133058 157.319)",
      terminalSelection: "oklch(0.464636 0.066083 158.72)",
      terminalScrollbar: "oklch(0.594692 0.006862 176.022)",
      terminalScrollbarHover: "oklch(0.687968 0.00354 193.55)",
    },
  },
  sidebarArtwork: true,
};

export const OCEAN_THEME: ThemeDefinition = {
  id: "ocean",
  label: "Ocean",
  appearance: "light",
  colors: {
    canvas: "oklch(0.974199 0.002856 241.597)",
    chrome: "oklch(0.974199 0.002856 241.597)",
    toolbar: "oklch(0.974199 0.002856 241.597)",
    toolbarForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarBorder: "oklch(0.91295 0.018827 241.836)",
    toolbarControl: "oklch(0.939254 0.01193 241.729)",
    toolbarControlForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarControlHover: "oklch(0.91295 0.018827 241.836)",
    surface: "oklch(0.974199 0.002856 241.597)",
    surfaceRaised: "oklch(0.951058 0.002962 258.339)",
    surfaceOverlay: "oklch(0.934442 0.003181 269.1)",
    text: "oklch(0.222003 0.03479 328.979)",
    textMuted: "oklch(0.541555 0.017468 323.531)",
    border: "oklch(0.867646 0.013482 252.362)",
    input: "oklch(0.832939 0.017389 252.598)",
    focus: "oklch(0.536684 0.120219 247.01)",
    accent: "oklch(0.536684 0.120219 247.01)",
    accentForeground: "oklch(0.990339 0.008411 325.64)",
    secondary: "oklch(0.939254 0.01193 241.729)",
    secondaryForeground: "oklch(0.222003 0.03479 328.979)",
    muted: "oklch(0.948004 0.009649 241.695)",
    mutedForeground: "oklch(0.528741 0.01828 313.823)",
    placeholder: "oklch(0.530733 0.01795 323.79)",
    secondaryLabel: "oklch(0.541555 0.017468 323.531)",
    iconMuted: "oklch(0.541555 0.017468 323.531)",
    error: "oklch(0.637823 0.237287 25.436)",
    errorForeground: "oklch(0.509494 0.208583 28.513)",
    errorSurface: "oklch(0.938747 0.016377 7.186)",
    warning: "oklch(0.772406 0.172798 65.367)",
    warningForeground: "oklch(0.546927 0.155556 45.359)",
    warningSurface: "oklch(0.954846 0.016009 81.731)",
    update: "oklch(0.536684 0.120219 247.01)",
    updateForeground: "oklch(0.397497 0.084999 246.523)",
    updateSurface: "oklch(0.904165 0.021144 241.874)",
    accentSurface: "oklch(0.91295 0.018827 241.836)",
    accentSurfaceForeground: "oklch(0.222003 0.03479 328.979)",
    messageSurface: "oklch(0.895373 0.023469 241.913)",
    messageForeground: "oklch(0.222003 0.03479 328.979)",
    messageAction: "oklch(0.493961 0.08175 201.584)",
    messageActionForeground: "oklch(0.990339 0.008411 325.64)",
    messageActionHover: "oklch(0.45151 0.074407 201.516)",
    codeBackground: "oklch(0.957684 0.002906 253.68)",
    codeForeground: "oklch(0.222003 0.03479 328.979)",
    searchMatchBackground: "oklch(0.915 0.11 85)",
    searchMatchForeground: "oklch(0.216164 0.028283 77.423)",
    searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
    searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
    sidebar: "oklch(0.939254 0.01193 241.729)",
    sidebarForeground: "oklch(0.222003 0.03479 328.979)",
    sidebarMutedForeground: "oklch(0.517366 0.018944 311.433)",
    sidebarControlSurface: "oklch(0.888479 0.011475 251.638)",
    sidebarRowHover: "oklch(0.890798 0.024681 241.933)",
    sidebarRowActive: "oklch(0.858363 0.033325 242.089)",
    sidebarRowSelected: "oklch(0.842113 0.037689 242.174)",
    sidebarBorder: "oklch(0.862823 0.011384 256.926)",
    terminalBackground: "oklch(0.974199 0.002856 241.597)",
    terminalForeground: "oklch(0.222003 0.03479 328.979)",
    terminalCursor: "oklch(0.536684 0.120219 247.01)",
    terminalSelection: "oklch(0.895373 0.023469 241.913)",
    terminalScrollbar: "oklch(0.826271 0.006191 305.456)",
    terminalScrollbarHover: "oklch(0.756866 0.008685 313.721)",
  },
  variants: {
    dark: {
      canvas: "oklch(0.242641 0.024125 250.573)",
      chrome: "oklch(0.242641 0.024125 250.573)",
      toolbar: "oklch(0.242641 0.024125 250.573)",
      toolbarForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarBorder: "oklch(0.439946 0.0561 243.479)",
      toolbarControl: "oklch(0.358725 0.043145 244.911)",
      toolbarControlForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarControlHover: "oklch(0.413315 0.051874 243.855)",
      surface: "oklch(0.242641 0.024125 250.573)",
      surfaceRaised: "oklch(0.348439 0.019942 253.696)",
      surfaceOverlay: "oklch(0.398517 0.018232 255.72)",
      text: "oklch(0.990339 0.008411 325.64)",
      textMuted: "oklch(0.652227 0.01149 273.31)",
      border: "oklch(0.438653 0.039496 245.44)",
      input: "oklch(0.500905 0.043574 244.781)",
      focus: "oklch(0.758933 0.105833 241.548)",
      accent: "oklch(0.758933 0.105833 241.548)",
      accentForeground: "oklch(0.222003 0.03479 328.979)",
      secondary: "oklch(0.358725 0.043145 244.911)",
      secondaryForeground: "oklch(0.990339 0.008411 325.64)",
      muted: "oklch(0.319287 0.036766 246.065)",
      mutedForeground: "oklch(0.691936 0.016294 261.588)",
      placeholder: "oklch(0.721641 0.010192 281.271)",
      secondaryLabel: "oklch(0.652227 0.01149 273.31)",
      iconMuted: "oklch(0.652227 0.01149 273.31)",
      error: "oklch(0.655108 0.221148 23.473)",
      errorForeground: "oklch(0.702184 0.189226 22.228)",
      errorSurface: "oklch(0.298933 0.036443 350.094)",
      warning: "oklch(0.772406 0.172798 65.367)",
      warningForeground: "oklch(0.829017 0.171221 81.038)",
      warningSurface: "oklch(0.329449 0.028712 84.495)",
      update: "oklch(0.758933 0.105833 241.548)",
      updateForeground: "oklch(0.840844 0.069217 240.151)",
      updateSurface: "oklch(0.424017 0.053575 243.695)",
      accentSurface: "oklch(0.413315 0.051874 243.855)",
      accentSurfaceForeground: "oklch(0.990339 0.008411 325.64)",
      messageSurface: "oklch(0.445224 0.056936 243.413)",
      messageForeground: "oklch(0.990339 0.008411 325.64)",
      messageAction: "oklch(0.793363 0.105022 199.893)",
      messageActionForeground: "oklch(0.222003 0.03479 328.979)",
      messageActionHover: "oklch(0.815308 0.096174 199.862)",
      codeBackground: "oklch(0.29661 0.021883 251.968)",
      codeForeground: "oklch(0.990339 0.008411 325.64)",
      searchMatchBackground: "oklch(0.55 0.1 85)",
      searchMatchForeground: "oklch(0.970151 0 0)",
      searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
      searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
      sidebar: "oklch(0.290387 0.032043 247.274)",
      sidebarForeground: "oklch(0.990339 0.008411 325.64)",
      sidebarMutedForeground: "oklch(0.69099 0.01395 266.424)",
      sidebarControlSurface: "oklch(0.417822 0.02535 250.162)",
      sidebarRowHover: "oklch(0.353381 0.042285 245.043)",
      sidebarRowActive: "oklch(0.393878 0.048778 244.179)",
      sidebarRowSelected: "oklch(0.413744 0.051943 243.848)",
      sidebarBorder: "oklch(0.55859 0.019001 256.223)",
      terminalBackground: "oklch(0.242641 0.024125 250.573)",
      terminalForeground: "oklch(0.990339 0.008411 325.64)",
      terminalCursor: "oklch(0.758933 0.105833 241.548)",
      terminalSelection: "oklch(0.439946 0.0561 243.479)",
      terminalScrollbar: "oklch(0.58613 0.012959 267.22)",
      terminalScrollbarHover: "oklch(0.681569 0.010909 276.465)",
    },
  },
  sidebarArtwork: true,
};

export const EMBER_THEME: ThemeDefinition = {
  id: "ember",
  label: "Ember",
  appearance: "light",
  colors: {
    canvas: "oklch(0.976527 0.002685 60.725)",
    chrome: "oklch(0.976527 0.002685 60.725)",
    toolbar: "oklch(0.976527 0.002685 60.725)",
    toolbarForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarBorder: "oklch(0.916502 0.01832 49.597)",
    toolbarControl: "oklch(0.942267 0.01151 50.785)",
    toolbarControlForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarControlHover: "oklch(0.916502 0.01832 49.597)",
    surface: "oklch(0.976527 0.002685 60.725)",
    surfaceRaised: "oklch(0.953321 0.002701 42.266)",
    surfaceOverlay: "oklch(0.936659 0.002879 29.96)",
    text: "oklch(0.222003 0.03479 328.979)",
    textMuted: "oklch(0.543023 0.017316 331.964)",
    border: "oklch(0.870631 0.013204 39.431)",
    input: "oklch(0.836213 0.017153 38.661)",
    focus: "oklch(0.552831 0.129438 44.656)",
    accent: "oklch(0.552831 0.129438 44.656)",
    accentForeground: "oklch(0.990339 0.008411 325.64)",
    secondary: "oklch(0.942267 0.01151 50.785)",
    secondaryForeground: "oklch(0.222003 0.03479 328.979)",
    muted: "oklch(0.950842 0.009273 51.528)",
    mutedForeground: "oklch(0.530413 0.018453 341.181)",
    placeholder: "oklch(0.532339 0.017796 331.748)",
    secondaryLabel: "oklch(0.543023 0.017316 331.964)",
    iconMuted: "oklch(0.543023 0.017316 331.964)",
    error: "oklch(0.637823 0.237287 25.436)",
    errorForeground: "oklch(0.509494 0.208583 28.513)",
    errorSurface: "oklch(0.941094 0.019938 19.375)",
    warning: "oklch(0.772406 0.172798 65.367)",
    warningForeground: "oklch(0.549154 0.156188 45.359)",
    warningSurface: "oklch(0.957148 0.020843 76.702)",
    update: "oklch(0.552831 0.129438 44.656)",
    updateForeground: "oklch(0.408647 0.091207 45.037)",
    updateSurface: "oklch(0.907902 0.020621 49.36)",
    accentSurface: "oklch(0.916502 0.01832 49.597)",
    accentSurfaceForeground: "oklch(0.222003 0.03479 328.979)",
    messageSurface: "oklch(0.899296 0.022939 49.163)",
    messageForeground: "oklch(0.222003 0.03479 328.979)",
    messageAction: "oklch(0.516323 0.161628 24.82)",
    messageActionForeground: "oklch(0.990339 0.008411 325.64)",
    messageActionHover: "oklch(0.471223 0.145843 24.688)",
    codeBackground: "oklch(0.959965 0.002668 47.512)",
    codeForeground: "oklch(0.222003 0.03479 328.979)",
    searchMatchBackground: "oklch(0.915 0.11 85)",
    searchMatchForeground: "oklch(0.216164 0.028283 77.423)",
    searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
    searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
    sidebar: "oklch(0.942267 0.01151 50.785)",
    sidebarForeground: "oklch(0.222003 0.03479 328.979)",
    sidebarMutedForeground: "oklch(0.519146 0.019214 343.427)",
    sidebarControlSurface: "oklch(0.891332 0.011179 40.596)",
    sidebarRowHover: "oklch(0.894819 0.024151 49.073)",
    sidebarRowActive: "oklch(0.863104 0.032855 48.586)",
    sidebarRowSelected: "oklch(0.84723 0.037292 48.403)",
    sidebarBorder: "oklch(0.865593 0.011154 35.246)",
    terminalBackground: "oklch(0.976527 0.002685 60.725)",
    terminalForeground: "oklch(0.222003 0.03479 328.979)",
    terminalCursor: "oklch(0.552831 0.129438 44.656)",
    terminalSelection: "oklch(0.899296 0.022939 49.163)",
    terminalScrollbar: "oklch(0.828185 0.005884 349.533)",
    terminalScrollbarHover: "oklch(0.758584 0.008423 341.16)",
  },
  variants: {
    dark: {
      canvas: "oklch(0.245899 0.019144 42.044)",
      chrome: "oklch(0.245899 0.019144 42.044)",
      toolbar: "oklch(0.245899 0.019144 42.044)",
      toolbarForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarBorder: "oklch(0.442681 0.0608 50.795)",
      toolbarControl: "oklch(0.361499 0.044052 49.515)",
      toolbarControlForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarControlHover: "oklch(0.416048 0.055354 50.484)",
      surface: "oklch(0.245899 0.019144 42.044)",
      surfaceRaised: "oklch(0.351262 0.01565 37.592)",
      surfaceOverlay: "oklch(0.401111 0.014308 34.896)",
      text: "oklch(0.990339 0.008411 325.64)",
      textMuted: "oklch(0.654017 0.009505 13.287)",
      border: "oklch(0.44099 0.040202 48.807)",
      input: "oklch(0.503003 0.045721 49.44)",
      focus: "oklch(0.762174 0.124117 52.082)",
      accent: "oklch(0.762174 0.124117 52.082)",
      accentForeground: "oklch(0.222003 0.03479 328.979)",
      secondary: "oklch(0.361499 0.044052 49.515)",
      secondaryForeground: "oklch(0.990339 0.008411 325.64)",
      muted: "oklch(0.322144 0.03574 48.309)",
      mutedForeground: "oklch(0.692479 0.015227 30.963)",
      placeholder: "oklch(0.723533 0.008741 4.515)",
      secondaryLabel: "oklch(0.654017 0.009505 13.287)",
      iconMuted: "oklch(0.654017 0.009505 13.287)",
      error: "oklch(0.655108 0.221148 23.473)",
      errorForeground: "oklch(0.702184 0.189226 22.228)",
      errorSurface: "oklch(0.310955 0.059624 24.334)",
      warning: "oklch(0.772406 0.172798 65.367)",
      warningForeground: "oklch(0.829017 0.171221 81.038)",
      warningSurface: "oklch(0.339137 0.055638 66.911)",
      update: "oklch(0.762174 0.124117 52.082)",
      updateForeground: "oklch(0.841456 0.079585 53.521)",
      updateSurface: "oklch(0.426749 0.057547 50.618)",
      accentSurface: "oklch(0.416048 0.055354 50.484)",
      accentSurfaceForeground: "oklch(0.990339 0.008411 325.64)",
      messageSurface: "oklch(0.447961 0.061874 50.849)",
      messageForeground: "oklch(0.990339 0.008411 325.64)",
      messageAction: "oklch(0.747955 0.135578 29.432)",
      messageActionForeground: "oklch(0.222003 0.03479 328.979)",
      messageActionHover: "oklch(0.775116 0.117953 29.014)",
      codeBackground: "oklch(0.299662 0.017229 39.973)",
      codeForeground: "oklch(0.990339 0.008411 325.64)",
      searchMatchBackground: "oklch(0.55 0.1 85)",
      searchMatchForeground: "oklch(0.970151 0 0)",
      searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
      searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
      sidebar: "oklch(0.293349 0.029554 46.882)",
      sidebarForeground: "oklch(0.990339 0.008411 325.64)",
      sidebarMutedForeground: "oklch(0.691874 0.012538 24.638)",
      sidebarControlSurface: "oklch(0.420227 0.022893 43.226)",
      sidebarRowHover: "oklch(0.356163 0.042933 49.385)",
      sidebarRowActive: "oklch(0.396617 0.051353 50.201)",
      sidebarRowSelected: "oklch(0.416477 0.055442 50.489)",
      sidebarBorder: "oklch(0.560372 0.016998 36.179)",
      terminalBackground: "oklch(0.245899 0.019144 42.044)",
      terminalForeground: "oklch(0.990339 0.008411 325.64)",
      terminalCursor: "oklch(0.762174 0.124117 52.082)",
      terminalSelection: "oklch(0.442681 0.0608 50.795)",
      terminalScrollbar: "oklch(0.587861 0.010463 20.444)",
      terminalScrollbarHover: "oklch(0.682876 0.009156 9.796)",
    },
  },
  sidebarArtwork: true,
};

export const IRIS_THEME: ThemeDefinition = {
  id: "iris",
  label: "Iris",
  appearance: "light",
  colors: {
    canvas: "oklch(0.976531 0.003855 303.226)",
    chrome: "oklch(0.976531 0.003855 303.226)",
    toolbar: "oklch(0.976531 0.003855 303.226)",
    toolbarForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarBorder: "oklch(0.914882 0.022965 299.986)",
    toolbarControl: "oklch(0.941387 0.014687 300.474)",
    toolbarControlForeground: "oklch(0.222003 0.03479 328.979)",
    toolbarControlHover: "oklch(0.914882 0.022965 299.986)",
    surface: "oklch(0.976531 0.003855 303.226)",
    surfaceRaised: "oklch(0.953326 0.004536 307.676)",
    surfaceOverlay: "oklch(0.936665 0.005041 310.132)",
    text: "oklch(0.222003 0.03479 328.979)",
    textMuted: "oklch(0.543042 0.018894 325.652)",
    border: "oklch(0.869608 0.018226 303.859)",
    input: "oklch(0.834773 0.023405 303.676)",
    focus: "oklch(0.525348 0.15373 294.176)",
    accent: "oklch(0.525348 0.15373 294.176)",
    accentForeground: "oklch(0.990339 0.008411 325.64)",
    secondary: "oklch(0.941387 0.014687 300.474)",
    secondaryForeground: "oklch(0.222003 0.03479 328.979)",
    muted: "oklch(0.950194 0.011956 300.733)",
    mutedForeground: "oklch(0.529955 0.022319 321.556)",
    placeholder: "oklch(0.532177 0.019333 325.784)",
    secondaryLabel: "oklch(0.543042 0.018894 325.652)",
    iconMuted: "oklch(0.543042 0.018894 325.652)",
    error: "oklch(0.637823 0.237287 25.436)",
    errorForeground: "oklch(0.509494 0.208583 28.513)",
    errorSurface: "oklch(0.941043 0.019582 4.235)",
    warning: "oklch(0.772406 0.172798 65.367)",
    warningForeground: "oklch(0.549154 0.156188 45.359)",
    warningSurface: "oklch(0.957054 0.016197 69.932)",
    update: "oklch(0.525348 0.15373 294.176)",
    updateForeground: "oklch(0.389926 0.10825 294.547)",
    updateSurface: "oklch(0.90602 0.025754 299.867)",
    accentSurface: "oklch(0.914882 0.022965 299.986)",
    accentSurfaceForeground: "oklch(0.222003 0.03479 328.979)",
    messageSurface: "oklch(0.897143 0.028558 299.758)",
    messageForeground: "oklch(0.222003 0.03479 328.979)",
    messageAction: "oklch(0.516084 0.185229 340.776)",
    messageActionForeground: "oklch(0.990339 0.008411 325.64)",
    messageActionHover: "oklch(0.471003 0.16748 340.687)",
    codeBackground: "oklch(0.95997 0.004338 306.542)",
    codeForeground: "oklch(0.222003 0.03479 328.979)",
    searchMatchBackground: "oklch(0.915 0.11 85)",
    searchMatchForeground: "oklch(0.216164 0.028283 77.423)",
    searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
    searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
    sidebar: "oklch(0.941387 0.014687 300.474)",
    sidebarForeground: "oklch(0.222003 0.03479 328.979)",
    sidebarMutedForeground: "oklch(0.518417 0.023683 320.681)",
    sidebarControlSurface: "oklch(0.890512 0.0155 303.803)",
    sidebarRowHover: "oklch(0.892522 0.030022 299.704)",
    sidebarRowActive: "oklch(0.85971 0.040501 299.36)",
    sidebarRowSelected: "oklch(0.843236 0.045818 299.198)",
    sidebarBorder: "oklch(0.864805 0.015938 305.371)",
    terminalBackground: "oklch(0.976531 0.003855 303.226)",
    terminalForeground: "oklch(0.222003 0.03479 328.979)",
    terminalCursor: "oklch(0.525348 0.15373 294.176)",
    terminalSelection: "oklch(0.897143 0.028558 299.758)",
    terminalScrollbar: "oklch(0.828195 0.008526 318.858)",
    terminalScrollbarHover: "oklch(0.758596 0.010892 321.538)",
  },
  variants: {
    dark: {
      canvas: "oklch(0.225975 0.031062 293.741)",
      chrome: "oklch(0.225975 0.031062 293.741)",
      toolbar: "oklch(0.225975 0.031062 293.741)",
      toolbarForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarBorder: "oklch(0.395417 0.085554 294.182)",
      toolbarControl: "oklch(0.325405 0.063614 294.23)",
      toolbarControlForeground: "oklch(0.990339 0.008411 325.64)",
      toolbarControlHover: "oklch(0.372436 0.07841 294.204)",
      surface: "oklch(0.225975 0.031062 293.741)",
      surfaceRaised: "oklch(0.335291 0.026008 296.394)",
      surfaceOverlay: "oklch(0.386739 0.024023 297.509)",
      text: "oklch(0.990339 0.008411 325.64)",
      textMuted: "oklch(0.640465 0.016197 304.171)",
      border: "oklch(0.40874 0.058536 295.893)",
      input: "oklch(0.46756 0.065775 296.265)",
      focus: "oklch(0.671712 0.169136 293.929)",
      accent: "oklch(0.671712 0.169136 293.929)",
      accentForeground: "oklch(0.222003 0.03479 328.979)",
      secondary: "oklch(0.325405 0.063614 294.23)",
      secondaryForeground: "oklch(0.990339 0.008411 325.64)",
      muted: "oklch(0.291515 0.05276 294.209)",
      mutedForeground: "oklch(0.663321 0.025932 301.862)",
      placeholder: "oklch(0.706249 0.014508 306.607)",
      secondaryLabel: "oklch(0.640465 0.016197 304.171)",
      iconMuted: "oklch(0.640465 0.016197 304.171)",
      error: "oklch(0.655108 0.221148 23.473)",
      errorForeground: "oklch(0.702184 0.189226 22.228)",
      errorSurface: "oklch(0.291658 0.054707 352.238)",
      warning: "oklch(0.772406 0.172798 65.367)",
      warningForeground: "oklch(0.829017 0.171221 81.038)",
      warningSurface: "oklch(0.318952 0.033845 51.646)",
      update: "oklch(0.671712 0.169136 293.929)",
      updateForeground: "oklch(0.785032 0.108439 296.344)",
      updateSurface: "oklch(0.381668 0.081286 294.195)",
      accentSurface: "oklch(0.372436 0.07841 294.204)",
      accentSurfaceForeground: "oklch(0.990339 0.008411 325.64)",
      messageSurface: "oklch(0.399975 0.086965 294.177)",
      messageForeground: "oklch(0.990339 0.008411 325.64)",
      messageAction: "oklch(0.789904 0.130063 337.621)",
      messageActionForeground: "oklch(0.222003 0.03479 328.979)",
      messageActionHover: "oklch(0.813537 0.114101 337.23)",
      codeBackground: "oklch(0.281873 0.028308 295.193)",
      codeForeground: "oklch(0.990339 0.008411 325.64)",
      searchMatchBackground: "oklch(0.55 0.1 85)",
      searchMatchForeground: "oklch(0.970151 0 0)",
      searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
      searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
      sidebar: "oklch(0.266743 0.044689 294.138)",
      sidebarForeground: "oklch(0.990339 0.008411 325.64)",
      sidebarMutedForeground: "oklch(0.668773 0.021522 302.949)",
      sidebarControlSurface: "oklch(0.399977 0.035678 297.031)",
      sidebarRowHover: "oklch(0.320808 0.062152 294.23)",
      sidebarRowActive: "oklch(0.355677 0.073167 294.217)",
      sidebarRowSelected: "oklch(0.372806 0.078525 294.203)",
      sidebarBorder: "oklch(0.545895 0.027522 299.871)",
      terminalBackground: "oklch(0.225975 0.031062 293.741)",
      terminalForeground: "oklch(0.990339 0.008411 325.64)",
      terminalCursor: "oklch(0.671712 0.169136 293.929)",
      terminalSelection: "oklch(0.395417 0.085554 294.182)",
      terminalScrollbar: "oklch(0.578663 0.017888 302.229)",
      terminalScrollbarHover: "oklch(0.676012 0.015271 305.433)",
    },
  },
  sidebarArtwork: true,
};

/** Frosted glass and soft depth with a single violet accent. Restyles only stable theme hooks
 * and keeps to transitions: an always-running animation here would cost GPU on every frame. */
const LIQUID_HALO_CSS = `
:root {
  --radius: 0.75rem;
  --glass-blur: 20px;
  --glass-saturation: 1.35;
  --halo: color-mix(in oklab, var(--primary) 16%, transparent);
  --halo-strong: color-mix(in oklab, var(--primary) 34%, transparent);
  --halo-depth: 0 1px 2px rgb(18 16 40 / 6%), 0 16px 40px -16px color-mix(in oklab, var(--primary) 28%, transparent);
  --spring: linear(0, 0.078, 0.249, 0.448, 0.633, 0.786, 0.899, 0.975, 1.02, 1.042, 1.048, 1.045, 1.037, 1.027, 1.018, 1.011, 1.005, 1.001, 0.999, 0.998, 1);
  --spring-settle: linear(0, 0.142, 0.383, 0.596, 0.752, 0.855, 0.919, 0.956, 0.977, 0.988, 0.994, 0.997, 0.999, 1);
}
.dark {
  --halo-depth: 0 1px 0 rgb(255 255 255 / 4%) inset, 0 20px 48px -20px rgb(0 0 0 / 70%), 0 0 0 1px rgb(255 255 255 / 5%);
}
/* A: glass, line, elevation and type tokens. :root:root outranks the app's dark glass tokens. */
:root:root {
  --glass-blur: 20px;
  --glass-saturation: 1.4;
  --primary-light: #b9b0ff;
  --halo-line: rgb(255 255 255 / 8%);
  --halo-line-2: rgb(255 255 255 / 14%);
  --halo-hl: inset 0 1px 0 rgb(255 255 255 / 8%);
  --halo-card: rgb(20 23 33 / 55%);
  --halo-card-shadow: var(--halo-hl), 0 24px 48px -20px rgb(0 0 0 / 55%);
  --e1: 0 1px 2px rgb(0 0 0 / 35%);
  --e2: 0 8px 24px -10px rgb(0 0 0 / 55%);
  --e3: 0 24px 48px -20px rgb(0 0 0 / 60%);
  --e4: 0 30px 70px -18px rgb(0 0 0 / 75%);
  --font-sans: "Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, "Inter Variable", system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
:root:root:not(.dark) {
  --primary-light: #5544d2;
  --halo-line: rgb(24 27 38 / 7%);
  --halo-line-2: rgb(24 27 38 / 12%);
  --halo-hl: inset 0 1px 0 rgb(255 255 255 / 90%);
  --halo-card: rgb(255 255 255 / 74%);
  --halo-card-shadow: var(--halo-hl), var(--e2);
  --e1: 0 1px 2px rgb(20 24 40 / 6%), 0 2px 6px rgb(20 24 40 / 4%);
  --e2: 0 1px 2px rgb(20 24 40 / 5%), 0 6px 20px rgb(20 24 40 / 7%);
  --e3: 0 2px 4px rgb(20 24 40 / 5%), 0 14px 36px rgb(20 24 40 / 10%);
  --e4: 0 4px 10px rgb(20 24 40 / 6%), 0 28px 64px rgb(20 24 40 / 18%);
}
/* A: one ambient field behind every floating card (static: no animated blur blobs). */
body {
  letter-spacing: -0.005em;
  background:
    radial-gradient(60% 50% at 6% 0%, rgb(139 124 255 / 12%), transparent 70%),
    radial-gradient(45% 45% at 100% 30%, rgb(106 91 224 / 7%), transparent 70%),
    radial-gradient(50% 40% at 35% 100%, rgb(58 63 82 / 10%), transparent 70%),
    radial-gradient(120% 80% at 50% 0%, #121521, #0c0e13 70%) !important;
}
:root:not(.dark) body {
  background:
    radial-gradient(60% 50% at 6% 0%, rgb(96 78 221 / 6.6%), transparent 70%),
    radial-gradient(45% 45% at 100% 30%, rgb(74 57 190 / 3.9%), transparent 70%),
    radial-gradient(50% 40% at 35% 100%, rgb(201 204 216 / 5.5%), transparent 70%),
    radial-gradient(120% 80% at 50% 0%, #f3f4f8, #e9ebf1 70%) !important;
}
::selection {
  background: color-mix(in srgb, var(--ring) 35%, transparent);
}
[data-workspace-area="conversation"],
html[data-theme-id] [data-chat-header] {
  background: transparent;
}
/* A: composer card, 28px glass with a violet focus glow. */
[data-slot="composer-host"] {
  border-radius: 28px !important;
  background: color-mix(in srgb, var(--card) 62%, transparent);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  box-shadow: var(--halo-hl), 0 0 0 1px var(--halo-line), 0 24px 48px -20px rgb(0 0 0 / 55%) !important;
  transition: box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
[data-slot="composer-host"]:focus-within {
  box-shadow: var(--halo-hl), 0 0 0 1px color-mix(in srgb, var(--ring) 35%, transparent), 0 24px 60px -20px color-mix(in srgb, var(--ring) 45%, transparent) !important;
}
:root:not(.dark) [data-slot="composer-host"] {
  background: rgb(255 255 255 / 90%);
  box-shadow: var(--halo-hl), var(--e3) !important;
}
:root:not(.dark) [data-slot="composer-host"]:focus-within {
  box-shadow: var(--halo-hl), 0 0 0 1px color-mix(in srgb, var(--primary) 32%, transparent), 0 24px 60px -20px color-mix(in srgb, var(--primary) 30%, transparent) !important;
}
[data-user-message-bubble] {
  /* C: prototype bubble: glass fill, tail corner bottom-right. */
  border-radius: 20px 20px 6px 20px;
  background: rgb(255 255 255 / 0.08);
  border: 1px solid var(--halo-line, rgb(255 255 255 / 0.08));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}
:root:not(.dark) [data-user-message-bubble] {
  background: #fff;
  border-color: transparent;
  box-shadow: 0 1px 2px rgb(20 24 40 / 0.05), 0 6px 20px rgb(20 24 40 / 0.07);
}
:is([data-slot="popover-popup"]:not([data-variant]), [data-slot="menu-popup"], [data-slot="dialog-popup"]) {
  border-radius: 16px;
  background: color-mix(in srgb, var(--card) 78%, transparent) !important;
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(1.5);
  backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(1.5);
  border-color: var(--halo-line-2, rgb(255 255 255 / 14%)) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%), 0 28px 60px -16px rgb(0 0 0 / 70%);
}
:root:not(.dark)
  :is([data-slot="popover-popup"]:not([data-variant]), [data-slot="menu-popup"], [data-slot="dialog-popup"]) {
  background: rgb(255 255 255 / 94%) !important;
}
:is([data-slot="popover-popup"]:not([data-variant]), [data-slot="menu-popup"]) {
  border-radius: 24px;
}
[data-thread-details-card] {
  border-radius: 24px;
  border-color: var(--halo-line-2, rgb(255 255 255 / 14%));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%), 0 28px 60px -16px rgb(0 0 0 / 70%);
}
[data-slot="tooltip-popup"] {
  border-radius: 10px;
}
/* A: neutral sidebar rows; the active row is a lifted glass chip, not a violet glow. */
[data-thread-item] > * {
  border-radius: 12px;
  transition: background-color 160ms ease-out, box-shadow 220ms ease-out;
}
[data-thread-item] > :hover {
  background: color-mix(in srgb, var(--foreground) 4.5%, transparent);
}
[data-thread-item] > [aria-current="page"] {
  background: rgb(255 255 255 / 8%);
  box-shadow: var(--halo-hl), 0 0 0 1px rgb(255 255 255 / 5%);
}
:root:not(.dark) [data-thread-item] > [aria-current="page"] {
  background: #fff;
  box-shadow: var(--e1);
}
/* A: the sidebar is a floating glass card; the composer host owns its own glass. */
[data-slot="sidebar-inner"] {
  border-radius: 24px;
  overflow: hidden;
  background: var(--halo-card);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  border: 1px solid var(--halo-line);
  box-shadow: var(--halo-card-shadow);
}
:root:not(.dark) [data-slot="sidebar-inner"] {
  border-color: transparent;
}
[data-chat-composer-form] {
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
:is([data-slot="composer-shell"], [data-slot="composer-host"])::before {
  display: none;
}
[data-slot="composer-host"]::after {
  border-color: transparent !important;
}
[data-approval-card] {
  /* C: prototype approval card. */
  margin-block: 12px 16px;
  padding: 12px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--card) 55%, transparent);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08), 0 8px 24px -10px rgb(0 0 0 / 0.55), 0 0 0 1px var(--halo-strong);
}
[data-approval-card] code {
  margin-block: 2px 6px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.6;
  background: rgb(6 8 13 / 0.6);
  box-shadow: inset 0 0 0 1px var(--halo-line, var(--border));
}
:root:not(.dark) [data-approval-card] {
  background: rgb(255 255 255 / 0.74);
  box-shadow: 0 8px 24px -10px rgb(20 24 40 / 0.18), 0 0 0 1px var(--halo-strong);
}
:root:not(.dark) [data-approval-card] code {
  background: rgb(24 27 38 / 0.04);
}
[data-command-palette] {
  border-radius: 28px;
  background: color-mix(in srgb, var(--popover) 80%, transparent) !important;
  -webkit-backdrop-filter: blur(28px) saturate(1.5);
  backdrop-filter: blur(28px) saturate(1.5);
  border-color: var(--halo-line-2, rgb(255 255 255 / 14%)) !important;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%), 0 40px 80px -20px rgb(0 0 0 / 75%);
}
[data-slot="toast-viewport"] {
  --toast-footer-offset: 7.5rem;
}
[data-slot="toast-viewport"] > * {
  transition-timing-function: var(--spring), ease-out, ease-out;
}
[data-slot="toast-viewport"] > [data-ending-style] {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
[data-terminal-drawer-frame] {
  transition-timing-function: var(--spring-settle);
}
:is([data-right-panel-shell], [data-slot="sidebar-gap"], [data-slot="sidebar-container"]) {
  transition-timing-function: var(--spring-settle);
}
:root:not(.dark) [data-slot="composer-host"],
:root:not(.dark) [data-thread-details-card] {
  border-color: transparent;
}
/* A: light mode lifts white cards on soft layered shadows instead of hairlines. */
:root:not(.dark) :is([data-halo-card], [data-halo-column], [data-halo-test-run]) {
  border-color: transparent;
  box-shadow: var(--halo-hl), var(--e2);
}
@media (prefers-reduced-motion: reduce) {
  :is([data-slot="composer-host"], [data-thread-item] > *) {
    transition: none;
  }
  :is([data-slot="toast-viewport"] > *, [data-terminal-drawer-frame]) {
    transition-timing-function: ease-out;
  }
}
`;

export const LIQUID_HALO_THEME: ThemeDefinition = {
  id: "liquid-halo",
  label: "Liquid Halo",
  appearance: "light",
  colors: {
    canvas: "#e9ebf1",
    chrome: "#e9ebf1",
    toolbar: "#e9ebf1",
    toolbarForeground: "#15161c",
    toolbarBorder: "#dadce3",
    toolbarControl: "#ffffff",
    toolbarControlForeground: "#16171f",
    toolbarControlHover: "#ececf3",
    surface: "#ffffff",
    surfaceRaised: "#f3f4f8",
    surfaceOverlay: "#ffffff",
    text: "#15161c",
    textMuted: "#4a4f5e",
    border: "#dadce3",
    input: "#d5d5e2",
    focus: "#604edd",
    accent: "#604edd",
    accentForeground: "#ffffff",
    secondary: "#ececf3",
    secondaryForeground: "#15161c",
    muted: "#f0f0f5",
    mutedForeground: "#4a4f5e",
    placeholder: "#5c6272",
    secondaryLabel: "#5c6272",
    iconMuted: "#5c6272",
    error: "#b04848",
    errorForeground: "#b42318",
    errorSurface: "#fbeceb",
    warning: "#d9930f",
    warningForeground: "#8a5a00",
    warningSurface: "#faf1e1",
    update: "#604edd",
    updateForeground: "#4a39c4",
    updateSurface: "#ebe8fb",
    accentSurface: "#efeff3",
    accentSurfaceForeground: "#15161c",
    messageSurface: "#ebe8fb",
    messageForeground: "#15161c",
    messageAction: "#604edd",
    messageActionForeground: "#ffffff",
    messageActionHover: "#5544d2",
    codeBackground: "#fafafd",
    codeForeground: "#15161c",
    searchMatchBackground: "#ffde8b",
    searchMatchForeground: "#21180a",
    searchMatchActiveBackground: "#eea52b",
    searchMatchActiveForeground: "#21180a",
    sidebar: "#f3f4f8",
    sidebarForeground: "#15161c",
    sidebarMutedForeground: "#4a4f5e",
    sidebarControlSurface: "#e6e6ef",
    sidebarRowHover: "#e6e6ef",
    sidebarRowActive: "#ffffff",
    sidebarRowSelected: "#ffffff",
    sidebarBorder: "#e3e3ec",
    terminalBackground: "#fafafd",
    terminalForeground: "#15161c",
    terminalCursor: "#604edd",
    terminalSelection: "#d9d4f7",
    terminalScrollbar: "#d5d5e2",
    terminalScrollbarHover: "#b9b9cc",
  },
  variants: {
    dark: {
      canvas: "#0c0e13",
      chrome: "#0c0e13",
      toolbar: "#0c0e13",
      toolbarForeground: "#e9ecf3",
      toolbarBorder: "#1d2029",
      toolbarControl: "#1b1e28",
      toolbarControlForeground: "#ecedf3",
      toolbarControlHover: "#232634",
      surface: "#141721",
      surfaceRaised: "#1b1e28",
      surfaceOverlay: "#1f2230",
      text: "#e9ecf3",
      textMuted: "#a3a9b8",
      border: "#1d2029",
      input: "#2e3242",
      focus: "#8b7cff",
      accent: "#8b7cff",
      accentForeground: "#0c0e13",
      secondary: "#1f2230",
      secondaryForeground: "#e9ecf3",
      muted: "#1b1e28",
      mutedForeground: "#a3a9b8",
      placeholder: "#7f8698",
      secondaryLabel: "#7f8698",
      iconMuted: "#7f8698",
      error: "#d48a8a",
      errorForeground: "#f0a3a3",
      errorSurface: "#2a1719",
      warning: "#d9a957",
      warningForeground: "#e9c27d",
      warningSurface: "#2a2215",
      update: "#8b7cff",
      updateForeground: "#b3a9ff",
      updateSurface: "#262341",
      accentSurface: "#292c35",
      accentSurfaceForeground: "#e9ecf3",
      messageSurface: "#262341",
      messageForeground: "#e9ecf3",
      messageAction: "#6a57e8",
      messageActionForeground: "#ffffff",
      messageActionHover: "#7865f0",
      codeBackground: "#12141c",
      codeForeground: "#e9ecf3",
      searchMatchBackground: "oklch(0.55 0.1 85)",
      searchMatchForeground: "oklch(0.970151 0 0)",
      searchMatchActiveBackground: "oklch(0.774202 0.151946 74.331)",
      searchMatchActiveForeground: "oklch(0.216164 0.028283 77.423)",
      sidebar: "#141721",
      sidebarForeground: "#e9ecf3",
      sidebarMutedForeground: "#a3a9b8",
      sidebarControlSurface: "#1b1e28",
      sidebarRowHover: "#1f212b",
      sidebarRowActive: "#272a33",
      sidebarRowSelected: "#272a33",
      sidebarBorder: "#1d2029",
      terminalBackground: "#0c0e13",
      terminalForeground: "#e9ecf3",
      terminalCursor: "#8b7cff",
      terminalSelection: "#2f2a55",
      terminalScrollbar: "#2e3242",
      terminalScrollbarHover: "#454a5e",
    },
  },
  css: LIQUID_HALO_CSS,
  haloExperience: true,
};

export const BUILT_IN_THEMES: ReadonlyArray<ThemeDefinition> = [
  T3_CHAT_THEME,
  GROVE_THEME,
  OCEAN_THEME,
  EMBER_THEME,
  IRIS_THEME,
  LIQUID_HALO_THEME,
];

export function getThemeColorsForAppearance(
  theme: ThemeDefinition,
  appearance: ThemeAppearance,
): ThemeColors | null {
  if (theme.appearance === appearance) return theme.colors;
  return theme.variants?.[appearance] ?? null;
}
