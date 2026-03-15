import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, View } from 'react-native';

// iOS-specific import (Metro resolves automatically)
const IconSymbolIOS = Platform.OS === 'ios' ? require('./icon-symbol.ios').IconSymbol : null;

// Mapping SF Symbols to MaterialIcons names
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send', 
  'qr-code-scanner.fill': 'qr-code-scanner',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
};

/**
 * Cross-platform: SF Symbols (iOS), MaterialIcons (Android/Web)
 */
export function IconSymbol({ name, size = 24, color, style, weight }) {
  // iOS: Native SF Symbols
  if (Platform.OS === 'ios' && IconSymbolIOS) {
    return (
      <IconSymbolIOS
        name={name}
        size={size}
        color={color}
        style={style}
        weight={weight}
      />
    );
  }

  // Android/Web: MaterialIcons with size wrapper
  return (
    <View style={[{ width: size, height: size }, style]}>
      <MaterialIcons
        name={MAPPING[name]}
        size={size}
        color={color}
      />
    </View>
  );
}