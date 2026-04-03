import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from 'react-native';
import { styles } from '@/constants/styles/splash-styles.js';

export default function SplashScreen() {
  const router = useRouter();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)/(collection)/collection');
    }, 2300);

    return () => clearTimeout(timer);
  }, [glow, router]);

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <Animated.View
        style={[
          styles.mark,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Text style={styles.wordmark}>TRUSTMARK</Text>
      <Text style={styles.tagline}>All In One Product Management Platform</Text>
    </View>
  );
}

