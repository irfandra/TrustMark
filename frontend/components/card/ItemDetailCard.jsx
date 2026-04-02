// components/card/ItemDetailCard.jsx
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  ImageBackground,
  Image,
  Text,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { Fonts } from '../../constants/theme';

const STATUS_CONFIG = {
  Requested: { color: '#888',    label: 'Requested' },
  Prepared:  { color: '#2D4A6A', label: 'Prepared'  },
  Shipped:   { color: '#B6842D', label: 'Shipped'   },
  Claimed:   { color: '#3D7A5E', label: 'Claimed'   },
};

export default function ItemDetailCard({
  item,
  cardWidth,
  onPress,
  showStatus = false,
  selected   = false,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const tagColor =
    item.rarity === 'Rare'    ? '#B6842D' :
    item.rarity === 'Limited' ? '#D95F47' :
    item.tagColor             ? item.tagColor :
                                '#2D4A6A';

  const tagLabel     = item.rarity ?? item.tag ?? '';
  const statusConfig = item.status ? STATUS_CONFIG[item.status] : null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        cardWidth ? { width: cardWidth, height: cardWidth * 1.4 } : styles.halfWidth,
        selected && styles.wrapperSelected,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <ImageBackground
          source={{ uri: item.image }}
          style={styles.cardImage}
          imageStyle={styles.cardImageStyle}
        >
          <View style={styles.cardOverlay} />

          {/* ── TOP ROW ── */}
          <View style={styles.topRow}>
            {/* ✅ Rack: status badge | Marketplace/authcheck: tag badge */}
            {showStatus && statusConfig ? (
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{statusConfig.label}</Text>
              </View>
            ) : tagLabel ? (
              <View style={[styles.tagBadge, { backgroundColor: tagColor }]}>
                <Text style={styles.tagText}>{tagLabel}</Text>
              </View>
            ) : (
              <View />
            )}

            {/* ✅ Selected checkmark */}
            {selected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </View>

          {/* ── BOTTOM CONTENT ── */}
          <View style={styles.cardBottom}>
            {/* Brand */}
            <View style={styles.brandRow}>
              {item.brandLogo && (
                <Image
                  source={{ uri: item.brandLogo }}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.brandName} numberOfLines={1}>
                {item.brand}
              </Text>
            </View>

            {/* ID */}
            {item.id && (
              <Text style={styles.itemId}>{item.id}</Text>
            )}

            {/* Name */}
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Subtitle */}
            <Text style={styles.itemSub} numberOfLines={1}>
              {item.subtitle ?? item.collection}
            </Text>

            {/* Edition */}
            {(item.edition ?? (item.available != null && item.total != null)) && (
              <Text style={styles.itemEdition}>
                {item.edition ?? `${item.available?.toLocaleString()} of ${item.total?.toLocaleString()} items`}
              </Text>
            )}

            {/* Price box */}
            {(item.price) && (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>
                  {showStatus ? 'Value' : 'Price'}
                </Text>
                <View style={styles.priceRow}>
                  <View style={styles.polDot} />
                  <View>
                    <Text style={styles.price}>{item.price}</Text>
                    {!!item.usd && <Text style={styles.usd}>{item.usd}</Text>}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    shadowColor: '#12253A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 9,
    overflow: 'hidden',
  },
  halfWidth: {
    width: '47%',
    minHeight: 220,
  },
  wrapperSelected: {
    borderWidth: 2.5,
    borderColor: '#D95F47',
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 220,
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,37,58,0.52)',
    borderRadius: 20,
  },

  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },

  // ✅ Status badge (rack)
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 20,
  },
  statusDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,249,240,0.9)',
  },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ✅ Tag badge (marketplace/authcheck)
  tagBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  tagText: { color: '#fff', fontWeight: '800', fontSize: 10 },

  // ✅ Selected checkmark
  checkmark: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#D95F47',
    alignItems: 'center', justifyContent: 'center',
  },
  checkmarkText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // ── Bottom content ──
  cardBottom: { padding: 10, gap: 2 },
  brandRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 2,
  },
  brandLogo: {
    width: 16, height: 16,
    borderRadius: 3, backgroundColor: '#f96a1b',
  },
  brandName: {
    color: 'rgba(255,249,240,0.86)',
    fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7, flex: 1,
  },
  itemId: {
    color: 'rgba(255,249,240,0.63)',
    fontSize: 9, fontWeight: '500',
  },
  itemName: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  itemSub: {
    color: 'rgba(255,249,240,0.78)',
    fontSize: 10, fontWeight: '500',
  },
  itemEdition: {
    color: 'rgba(255,249,240,0.65)',
    fontSize: 10, fontStyle: 'italic', marginBottom: 4,
  },
  priceBox: {
    backgroundColor: 'rgba(255,249,240,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: 12,
    padding: 8,
    gap: 3,
    marginTop: 4,
  },
  priceLabel: {
    color: 'rgba(255,249,240,0.72)',
    fontSize: 8, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  polDot:   { width: 14, height: 14, borderRadius: 7, backgroundColor: '#D95F47' },
  price:    { color: '#fff', fontSize: 12, fontWeight: '800' },
  usd: {
    color: 'rgba(255,249,240,0.72)',
    fontSize: 10, fontStyle: 'italic', marginTop: 1,
  },
});