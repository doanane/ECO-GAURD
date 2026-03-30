export const COLORS = {
  CYAN: '#00e5ff',
  CYAN_DIM: '#00b8d4',
  AMBER: '#ffab00',
  AMBER_DIM: '#ff6d00',
  GREEN: '#00e676',
  GREEN_LEAF: '#00c853',
  RED: '#ff1744',
  MAGENTA: '#e040fb',
  TEAL: '#1de9b6',

  BG_DEEP: '#030a12',
  BG_SURFACE: '#091828',
  BG_SURFACE_2: '#0d2038',
  BG_CARD: '#060f1c',

  BORDER: '#122840',
  BORDER_2: '#1c3d60',

  TEXT_PRIMARY: '#b0d4ef',
  TEXT_SECONDARY: '#6a9bbe',
  TEXT_MUTED: '#2d5577',

  WHITE: '#ffffff',
  TRANSPARENT: 'transparent',
} as const;

export const STATUS_COLORS = {
  NOMINAL: COLORS.TEAL,
  WARNING: COLORS.AMBER,
  CRITICAL: COLORS.RED,
  OFFLINE: COLORS.TEXT_MUTED,
  ONLINE: COLORS.GREEN,
} as const;

export type ColorKey = keyof typeof COLORS;
