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
import { createCreatorCollectionDetailListedStyles } from '@/constants/styles/creator-collection-detail-listed-styles.js';

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

  const handleBackToCollectionHome = useCallback(() => {
    router.replace('/(tabs)/(collection)/collection');
  }, [router]);

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
      pathname: '/(collection)/item-detail',
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

            <TouchableOpacity style={s.backBtn} onPress={handleBackToCollectionHome}>
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
                            <Text style={s.cardPriceToken}>USD</Text>
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
              onPress={() =>
                router.push({
                  pathname: '/(collection)/generate-all-qr-collections',
                  params: { collectionId },
                })
              }
            >
              <Text style={s.mintBtnText}>Generate All QR</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const s = createCreatorCollectionDetailListedStyles({ isTablet });
