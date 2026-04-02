// components/card/BrandCard.jsx
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

export default function BrandCard({ id, name, logo, image, style }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/(tabs)/(collector)/marketplace/brand/${id}`);
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.overlay} />

      <View style={styles.footer}>
        <View style={styles.brandRow}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.name}>{name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    aspectRatio: 1,
    shadowColor: "#12253A",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,37,58,0.58)",
  },
  footer: {
    flex: 1,
    padding: 14,
    justifyContent: "flex-end",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF9F0",
    borderWidth: 1,
    borderColor: "#E4D9C9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 40,
    height: 40,
  },
  name: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFF9F0",
    letterSpacing: 0.3,
  },
});