import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { Fonts } from "../../constants/theme";
import { createCollectionCardStyles } from "../../constants/styles/collection-card-styles";

const styles = createCollectionCardStyles({ Fonts });

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
