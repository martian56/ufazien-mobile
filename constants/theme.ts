import { Platform } from 'react-native';

// Primary — a deeper, slightly warmer blue that feels intentional
export const PrimaryBlue = '#1A56DB';
export const PrimaryIndigo = '#4338CA';
export const PrimaryPurple = '#7C3AED';

// Backgrounds — warm off-whites instead of pure gray-50
export const BackgroundPrimary = '#F8F8FA';
export const BackgroundCard = '#FFFFFF';
export const BackgroundHover = '#F1F2F5';
export const BackgroundSubtle = '#EEEEF2';

// Text — softer than pure gray-900/600 for less stark contrast
export const TextPrimary = '#1A1D26';
export const TextSecondary = '#5E6278';
export const TextTertiary = '#A1A5B7';
export const TextLink = '#1A56DB';

// Borders — warm gray
export const BorderDefault = '#E1E3EA';
export const BorderFocus = '#1A56DB';
export const BorderSubtle = '#ECECF1';

// Accent Colors — slightly muted for sophistication
export const SuccessGreen = '#0D9668';
export const ErrorRed = '#DC2626';
export const WarningYellow = '#D97706';
export const InfoBlue = '#3B82F6';

// Border Radius
export const RadiusSmall = 8;
export const RadiusMedium = 12;
export const RadiusLarge = 16;
export const RadiusFull = 999;

// Shadows reusable tokens
export const ShadowLight = {
  shadowColor: '#1A1D26',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

export const ShadowMedium = {
  shadowColor: '#1A1D26',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 3,
};

export const ShadowHeavy = {
  shadowColor: '#1A1D26',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 6,
};

export const Colors = {
  light: {
    text: TextPrimary,
    background: BackgroundPrimary,
    tint: PrimaryBlue,
    icon: TextSecondary,
    tabIconDefault: TextTertiary,
    tabIconSelected: PrimaryBlue,
    card: BackgroundCard,
    border: BorderDefault,
    borderSubtle: BorderSubtle,
    primary: PrimaryBlue,
    indigo: PrimaryIndigo,
    purple: PrimaryPurple,
    success: SuccessGreen,
    error: ErrorRed,
    warning: WarningYellow,
    info: InfoBlue,
    subtle: BackgroundSubtle,
  },
  dark: {
    text: '#E8E9ED',
    background: '#111318',
    tint: '#4B83F0',
    icon: '#8B8FA3',
    tabIconDefault: '#8B8FA3',
    tabIconSelected: '#4B83F0',
    card: '#1C1F2A',
    border: '#2D3044',
    borderSubtle: '#252838',
    primary: '#4B83F0',
    indigo: '#6366F1',
    purple: '#8B5CF6',
    success: '#10B981',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    subtle: '#1C1F2A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
