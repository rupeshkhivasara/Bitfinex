// Shared layout and typography tokens for StyleSheets (sizes, weights, radii, opacity).

export const Radius = {
  card: 8,
  button: 10,
  tabUnderline: 1,
} as const;

export const Opacity = {
  disabled: 0.28,
  buttonDisabled: 0.45,
} as const;

export const FontSize = {
  xs: 9,
  sm2: 10,
  sm: 11,
  body: 12,
  bodyMd: 13,
  subtitle: 14,
  titleSm: 16,
  navTitle: 17,
  title: 22,
  backChevron: 40,
  precStepper: 26,
} as const;

export const FontWeight = {
  w200: "200" as const,
  w300: "300" as const,
  w500: "500" as const,
  w600: "600" as const,
  w700: "700" as const,
  w800: "800" as const,
};

export const LetterSpacing = {
  sectionTitle: 0.6,
  footerLink: 0.6,
  headerCell: 0.4,
  headerCellDetail: 0.5,
} as const;

export const Spacing = {
  screenHorizontal: 20,
  bookHorizontal: 10,
  bookBottom: 12,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  activityIndicatorBottom: 12,
} as const;
