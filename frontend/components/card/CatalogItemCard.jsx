// components/card/CatalogItemCard.jsx
import React from "react";
import {
  TouchableOpacity,
  ImageBackground,
  Image,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Fonts } from "../../constants/theme";

export default function CatalogItemCard({ item, cardWidth, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, cardWidth ? { width: cardWidth } : styles.defaultWidth]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.cardOverlay} />
        <View style={styles.cardBottom}>
          <View style={styles.brandRow}>
            {item.brandLogo && (
              <Image
                source={{ uri: item.brandLogo }}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            )}
            <Text style={styles.brandName}>{item.brand}</Text>
          </View>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemSub}  numberOfLines={1}>{item.collection}</Text>
          <Text style={styles.itemAvail}>
            {item.available?.toLocaleString()} of {item.total?.toLocaleString()} items
          </Text>
          <View style={styles.priceRow}>
            <View style={styles.polDot} />
            <View>
              <Text style={styles.price}>{item.price}</Text>
              {!!item.usd && <Text style={styles.usd}>{item.usd}</Text>}
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#12253A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 9,
  },
  defaultWidth: { width: '47%' },
  cardImage: {
    height: 220,
    justifyContent: "flex-end",
  },
  cardImageStyle: { borderRadius: 20 },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,37,58,0.5)",
    borderRadius: 20,
  },
  cardBottom: { padding: 10, gap: 2 },
  brandRow: {
    flexDirection: "row", alignItems: "center",
    gap: 5, marginBottom: 2,
  },
  brandLogo: {
    width: 20, height: 20,
    borderRadius: 10, backgroundColor: "#FFF9F0",
  },
  brandName:  { color: "#FFF9F0", fontSize: 11, fontWeight: "700" },
  itemName:   { color: "#FFF9F0", fontSize: 16, fontWeight: "700", fontFamily: Fonts.serif },
  itemSub:    { color: "rgba(255,249,240,0.8)", fontSize: 10, fontWeight: "500" },
  itemAvail:  { color: "rgba(255,249,240,0.72)", fontSize: 10, fontStyle: "italic", marginBottom: 4 },
  priceRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  polDot:     { width: 14, height: 14, borderRadius: 7, backgroundColor: "#D95F47" },
  price:      { color: "#fff", fontSize: 12, fontWeight: "800" },
  usd:        { color: "rgba(255,249,240,0.72)", fontSize: 11, fontStyle: "italic", marginTop: 1 },
});