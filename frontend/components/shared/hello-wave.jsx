import React from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function HelloWave() {
  // Shared value for rotation
  const rotation = useSharedValue(0);

  // Start waving animation
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(25, { duration: 300 }),
      4,
      true // true = alternate direction
    );
  }, []);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={{ fontSize: 28, lineHeight: 32, marginTop: -6 }}>👋</Text>
    </Animated.View>
  );
}