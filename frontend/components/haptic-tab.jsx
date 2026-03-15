import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

/**
 * HapticTab: adds light haptic feedback on iOS when pressing bottom tabs
 */
export function HapticTab(props) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Soft haptic feedback for iOS
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        // Call original onPressIn if provided
        props.onPressIn?.(ev);
      }}
    />
  );
}