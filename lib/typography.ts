import { TextStyle } from 'react-native';

export const T: Record<string, TextStyle> = {
  h1:       { fontSize: 24, fontWeight: '800', lineHeight: 32 },
  h2:       { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  h3:       { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  h4:       { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  body:     { fontSize: 14, fontWeight: '400', lineHeight: 22 },
  bodyMed:  { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  label:    { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  caption:  { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  price:    { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  priceSm:  { fontSize: 15, fontWeight: '700' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 99,
} as const;
