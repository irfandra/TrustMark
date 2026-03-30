import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView, ScrollView, View, Text,
  ImageBackground, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

const POL_ICON = () => (
  <View style={styles.polIcon}>
    <Text style={styles.polIconText}>P</Text>
  </View>
);

export default function ItemDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const itemId = parseParam(params.itemId);
  const [itemData, setItemData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadItem = useCallback(async (showInitialLoader = true) => {
    if (!itemId) {
      setLoadError('Missing item id');
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
      return;
    }

    try {
      if (showInitialLoader) {
        setIsLoading(true);
      }
      setLoadError('');
      const data = await collectionService.getProductById(itemId);
      setItemData(data);
    } catch (error) {
      setItemData(null);
      setLoadError(error?.message || 'Failed to load item details');
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadItem(false);
  }, [loadItem]);

  const item = useMemo(() => {
    if (itemData) {
      return {
        id: itemData.id,
        title: itemData.name,
        collection: itemData.collection,
        brand: itemData.brand,
        brandLogo: null,
        image: itemData.image,
        description:
          itemData.description ||
          'No additional description available for this offchain product.',
        specifications: itemData.specifications,
        priceToken: 'POL',
        priceAmount: itemData.priceAmount,
        priceUsd: itemData.priceUsd,
        purchaseItems: itemData.purchaseItems,
        activity: itemData.activity,
      };
    }

    return {
      id: itemId,
      title: parseParam(params.name) || 'Product',
      collection: parseParam(params.collection) || 'Collection',
      brand: parseParam(params.brand) || 'Brand',
      brandLogo: null,
      image: parseParam(params.image)
        ? decodeURIComponent(parseParam(params.image))
        : 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      description: 'No additional description available for this offchain product.',
      specifications: [],
      priceToken: 'POL',
      priceAmount: parseParam(params.priceAmount) || '--',
      priceUsd: parseParam(params.priceUsd) || '',
      purchaseItems: [],
      activity: [],
    };
  }, [itemData, itemId, params]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#111" />
        }
      >

        {/* ── Hero Header ── */}
        <ImageBackground source={{ uri: item.image }} style={styles.headerBg}>
          <View style={styles.headerOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>{item.title}</Text>
            <View style={styles.heroBrandRow}>
              <Text style={styles.heroBrandCollection}>{item.collection}</Text>
              <Text style={styles.heroDivider}>  |  </Text>
              <View style={styles.brandCircle}>
                <Text style={styles.brandCircleText}>H</Text>
              </View>
              <Text style={styles.heroBrandName}>{item.brand}</Text>
            </View>
          </View>
        </ImageBackground>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <LoadingPulse label="Loading item details..." />
          </View>
        )}

        {!isLoading && !!loadError && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Text style={styles.errorSubText}>Showing fallback details from route params.</Text>
          </View>
        )}

        {/* ── Descriptions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descriptions</Text>
          <Text style={styles.bodyText}>{item.description}</Text>
        </View>

        {/* ── Specification ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specification</Text>
          <View style={styles.pillRow}>
            {item.specifications.map((spec) => (
              <View key={spec.label} style={styles.specPill}>
                <Text style={styles.specPillText}>
                  <Text style={styles.specPillLabel}>{spec.label} : </Text>
                  {spec.value}
                </Text>
              </View>
            ))}
            {item.specifications.length === 0 && (
              <Text style={styles.emptyText}>No specification details yet.</Text>
            )}
          </View>
        </View>

        {/* ── Purchase Item ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Item</Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price</Text>
            <View style={styles.priceTokenWrap}>
              <POL_ICON />
              <Text style={styles.priceTokenLabel}>{item.priceToken}</Text>
              <Text style={styles.priceAmount}>{item.priceAmount}</Text>
            </View>
            <Text style={styles.priceUsd}>{item.priceUsd}</Text>
          </View>

          {/* Items table */}
          <View style={styles.table}>
            {/* Table header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>Items ID</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.5 }]}>Edition</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.8 }]}>Price</Text>
            </View>
            <ScrollView
              style={styles.purchaseRowsScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {item.purchaseItems.map((row, idx) => (
                <View
                  key={row.id}
                  style={[styles.tableRow, idx < item.purchaseItems.length - 1 && styles.tableRowBorder]}
                >
                  <Text
                    style={[styles.tableCell, styles.tableIdCell, { flex: 1.2 }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {row.id}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.edition}</Text>
                  <View style={[styles.tablePriceCell, { flex: 1.8 }]}> 
                    <POL_ICON />
                    <Text style={styles.tablePriceLabel}>POL</Text>
                    <Text style={styles.tablePriceAmount}>{row.price}</Text>
                  </View>
                </View>
              ))}
              {item.purchaseItems.length === 0 && (
                <Text style={styles.emptyTableText}>No purchasable items available yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>

        {/* ── Activity ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.table}>
            {/* Table header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              {['Event', 'Items', 'Price', 'From', 'To'].map((h) => (
                <Text key={h} style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>{h}</Text>
              ))}
            </View>
            {item.activity.map((row, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx < item.activity.length - 1 && styles.tableRowBorder]}
              >
                <Text style={[styles.tableCell, { flex: 1, fontSize: 12 }]}>{row.event}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 12 }]}>{row.item}</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={[styles.tableCell, { fontSize: 11, fontWeight: '700' }]}>POL</Text>
                  <Text style={{ fontSize: 11 }}>{row.price}</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 11 }]}>{row.from}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 11 }]}>{row.to}</Text>
              </View>
            ))}
            {item.activity.length === 0 && (
              <Text style={styles.emptyTableText}>No activity yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },

  // Hero
  headerBg: { height: 260, justifyContent: 'flex-end' },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  heroBottom: { padding: 18, paddingBottom: 20 },
  heroTitle: {
    fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8,
  },
  heroBrandRow: { flexDirection: 'row', alignItems: 'center' },
  heroBrandCollection: { color: '#ddd', fontSize: 14, fontWeight: '500' },
  heroDivider: { color: '#aaa', fontSize: 14 },
  brandCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#e87722',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 5,
  },
  brandCircleText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroBrandName: { color: '#fff', fontSize: 14, fontWeight: '600' },

  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#555',
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
    textAlign: 'center',
  },

  // Sections
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 10 },
  bodyText: { fontSize: 15, color: '#333', lineHeight: 23 },

  // Spec pills
  pillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  specPill: {
    backgroundColor: '#111', borderRadius: 30,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  emptyText: {
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
  },
  specPillText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  specPillLabel: { fontWeight: '700' },

  // Price row
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e8e8e8',
    marginBottom: 12,
  },
  priceLabel: { fontSize: 15, color: '#444', fontWeight: '500', flex: 1 },
  priceTokenWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 2 },
  priceTokenLabel: { fontWeight: '700', fontSize: 15, color: '#111' },
  priceAmount: { fontWeight: '600', fontSize: 15, color: '#111' },
  priceUsd: { fontSize: 14, color: '#888', flex: 1, textAlign: 'right' },

  // POL icon
  polIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#7b5ea7',
    justifyContent: 'center', alignItems: 'center',
  },
  polIconText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Table
  table: {
    backgroundColor: '#f2f2f2',
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  purchaseRowsScroll: {
    maxHeight: 260,
  },
  tableHeader: { marginBottom: 4 },
  tableHeaderText: { fontWeight: '700', fontStyle: 'italic', fontSize: 14, color: '#222' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  tableRowBorder: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 4,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tableCell: { flex: 1, fontSize: 13, color: '#333' },
  tableIdCell: { flexShrink: 1, paddingRight: 4 },
  tablePriceCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tablePriceLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  tablePriceAmount: { fontSize: 13, color: '#333' },
  emptyTableText: {
    paddingVertical: 10,
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
