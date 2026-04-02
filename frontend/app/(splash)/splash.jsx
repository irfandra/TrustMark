import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

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
      router.replace('/(tabs)/(creator)/(tabs)/collection');
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
      <Text style={styles.tagline}>Creator Authentication Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F1E8",
  },
  bgOrbTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#D95F47",
    opacity: 0.18,
    top: -60,
    right: -40,
  },
  bgOrbBottom: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#1E2C3A",
    opacity: 0.12,
    bottom: -90,
    left: -80,
  },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#D95F47",
    borderWidth: 3,
    borderColor: "#1E2C3A",
    marginBottom: 20,
    shadowColor: "#7A2E1F",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  wordmark: {
    fontWeight: "900",
    fontSize: 34,
    letterSpacing: 2.4,
    color: "#1E2C3A",
  },
  tagline: {
    marginTop: 10,
    fontSize: 13,
    letterSpacing: 1.1,
    color: "#6B5A4B",
    textTransform: "uppercase",
  },
});
