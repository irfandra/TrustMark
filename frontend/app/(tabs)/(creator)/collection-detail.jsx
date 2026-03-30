import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView, ScrollView, View, Text, Image, ImageBackground,
  Alert, StyleSheet, TouchableOpacity, TextInput, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collectionService } from '@/services/collectionService';
import LoadingPulse from '@/components/shared/loading-pulse';

const parseParam = (value) => (Array.isArray(value) ? value[0] : value);

// ── POL Icon ───────────────────────────────────────────────
const PolIcon = ({ size = 18 }) => (
  <View style={[s.polIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[s.polIconText, { fontSize: size * 0.5 }]}>P</Text>
  </View>
);

const getRarityBadgeStyle = (rarity) => {
  const normalized = String(rarity || '').trim().toLowerCase();
  if (normalized === 'rare') {
    return { backgroundColor: '#B8860B', color: '#fff' };
  }
  if (normalized === 'limited') {
    return { backgroundColor: '#C0392B', color: '#fff' };
  }
  return { backgroundColor: '#333', color: '#fff' };
};

// ── Mint Modal (inlined) ───────────────────────────────────
const MintListModal = ({ visible, onClose, onConfirm }) => {
  const [date, setDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (d) =>
    d?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.modalCenter} pointerEvents="box-none">
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>List Your Collections to Marketplace ?</Text>
          <Text style={s.modalBody}>
            Once the collection is listed, all items will be minted, collections cannot be
            modified, and QR code for label, certificate, and NFT will be generated..
          </Text>
          <Text style={[s.modalBody, { marginTop: 12, textAlign: 'justify' }]}>
            Define a sales time frame for the collection. When the time frame ends, the
            collection will no longer be available for sale, and any unsold NFTs will be
            automatically burned.
          </Text>
          <Text style={s.timeFrameLabel}>Time Frame</Text>
          <TouchableOpacity style={s.dateInput} onPress={() => setShowPicker(true)}>
            <Text style={date ? s.dateText : s.datePlaceholder}>
              {date ? formatDate(date) : 'Select Date'}
            </Text>
            <Ionicons name="calendar-outline" size={24} color="#555" />
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_, d) => { setShowPicker(Platform.OS === 'ios'); if (d) setDate(d); }}
            />
          )}
          <TouchableOpacity style={s.modalMintBtn} onPress={() => onConfirm?.(date)}>
            <Text style={s.modalMintBtnText}>Mint &amp; List</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────
