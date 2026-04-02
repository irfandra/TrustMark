// components/card/CollectionCard.jsx
import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import { Fonts } from "../../constants/theme";

export default function CollectionCard({
  tag,
  tagColor,
  tagTextColor,
  brand,
  brandLogo,
  name,
  category,
  items,
  sold,
  inStock,
  floorPrice,
  floorUsd,
  image,
  style,
  onPress,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const resolvedTagColor =
    tagColor ||
    (tag === "Low Stock"
      ? "#D95F47"
      : tag === "Medium Stock"
        ? "#B6842D"
        : tag === "Out of Stock"
          ? "#6B5A4B"
          : "#2D7A4E");
  const resolvedTagTextColor = tagTextColor || "#FFF9F0";

  return (
    <Animated.View
      style={[styles.wrapper, style, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: image }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.collectionName} numberOfLines={1}>
              {name}
            </Text>
            <View style={[styles.tagBadge, { backgroundColor: resolvedTagColor }]}> 
              <Text style={[styles.tagText, { color: resolvedTagTextColor }]}>{tag}</Text>
            </View>
          </View>

          <Text style={styles.categoryText} numberOfLines={1}>
            {category}
          </Text>

          <View style={styles.brandRow}>
            {brandLogo ? (
              <Image
                source={{ uri: brandLogo }}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.brandFallback}>
                <Text style={styles.brandFallbackText}>
                  {String(brand || "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.brandName} numberOfLines={1}>
              {brand}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Items {(items ?? 0).toLocaleString()}</Text>
            <Text style={styles.infoDot}>•</Text>
            <Text style={styles.infoText}>In Stock {((inStock ?? sold) ?? 0).toLocaleString()}</Text>
          </View>

          <View style={styles.floorRow}>
            <Text style={styles.floorLabel}>Floor Price</Text>
            <Text style={styles.floorAmountText}>{floorPrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    shadowColor: "#1A2640",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  card: {
    flexDirection: "row",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F6F1E8",
    borderWidth: 1,
    borderColor: "#D4D9E6",
  },
  mediaWrap: {
    width: 112,
    minHeight: 126,
    padding: 10,
    backgroundColor: "#F6F1E8",
  },
  mediaImage: {
    flex: 1,
    borderRadius: 16,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 7,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  brandFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#eeeeee",
    alignItems: "center",
    justifyContent: "center",
  },
  brandFallbackText: {
    color: "#F4F6FB",
    fontSize: 9,
    fontWeight: "800",
  },
  brandName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4A5672",
    flex: 1,
  },
  collectionName: {
    fontSize: 18,
    fontFamily: Fonts.serif,
    fontWeight: "700",
    color: "#1A2438",
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    color: "#818DA4",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    color: "#57617A",
    fontWeight: "700",
  },
  infoDot: {
    fontSize: 12,
    color: "#7C85A0",
    fontWeight: "800",
  },
  floorRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  floorLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5F6A84",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  floorAmountText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000000",
  },
});