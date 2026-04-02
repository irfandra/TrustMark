import { Platform } from 'react-native';

const tintColorLight = '#D95F47';
const tintColorDark = '#F2B9A7';

export const Colors = {
  light: {
    text: '#1E2C3A',
    background: '#F6F1E8',
    tint: tintColorLight,
    icon: '#9E8F7B',
    tabIconDefault: '#6D7888',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F3EEE6',
    background: '#101A25',
    tint: tintColorDark,
    icon: '#AE9C8A',
    tabIconDefault: '#8E9CAD',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'Georgia',
    rounded: 'Avenir Next Condensed',
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-condensed',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Trebuchet MS', 'Gill Sans', sans-serif",
    serif: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
    rounded: "'Avenir Next Condensed', 'Trebuchet MS', sans-serif",
    mono: "Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});