export default function CollectionDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [showMintModal, setShowMintModal] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
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
  const tag = parseParam(params.tag) || 'Rare';
  const rarityBadgeStyle = getRarityBadgeStyle(tag);

  const totalItems = useMemo(() => {
    const total = catalogItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return total.toLocaleString();
  }, [catalogItems]);

  const soldItems = useMemo(() => {
    const sold = catalogItems.reduce((sum, item) => {
      const total = Number(item.total || 0);
      const available = Number(item.available || 0);
      return sum + Math.max(total - available, 0);
    }, 0);

    return sold.toLocaleString();
  }, [catalogItems]);

  const filtered = catalogItems.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) ||
           i.collection.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardPress = (item) =>
    router.push({
      pathname: '/item-detail',
      params: { itemId: item.id, name: item.name, collection: item.collection, brand: item.brand, available: item.available, total: item.total, priceAmount: item.priceAmount, priceUsd: item.priceUsd, image: encodeURIComponent(item.image) },
    });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#111" />
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
              <View style={[s.rareBadge, { backgroundColor: rarityBadgeStyle.backgroundColor }]}> 
                <Text style={[s.rareBadgeText, { color: rarityBadgeStyle.color }]}>{tag}</Text>
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
              <Text style={s.statLabel}>Total Items</Text>
              <Text style={s.statValue}>{totalItems}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Sold</Text>
              <Text style={s.statValue}>{soldItems}</Text>
            </View>
          </View>

          {/* ── About ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.bodyText}>
              This collection is loaded from your offchain backend products and can be listed
              without blockchain integration.
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
              <Text style={s.catalogTitle}>Catalog</Text>
              <Text style={s.catalogCount}>  {filtered.length} / {catalogItems.length}</Text>
            </View>
            <TouchableOpacity style={s.filterBtn}>
              <Ionicons name="menu" size={18} color="#222" />
              <Text style={s.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* ── Search ── */}
          <View style={s.searchWrap}>
            <Ionicons name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search Catalog"
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ── Catalog Grid ── */}
          <View style={s.grid}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.catalogCard}
                activeOpacity={0.85}
                onPress={() => handleCardPress(item)}
              >
                <ImageBackground
                  source={{ uri: item.image }}
                  style={s.cardBg}
                  imageStyle={s.cardBgImage}
                >
                  <View style={s.cardOverlay} />
                  <View style={s.cardContent}>
                    <View style={s.cardBrandRow}>
                      <View style={s.brandCircle}>
                        <Text style={s.brandCircleText}>H</Text>
                      </View>
                      <Text style={s.cardBrandName}>{item.brand}</Text>
                    </View>
                    <Text style={s.cardName}>{item.name}</Text>
                    <Text style={s.cardCollection}>{item.collection}</Text>
                    <Text style={s.cardAvailable}>
                      {item.available.toLocaleString()} of {item.total.toLocaleString()} items
                    </Text>
                    <View style={s.cardPriceRow}>
                      <PolIcon size={16} />
                      <Text style={s.cardPriceToken}>POL</Text>
                      <Text style={s.cardPriceAmount}>{item.priceAmount}</Text>
                      <Text style={s.cardPriceUsd}>{item.priceUsd}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <TouchableOpacity style={s.mintBtn} onPress={() => setShowMintModal(true)}>
            <Text style={s.mintBtnText}>Mint and List Collections</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn}>
            <Ionicons name="trash" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => router.push({ pathname: '/(tabs)/(creator)/edit-collection', params: { title, subtitle, status, tag } })}
          >
            <Ionicons name="create-outline" size={22} color="#222" />
          </TouchableOpacity>
        </View>

        {/* ── Mint Modal ── */}
        <MintListModal
          visible={showMintModal}
          onClose={() => setShowMintModal(false)}
          onConfirm={(selectedDate) => {
            if (!selectedDate) {
              Alert.alert('Date Required', 'Please select a listing date first.');
              return;
            }
            setShowMintModal(false);
            router.push({
              pathname: '/collection-detail-listed',
              params: {
                listed: true,
                collectionId,
                title,
                subtitle,
                tag,
                image: encodeURIComponent(heroImage),
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },
  container: { flex: 1 },

  heroWrap: { width: '100%', height: 260 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', backgroundColor: 'rgba(0,0,0,0.55)' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  heroContent: { position: 'absolute', bottom: 32, left: 0, right: 0, padding: 16 },
  rareBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  rareBadgeText: { fontSize: 13, fontWeight: '700' },
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
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  statLabel: { fontSize: 14, color: '#333', fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 },
  bodyText: { fontSize: 15, color: '#333', lineHeight: 23 },

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

  catalogHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  catalogTitleWrap: { flexDirection: 'row', alignItems: 'baseline' },
  catalogTitle: { fontSize: 28, fontWeight: '900', color: '#111' },
  catalogCount: { fontSize: 15, color: '#888' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#ccc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  filterText: { fontSize: 15, color: '#222', fontWeight: '500' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  catalogCard: { width: '47%', borderRadius: 18, overflow: 'hidden', height: 200 },
  cardBg: { flex: 1, justifyContent: 'flex-end' },
  cardBgImage: { borderRadius: 18 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.40)', borderRadius: 18 },
  cardContent: { padding: 10 },
  cardBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  brandCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e87722', justifyContent: 'center', alignItems: 'center' },
  brandCircleText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  cardBrandName: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardName: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 1 },
  cardCollection: { color: '#ddd', fontSize: 11, marginBottom: 1 },
  cardAvailable: { color: '#ccc', fontSize: 10, fontStyle: 'italic', marginBottom: 6 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardPriceToken: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardPriceAmount: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardPriceUsd: { color: '#bbb', fontSize: 10, textDecorationLine: 'line-through' },

  polIcon: { backgroundColor: '#7b5ea7', justifyContent: 'center', alignItems: 'center' },
  polIconText: { color: '#fff', fontWeight: '700' },

  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 10 },
  mintBtn: { flex: 1, backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  mintBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#cc0000', borderRadius: 14, width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  editBtn: { backgroundColor: '#fff', borderRadius: 14, width: 52, height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#ddd' },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 22, padding: 24, width: '88%', maxWidth: 420, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 14, lineHeight: 30 },
  modalBody: { fontSize: 14.5, color: '#333', lineHeight: 22 },
  timeFrameLabel: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 22, marginBottom: 10 },
  dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#d0d0d0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  datePlaceholder: { fontSize: 15, color: '#aaa' },
  dateText: { fontSize: 15, color: '#111', fontWeight: '600' },
  modalMintBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  modalMintBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
