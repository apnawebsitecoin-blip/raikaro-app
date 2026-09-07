export type ThemeColors = {
  background:   string;
  card:         string;
  cardAlt:      string;
  text:         string;
  textSub:      string;
  textMuted:    string;
  border:       string;
  borderStrong: string;
  indigo:       string;
  indigoMuted:  string;
  green:        string;
  greenMuted:   string;
  statusBar:    'dark-content' | 'light-content';
};

export const LightColors: ThemeColors = {
  background:   '#F9FAFB',
  card:         '#FFFFFF',
  cardAlt:      '#F3F4F6',
  text:         '#111827',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  border:       '#F3F4F6',
  borderStrong: '#E5E7EB',
  indigo:       '#4F46E5',
  indigoMuted:  '#EEF2FF',
  green:        '#059669',
  greenMuted:   '#ECFDF5',
  statusBar:    'dark-content',
};

export const DarkColors: ThemeColors = {
  background:   '#0F0F0F',
  card:         '#1C1C1E',
  cardAlt:      '#2C2C2E',
  text:         '#F1F5F9',
  textSub:      '#94A3B8',
  textMuted:    '#64748B',
  border:       '#2C2C2E',
  borderStrong: '#3A3A3C',
  indigo:       '#818CF8',
  indigoMuted:  '#1E1B4B',
  green:        '#34D399',
  greenMuted:   '#052E16',
  statusBar:    'light-content',
};
