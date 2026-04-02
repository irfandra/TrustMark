import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';

const { width: SW } = Dimensions.get('window');
const isTablet = SW >= 768;

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

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
  if (normalized === 'no stock') {
    return { backgroundColor: '#9E8F7C', color: '#FFF9F0' };
  }
  return { backgroundColor: '#2D7A4E', color: '#FFF9F0' };
};

const UsdIcon = ({ size = 18 }) => (
  <View style={[s.polIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[s.polIconText, { fontSize: size * 0.5 }]}>$</Text>
  </View>
);

const SectionHeader = ({ title, count, onFilter }) => (
  <View style={s.sectionHeaderRow}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={s.sectionHeaderTitle}>{title}</Text>
      {count ? <Text style={s.sectionHeaderCount}>  {count}</Text> : null}
    </View>
    <TouchableOpacity style={s.filterBtn} onPress={onFilter}>
      <Ionicons name="options-outline" size={16} color="#1E2C3A" />
      <Text style={s.filterText}>Filter</Text>
    </TouchableOpacity>
  </View>
);

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <View style={s.searchWrap}>
    <Ionicons name="search" size={18} color="#7B6A58" style={{ marginRight: 8 }} />
    <TextInput
      style={s.searchInput}
      placeholder={placeholder}
      placeholderTextColor="#9E8F7C"
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const DataTable = ({ headers, rows, renderRow, maxHeight }) => (
  <View style={s.table}>
    <View style={[s.tableRow, { marginBottom: 4 }]}>
      {headers.map((h, i) => (
        <Text
          key={i}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[s.tableCell, s.tableHeaderText, { flex: h.flex || 1 }]}
        >
          {h.label}
        </Text>
      ))}
    </View>
    {maxHeight ? (
      <ScrollView
        style={{ maxHeight }}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {rows.map((row, idx) => (
          <View key={idx} style={[s.tableRow, idx < rows.length - 1 && s.tableRowCard]}>
            {renderRow(row)}
          </View>
        ))}
      </ScrollView>
    ) : (
      rows.map((row, idx) => (
        <View key={idx} style={[s.tableRow, idx < rows.length - 1 && s.tableRowCard]}>
          {renderRow(row)}
        </View>
      ))
    )}
  </View>
);

