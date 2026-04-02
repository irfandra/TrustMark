import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView, View, Text, Image,
  StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

// ── USD Icon ───────────────────────────────────────────────
const UsdIcon = ({ size = 18 }) => (
  <View style={[s.polIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[s.polIconText, { fontSize: size * 0.5 }]}>$</Text>
  </View>
);

const getStockBadgeStyle = (label) => {
  const normalized = String(label || '').trim().toLowerCase();
  if (normalized === 'low stock') {
    return { backgroundColor: '#D95F47', color: '#FFF9F0' };
  }
  if (normalized === 'medium stock') {
    return { backgroundColor: '#B6842D', color: '#FFF9F0' };
  }
  if (normalized === 'out of stock') {
    return { backgroundColor: '#6B5A4B', color: '#FFF9F0' };
  }
  return { backgroundColor: '#2D7A4E', color: '#FFF9F0' };
};

// ── Main Screen ────────────────────────────────────────────
export default function CollectionDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [catalogItems, setCatalogItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');

  const collectionId = parseParam(params.collectionId);

  const loadCatalogItems = useCallback(async (showInitialLoader = true) => {
    if (!collectionId) {
      setCatalogItems([]);
      setLoadError('Missing collection id');
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
      const data = await collectionService.getProductsByCollection(collectionId);
      setCatalogItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setCatalogItems([]);
      setLoadError(error?.message || 'Failed to load collection products');
    } finally {
      if (showInitialLoader) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadCatalogItems();
  }, [loadCatalogItems]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCatalogItems(false);
  }, [loadCatalogItems]);

  const heroImage = params.image
    ? decodeURIComponent(params.image)
    : 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800';
  const title = parseParam(params.title) || 'Collection';
  const subtitle = parseParam(params.subtitle) || 'Product Collection';
  const status = parseParam(params.status) || 'Draft';
  const tag = parseParam(params.tag) || 'In Stock';
  const stockBadgeStyle = getStockBadgeStyle(tag);

  const totalItems = useMemo(() => {
    const total = catalogItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return total.toLocaleString();
  }, [catalogItems]);

  const stockLeftItems = useMemo(() => {
    const stockLeft = catalogItems.reduce((sum, item) => {
      const total = Number(item.total || 0);
      const available = Number(item.available || 0);
      const normalizedAvailable = Math.max(Math.min(available, total), 0);
      return sum + normalizedAvailable;
    }, 0);

    return stockLeft.toLocaleString();
  }, [catalogItems]);

  const filtered = catalogItems.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) ||
           i.collection.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardPress = (item) =>
    router.push({
      pathname: '/item-detail',
      params: { itemId: item.id, name: item.name, collection: item.collection, brand: item.brand, available: item.available, total: item.total, priceAmount: item.priceAmount, priceUsd: item.priceUsd, currency: item.currency, image: encodeURIComponent(item.image) },
    });

  const deleteCollection = useCallback(async () => {
    if (!collectionId || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await collectionService.deleteCollection(collectionId);
      router.replace('/(tabs)/(creator)/(tabs)/collection');
    } catch (error) {
      Alert.alert('Delete Failed', error?.message || 'Unable to delete collection. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [collectionId, isDeleting, router]);

  const handleDeletePress = useCallback(() => {
    if (!collectionId) {
      Alert.alert('Missing Collection', 'Collection id is missing. Please reopen collection detail from list.');
      return;
    }

    Alert.alert(
      'Delete Collection',
      'This will permanently delete the collection and cannot be undone. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteCollection,
        },
      ]
    );
  }, [collectionId, deleteCollection]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#1E2C3A" />
          }
        >

          {/* ── Hero ── */}
          <View style={s.heroWrap}>
            <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={s.heroOverlay} />
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <View style={s.heroContent}>
              <View style={[s.stockBadge, { backgroundColor: stockBadgeStyle.backgroundColor }]}> 
                <Text style={[s.stockBadgeText, { color: stockBadgeStyle.color }]}>{tag}</Text>
              </View>
              <Text style={s.heroTitle}>{title}</Text>
              <View style={s.heroSubRow}>
                <Text style={s.heroSubText}>{subtitle}</Text>
                <Text style={s.heroDivider}>  |  </Text>
                <Text style={s.heroDraft}>{status}</Text>
              </View>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Total Produced</Text>
              <Text style={s.statValue}>{totalItems}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Stock Left</Text>
              <Text style={s.statValue}>{stockLeftItems}</Text>
            </View>
          </View>

          {/* ── About ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.bodyText}>
              This collection is loaded from your backend products and can be activated directly
              in TrustMark ownership records.
            </Text>
          </View>

          {isLoading && (
            <View style={s.loadingWrap}>
              <LoadingPulse label="Loading products..." />
            </View>
          )}

          {!isLoading && !!loadError && (
            <View style={s.errorWrap}>
              <Text style={s.errorText}>{loadError}</Text>
            </View>
          )}

          {/* ── Catalog Header ── */}
          <View style={s.catalogHeaderRow}>
            <View style={s.catalogTitleWrap}>
              <Text style={s.catalogTitle}>Catalog Library</Text>
              <Text style={s.catalogCount}>{filtered.length} of {catalogItems.length}</Text>
            </View>
            <TouchableOpacity style={s.filterBtn}>
              <Ionicons name="options-outline" size={16} color="#1E2C3A" />
              <Text style={s.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* ── Search ── */}
          <View style={s.searchWrap}>
            <Ionicons name="search" size={18} color="#7B6A58" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search catalog items"
              placeholderTextColor="#9E8F7C"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ── Catalog List ── */}
          <View style={s.catalogList}>
            {filtered.length === 0 ? (
              <View style={s.emptyCatalogWrap}>
                <Text style={s.emptyCatalogText}>No catalog items match your search.</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={s.catalogCard}
                  activeOpacity={0.9}
                  onPress={() => handleCardPress(item)}
                >
                  <Image source={{ uri: item.image }} style={s.cardThumb} resizeMode="cover" />

                  <View style={s.cardBody}>
                    <View style={s.cardTopRow}>
                      <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                      <View style={s.chevronWrap}>
                        <Ionicons name="chevron-forward" size={14} color="#1E2C3A" />
                      </View>
                    </View>

                    <Text style={s.cardCollection} numberOfLines={1}>{item.collection}</Text>

                    <View style={s.metaRow}>
                      <View style={s.metaPill}>
                        <Text style={s.metaPillText}>{item.brand}</Text>
                      </View>
                      <View style={s.metaPill}>
                        <Text style={s.metaPillText}>
                          {Number(item.available || 0).toLocaleString()} / {Number(item.total || 0).toLocaleString()} Available
                        </Text>
                      </View>
                    </View>

                    <View style={s.cardPriceRow}>
                      <UsdIcon size={16} />
                      <Text style={s.cardPriceToken}>{item.currency || 'USD'}</Text>
                      <Text style={s.cardPriceAmount}>{item.priceAmount}</Text>
                      {!!item.priceUsd && <Text style={s.cardPriceUsd}>{item.priceUsd}</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.mintBtn}
            onPress={() => router.push({
              pathname: '/(tabs)/(creator)/generate-all-qr-collections',
              params: { collectionId },
            })}
          >
            <Text style={s.mintBtnText}>Check Certificate QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.deleteBtn, isDeleting && s.deleteBtnDisabled]} onPress={handleDeletePress} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFF9F0" />
            ) : (
              <Ionicons name="trash" size={22} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/(creator)/edit-collection',
                params: {
                  collectionId,
                  title,
                  subtitle,
                  status,
                  tag,
                  image: params.image,
                },
              })
            }
          >
            <Ionicons name="create-outline" size={22} color="#222" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F1E8' },
  container: { flex: 1, backgroundColor: '#F6F1E8' },

  heroWrap: { width: '100%', height: 260 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', backgroundColor: 'rgba(0,0,0,0.55)' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  heroContent: { position: 'absolute', bottom: 32, left: 0, right: 0, padding: 16 },
  stockBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  stockBadgeText: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center' },
  heroSubText: { color: '#ddd', fontSize: 13 },
  heroDivider: { color: '#aaa', fontSize: 13 },
  heroDraft: { color: '#ddd', fontSize: 13, fontStyle: 'italic' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -28,
    zIndex: 10,
  },
  statCard: {
    flex: 1, backgroundColor: '#FFF9F0', borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D7C5',
    paddingVertical: 16, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#12253A', shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  statLabel: { fontSize: 14, color: '#6F5E4C', fontWeight: '700' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1E2C3A' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E2C3A', marginBottom: 8 },
  bodyText: { fontSize: 15, color: '#6F5E4C', lineHeight: 23 },

  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#555',
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    textAlign: 'center',
  },

  catalogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  catalogTitleWrap: { gap: 2 },
  catalogTitle: { fontSize: 30, fontWeight: '900', color: '#1E2C3A', letterSpacing: -0.3 },
  catalogCount: { fontSize: 13, color: '#8A7C6A', fontWeight: '700' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6C8B5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#FFF9F0',
  },
  filterText: { fontSize: 13, color: '#1E2C3A', fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E4D7C5',
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#3D4D61' },

  catalogList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyCatalogWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D7C5',
    backgroundColor: '#FFF9F0',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  emptyCatalogText: {
    textAlign: 'center',
    color: '#8A7C6A',
    fontSize: 13,
  },
  catalogCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4D7C5',
    overflow: 'hidden',
    shadowColor: '#12253A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  cardThumb: {
    width: 118,
    minHeight: 132,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chevronWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D6C8B5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E2',
  },
  cardName: {
    color: '#1E2C3A',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  cardCollection: {
    color: '#6F5E4C',
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4D7C5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#F8EFE2',
  },
  metaPillText: {
    color: '#6B5A4B',
    fontSize: 11,
    fontWeight: '700',
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  cardPriceToken: { color: '#3D4D61', fontSize: 11, fontWeight: '800' },
  cardPriceAmount: { color: '#1E2C3A', fontSize: 12, fontWeight: '800' },
  cardPriceUsd: { color: '#8A7C6A', fontSize: 10, textDecorationLine: 'line-through' },

  polIcon: { backgroundColor: '#D95F47', justifyContent: 'center', alignItems: 'center' },
  polIconText: { color: '#fff', fontWeight: '700' },

  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F6F1E8', borderTopWidth: 1, borderTopColor: '#E4D7C5', gap: 10 },
  mintBtn: { flex: 1, backgroundColor: '#1E2C3A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  mintBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#D95F47', borderRadius: 14, width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  deleteBtnDisabled: { opacity: 0.7 },
  editBtn: { backgroundColor: '#FFF9F0', borderRadius: 14, width: 52, height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#D6C8B5' },

});
