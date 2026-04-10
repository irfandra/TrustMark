import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';
import { styles } from '@/constants/styles/creator-item-detail-styles.js';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800';

const formatItemStatus = (status) => {
  if (status === true || status === 1) {
    return 'In Stock';
  }

  if (status === false || status === 0) {
    return 'Not In Stock';
  }

  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'in_stock') {
    return 'In Stock';
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'out_of_stock') {
    return 'Not In Stock';
  }

  if (!normalized) {
    return 'Unknown';
  }

  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const buildFallbackItem = (params, itemId) => ({
  id: itemId,
  title: parseParam(params.name) || 'Product',
  collection: parseParam(params.collection) || 'Collection',
  brand: parseParam(params.brand) || 'Brand',
  image: parseParam(params.image) ? decodeURIComponent(parseParam(params.image)) : FALLBACK_IMAGE,
  description: 'No additional description available for this offchain product.',
  specifications: [],
  purchaseItems: [],
  activity: [],
});

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
    if (!itemData) {
      return buildFallbackItem(params, itemId);
    }

    return {
      id: itemData.id,
      title: itemData.name,
      collection: itemData.collection,
      brand: itemData.brand,
      image: itemData.image,
      description:
        itemData.description || 'No additional description available for this offchain product.',
      specifications: itemData.specifications || [],
      purchaseItems: itemData.purchaseItems || [],
      activity: itemData.activity || [],
    };
  }, [itemData, itemId, params]);

  const itemRows = useMemo(() => {
    const purchaseRows = Array.isArray(item.purchaseItems) ? item.purchaseItems : [];
    const activityRows = Array.isArray(item.activity) ? item.activity : [];

    const statusByItemId = new Map(
      activityRows.map((row) => [String(row.itemId), formatItemStatus(row.status)])
    );

    const mergedRows = purchaseRows.map((row) => {
      const rowId = String(row.id ?? row.itemId ?? 'N/A');

      return {
        itemId: rowId,
        status:
          statusByItemId.get(rowId) ||
          formatItemStatus(row.statusLabel ?? row.status),
        price: row.price || '--',
      };
    });

    const existingIds = new Set(mergedRows.map((row) => String(row.itemId)));

    activityRows.forEach((row) => {
      const activityItemId = String(row.itemId);
      if (existingIds.has(activityItemId)) {
        return;
      }

      mergedRows.push({
        itemId: activityItemId,
        status: formatItemStatus(row.status),
        price: '--',
      });
    });

    return mergedRows;
  }, [item.activity, item.purchaseItems]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#111" />
        }
      >

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descriptions</Text>
          <Text style={styles.bodyText}>{item.description}</Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Items</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>Item ID</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Price</Text>
            </View>
            <ScrollView
              style={styles.purchaseRowsScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {itemRows.map((row, idx) => (
                <View
                  key={`${row.itemId}-${idx}`}
                  style={[styles.tableRow, idx < itemRows.length && styles.tableRowBorder]}
                >
                  <Text
                    style={[styles.tableCell, styles.tableIdCell, { flex: 1.2 }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {row.itemId}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                    {row.status}
                  </Text>
                  <View style={[styles.tablePriceCell, { flex: 1 }]}> 
                    <Text style={styles.tablePriceLabel}>USD</Text>
                    <Text style={styles.tablePriceAmount}>{row.price}</Text>
                  </View>
                </View>
              ))}
              {itemRows.length === 0 && (
                <Text style={styles.emptyTableText}>No purchasable items available yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