export default function CollectionDetailListed() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Catalog');
  const [catalogItems, setCatalogItems] = useState([]);
  const [activityRows, setActivityRows] = useState([]);
  const [ownerRows, setOwnerRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      const [products, activity, owners] = await Promise.all([
        collectionService.getProductsByCollection(collectionId),
        collectionService.getCollectionActivity(collectionId),
        collectionService.getCollectionOwners(collectionId),
      ]);
      setCatalogItems(Array.isArray(products) ? products : []);
      setActivityRows(Array.isArray(activity) ? activity : []);
      setOwnerRows(Array.isArray(owners) ? owners : []);
    } catch (error) {
      setCatalogItems([]);
      setActivityRows([]);
      setOwnerRows([]);
      setLoadError(error?.message || 'Failed to load active products');
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
    ? decodeURIComponent(parseParam(params.image))
    : 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800';
  const title = parseParam(params.title) || 'Birkin Collections';
  const subtitle = parseParam(params.subtitle) || 'Luxury Bags';
  const endDate = parseParam(params.endDate) || 'Ends in 14/04/2026  23:59';
  const status = parseParam(params.status) || 'Active';
  const normalizedStatus = String(status).trim().toLowerCase();
  const isActiveStatus = normalizedStatus === 'active' || normalizedStatus === 'listed';
  const tag = parseParam(params.tag) || 'In Stock';
  const stockBadgeStyle = getStockBadgeStyle(tag);
  const tagColor = parseParam(params.tagColor) || stockBadgeStyle.backgroundColor;
  const tagTextColor = parseParam(params.tagTextColor) || stockBadgeStyle.color;

  const totalItems = useMemo(() => {
    const fromParams = parseParam(params.items) || parseParam(params.itemsCount);
    if (fromParams) {
      const cleaned = String(fromParams).replace(/[^0-9,]/g, '');
      if (cleaned) return cleaned;
    }

    const total = catalogItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return total.toLocaleString('en-US');
  }, [params.items, params.itemsCount, catalogItems]);

  const stockLeftItems = useMemo(() => {
    const stockLeft = catalogItems.reduce((sum, item) => {
      const total = Number(item.total || 0);
      const available = Number(item.available || 0);
      const normalizedAvailable = Math.max(Math.min(available, total), 0);
      return sum + normalizedAvailable;
    }, 0);

    return stockLeft.toLocaleString('en-US');
  }, [catalogItems]);

  const filtered = catalogItems.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(keyword) ||
      item.collection.toLowerCase().includes(keyword)
    );
  });

  const filteredActivity = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) {
      return activityRows;
    }

    return activityRows.filter((row) =>
      [row.itemId, row.productName, row.status]
        .some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [activityRows, search]);

  const filteredOwners = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) {
      return ownerRows;
    }

    return ownerRows.filter((row) =>
      [row.id, row.edition, row.price]
        .some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [ownerRows, search]);

  const handleCardPress = (item) =>
    router.push({
      pathname: '/item-detail',
      params: {
        itemId: item.id,
        name: item.name,
        collection: item.collection,
        brand: item.brand,
        available: item.available,
        total: item.total,
        priceAmount: item.priceAmount,
        priceUsd: item.priceUsd,
        currency: item.currency,
        image: encodeURIComponent(item.image),
      },
    });

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
          <View style={s.heroWrap}>
            <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={s.heroOverlay} />

            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={16} color="#000" />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>

            <View style={s.heroContent}>
              <View style={[s.badge, { backgroundColor: tagColor }]}> 
                <Text style={[s.badgeText, { color: tagTextColor }]}>{tag}</Text>
              </View>
              <Text style={s.heroTitle}>{title}</Text>
              <View style={s.heroSubRow}>
                {[subtitle, status, endDate].map((t, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={s.heroDivider}> | </Text>}
                    <Text style={s.heroSub}>{t}</Text>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>

          <View style={s.statsRow}>
            {[[ 'Total Produced', totalItems ], [ 'Stock Left', stockLeftItems ]].map(([label, val]) => (
              <View key={label} style={s.statCard}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={s.statValue}>{val}</Text>
              </View>
            ))}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.bodyText}>
              This active collection view is connected to backend data and styled to the requested design.
            </Text>
          </View>

          <View style={s.tabs}>
            {['Catalog', 'Activity', 'Owners'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Catalog' && (
            <>
              <SectionHeader title="Catalog Library" count={`${filtered.length} of ${catalogItems.length || 0}`} />
              <SearchBar value={search} onChange={setSearch} placeholder="Search catalog items" />

              {isLoading && (
                <View style={s.loadingWrap}>
                  <LoadingPulse label="Loading active products..." />
                </View>
              )}

              {!isLoading && !!loadError && (
                <View style={s.errorWrap}>
                  <Text style={s.errorText}>{loadError}</Text>
                </View>
              )}

              {!isLoading && !loadError && (
                <View style={s.catalogList}>
                  {filtered.length === 0 ? (
                    <View style={s.emptyCatalogWrap}>
                      <Text style={s.emptyCatalogText}>No catalog items match your search.</Text>
                    </View>
                  ) : (
                    filtered.map((item) => (
                      <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.9} onPress={() => handleCardPress(item)}>
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
                            <Text style={s.cardPriceAmt}>{item.priceAmount}</Text>
                            {!!item.priceUsd && <Text style={s.cardPriceUsd}>{item.priceUsd}</Text>}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </>
          )}

          {activeTab === 'Activity' && (
            <>
              <SectionHeader title="Item Status" count={`${filteredActivity.length}/ ${activityRows.length || 0}`} />
              <SearchBar value={search} onChange={setSearch} placeholder="Search Item Status" />
              <View style={s.tableSection}>
                <DataTable
                  headers={[
                    { label: 'Item ID', flex: 1.2 },
                    { label: 'Product', flex: 1.6 },
                    { label: 'Status', flex: 1.2 },
                  ]}
                  maxHeight={240}
                  rows={filteredActivity}
                  renderRow={(row) => [
                    <Text key="i" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.2, fontSize: 12 }]}>{row.itemId}</Text>,
                    <Text key="p" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.6, fontSize: 12 }]}>{row.productName || '-'}</Text>,
                    <Text key="s" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.2, fontSize: 12 }]}>{row.status}</Text>,
                  ]}
                />
                {!isLoading && filteredActivity.length === 0 && (
                  <Text style={s.emptyTableText}>No item status recorded yet.</Text>
                )}
              </View>
            </>
          )}

          {activeTab === 'Owners' && (
            <>
              <SectionHeader title="Owners" count={`${filteredOwners.length}/ ${ownerRows.length || 0}`} />
              <SearchBar value={search} onChange={setSearch} placeholder="Search Owners" />
              <View style={s.tableSection}>
                <DataTable
                  headers={[
                    { label: 'Owners', flex: 1.2 },
                    { label: 'Items', flex: 1.5 },
                    { label: 'Total Value', flex: 1.8 },
                  ]}
                  rows={filteredOwners}
                  renderRow={(row) => [
                    <Text key="id" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.2 }]}>{row.id}</Text>,
                    <Text key="ed" numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1.5 }]}>{row.edition}</Text>,
                    <View key="pr" style={{ flex: 1.8, flexDirection: 'row', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                      <UsdIcon size={16} />
                      <Text style={s.tablePriceLabel}>USD</Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={[s.tableCell, { flex: 1 }]}>{row.price}</Text>
                    </View>,
                  ]}
                />
                {!isLoading && filteredOwners.length === 0 && (
                  <Text style={s.emptyTableText}>No ownership records found yet.</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {activeTab === 'Catalog' && !isActiveStatus && (
          <View style={s.footer}>
            <TouchableOpacity
              style={s.mintBtn}
              onPress={() => router.push('/generate-all-qr-collections')}
            >
              <Text style={s.mintBtnText}>Generate All QR</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F1E8' },
  container: { flex: 1, backgroundColor: '#F6F1E8' },

  heroWrap: { width: '100%', height: 280, zIndex: 1, overflow: 'visible' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backText: { color: '#000', fontSize: 15, fontWeight: '600' },

  heroContent: { position: 'absolute', bottom: 32, left: 0, right: 0, padding: 16 },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  heroSub: { color: '#ddd', fontSize: 13, fontStyle: 'italic' },
  heroDivider: { color: '#aaa', fontSize: 13 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -28,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4D7C5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#12253A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  statLabel: { fontSize: 14, color: '#6F5E4C', fontWeight: '700' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1E2C3A' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E2C3A', marginBottom: 8 },
  bodyText: { fontSize: 15, color: '#6F5E4C', lineHeight: 23 },

  tabs: { flexDirection: 'row', marginTop: 24, marginBottom: 4, paddingHorizontal: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#D6C8B5',
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFF9F0',
  },
  tabBtnActive: { backgroundColor: '#1E2C3A', borderColor: '#1E2C3A' },
  tabText: { fontSize: isTablet ? 17 : 15, color: '#5D6674' },
  tabTextActive: { color: '#FFF9F0', fontWeight: '700' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeaderTitle: { fontSize: 28, fontWeight: '900', color: '#1E2C3A' },
  sectionHeaderCount: { fontSize: 13, color: '#8A7C6A', fontWeight: '700' },
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
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#3D4D61' },

  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 8,
  },
  loadingText: { fontSize: 13, color: '#555' },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  errorText: { fontSize: 12, color: '#b91c1c', textAlign: 'center' },

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
  card: {
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
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cardPriceToken: { color: '#3D4D61', fontSize: 11, fontWeight: '800' },
  cardPriceAmt: { color: '#1E2C3A', fontSize: 12, fontWeight: '800' },
  cardPriceUsd: { color: '#8A7C6A', fontSize: 10, textDecorationLine: 'line-through' },

  tableSection: { paddingHorizontal: 16, marginTop: 4 },
  table: { backgroundColor: '#f2f2f2', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 8 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  tableRowCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 3,
    paddingHorizontal: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  tableCell: { flex: 1, fontSize: 13, color: '#333', overflow: 'hidden' },
  tableHeaderText: { fontWeight: '700', fontStyle: 'italic', fontSize: 13, color: '#222' },
  tablePriceLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  emptyTableText: { textAlign: 'center', color: '#666', fontSize: 13, marginTop: 10, marginBottom: 2 },

  polIcon: { backgroundColor: '#D95F47', justifyContent: 'center', alignItems: 'center' },
  polIconText: { color: '#fff', fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F6F1E8',
    borderTopWidth: 1,
    borderTopColor: '#E4D7C5',
  },
  mintBtn: {
    flex: 1,
    backgroundColor: '#1E2C3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  mintBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

});
